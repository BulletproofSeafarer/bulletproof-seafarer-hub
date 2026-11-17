import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Anchor, ArrowDownToLine, ArrowRight, Bell, Check, ChevronDown, ChevronRight, CircleAlert, Compass, FileCheck2, FileText, Files, FolderClosed, LayoutGrid, List, LockKeyhole, Pencil, Plus, Search, Settings, Share, Ship, ShieldCheck, UploadCloud, UserRound, Wrench, X } from 'lucide-react';
import { assembleCV } from './cv';
import { Tools } from './Tools';
import { readiness, status } from './readiness';
import { reminders } from './reminders';
import { categories, storage, types, type Data, type DocumentRecord, type Kind } from './storage';

type Tab = 'Documents' | 'Voyage' | 'Tools' | 'Profile' | 'Reminders';
type Dialog = { mode: 'document'; item?: DocumentRecord; kind?: Kind } | { mode: 'detail'; item: DocumentRecord } | { mode: 'voyage' | 'profile' | 'settings' } | { mode: 'service' | 'requirement' | 'checklist'; id?: string };
const tabs = [{ name: 'Documents', icon: Files }, { name: 'Voyage', icon: Compass }, { name: 'Tools', icon: Wrench }, { name: 'Profile', icon: UserRound }] as const;
const kinds = Object.keys(types) as Kind[];
const allStatuses = ['Valid', 'Expiring Soon', 'Expired', 'No Expiry Recorded'];
const id = () => crypto.randomUUID();
const field = (form: FormData, name: string) => String(form.get(name) || '').trim();
const formatted = (date: string) => date ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(date + 'T12:00:00Z')) : '—';
type Legacy = Window & { navigate?: (path: string) => void; toolboxToolDirectory?: () => string; toolboxUtilityPage?: (path: string) => string };

function Badge({ value }: { value: string }) {
  const tone = ['Valid', 'Met', 'Voyage Ready'].includes(value) ? 'green' : ['Expired', 'Missing'].includes(value) ? 'red' : ['Expiring Soon', 'Expiring Before Join', 'Needs Review'].includes(value) ? 'amber' : 'gray';
  return <span className={'badge ' + tone}><span />{value}</span>;
}

function Modal({ children, title, close }: { children: ReactNode; title: string; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} aria-label={title} onCancel={event => { event.preventDefault(); close(); }}>
    <div className="modal-heading"><h2>{title}</h2><button className="icon-button" aria-label="Close" onClick={close}><X size={20} /></button></div>
    {children}
  </dialog>;
}

function Attachment({ file, report }: { file: File; report: (message: string) => void }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  async function share() {
    try {
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: file.name });
      else {
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        link.click();
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) report('Could not share this file. Try Download.');
    }
  }
  return <div className="attachment">
    {url && (file.type.startsWith('image/') ? <img src={url} alt={file.name} /> : <object data={url} type="application/pdf" aria-label={file.name}><p>Use Open file to preview this PDF.</p></object>)}
    <div className="flex flex-wrap gap-2">
      <a className="secondary" href={url} target="_blank" rel="noreferrer">Open file</a>
      <a className="secondary" href={url} download={file.name}><ArrowDownToLine size={16} /> Download</a>
      <button className="secondary" onClick={share}><Share size={16} /> Share</button>
    </div>
  </div>;
}

export function App() {
  const [data, setData] = useState<Data>();
  const [tab, setTab] = useState<Tab>(() => new URLSearchParams(location.search).get('tab') === 'tools' ? 'Tools' : 'Documents');
  const [dialog, setDialog] = useState<Dialog>();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All documents');
  const [statusFilter, setStatusFilter] = useState('');
  const [grid, setGrid] = useState(false);
  const [utility, setUtility] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const saving = useRef(false);
  const legacy = window as Legacy;

  useEffect(() => {
    storage.load().then(setData).catch(() => setError('Could not open this device’s storage. Reload to try again.')).finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    legacy.navigate = path => setUtility(path.startsWith('utility-') ? path.slice(8) : '');
    return () => { delete legacy.navigate; };
  }, [legacy]);
  useEffect(() => { document.title = 'Toolbox · ' + tab; }, [tab]);

  async function save(next: Data, message = 'Changes saved', close = true) {
    if (saving.current) return;
    saving.current = true;
    setError('');
    try {
      await storage.save(next);
      setData(next);
      if (close) setDialog(undefined);
      setNotice(message);
    } catch {
      setError('Could not save changes to this device. Check available storage and try again.');
    } finally { saving.current = false; }
  }

  function navigate(next: Tab) {
    setTab(next);
    setUtility('');
    window.scrollTo(0, 0);
  }

  if (!data) return <main className="p-8">{loading ? 'Opening Toolbox…' : <p role="alert">{error}</p>}</main>;

  const voyage = data.voyage;
  const requirements = readiness(voyage, data.documents);
  const met = requirements.filter(row => row.result === 'Met').length;
  const blockers = requirements.length - met;
  const openTasks = voyage.checklist.filter(task => !task.done).length;
  const queue = reminders(data);
  const attention = data.documents.filter(item => ['Expired', 'Expiring Soon'].includes(status(item, data.reminderDays)));
  const filtered = data.documents.filter(item => (category === 'All documents' || types[item.kind] === category) &&
    (!statusFilter || status(item, data.reminderDays) === statusFilter) &&
    [item.title, item.kind, item.issuer].some(value => value.toLowerCase().includes(query.trim().toLowerCase())));
  const cv = assembleCV(data);
  const initials = data.profile.name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('') || 'TB';

  function focusRequirement(row: typeof requirements[number]) {
    setDialog(row.document ? { mode: 'detail', item: row.document } : { mode: 'document', kind: row.requirement.kind });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dialog || !data) return;
    const form = new FormData(event.currentTarget);
    const next = { ...data };
    let message = 'Changes saved';
    switch (dialog.mode) {
      case 'document': {
        const title = field(form, 'title');
        const issued = field(form, 'issued');
        const expiry = field(form, 'expiry');
        const upload = form.get('attachment');
        if (!title || (issued && expiry && issued > expiry)) { setError('Enter a name and an expiry date on or after the issue date.'); return; }
        if (upload instanceof File && upload.size && !/^image\/|^application\/pdf$/.test(upload.type)) { setError('Choose a PDF or image.'); return; }
        if (upload instanceof File && upload.size > 25 * 1024 * 1024) { setError('Choose an attachment smaller than 25 MB.'); return; }
        const item = { id: dialog.item?.id ?? id(), title, kind: field(form, 'kind') as Kind, expiry, issued, issuer: field(form, 'issuer'),
          file: upload instanceof File && upload.size ? upload : dialog.item?.file };
        next.documents = dialog.item ? data.documents.map(doc => doc.id === item.id ? item : doc) : [item, ...data.documents];
        message = dialog.item ? 'Document updated' : 'Document added';
        break;
      }
      case 'voyage':
        next.voyage = { ...voyage, vessel: field(form, 'vessel'), role: field(form, 'role'), joining: field(form, 'joining') };
        break;
      case 'requirement': {
        const kind = field(form, 'kind') as Kind;
        if (voyage.requirements.some(requirement => requirement.kind === kind && requirement.id !== dialog.id)) { setError('This document type is already required.'); return; }
        const requirement = { id: dialog.id ?? id(), kind, expires: form.has('expires') };
        next.voyage = { ...voyage, requirements: dialog.id ? voyage.requirements.map(item => item.id === dialog.id ? requirement : item) : [...voyage.requirements, requirement] };
        break;
      }
      case 'checklist': {
        if (!field(form, 'title')) { setError('Enter a task name.'); return; }
        const task = { id: dialog.id ?? id(), title: field(form, 'title'), due: field(form, 'due'), done: voyage.checklist.find(item => item.id === dialog.id)?.done ?? false };
        next.voyage = { ...voyage, checklist: dialog.id ? voyage.checklist.map(item => item.id === dialog.id ? task : item) : [...voyage.checklist, task] };
        break;
      }
      case 'profile':
        next.profile = { name: field(form, 'name'), rank: field(form, 'rank'), email: field(form, 'email'), summary: field(form, 'summary') };
        break;
      case 'settings':
        next.reminderDays = Number(form.get('days'));
        break;
      case 'service': {
        const service = { id: dialog.id ?? id(), vessel: field(form, 'vessel'), role: field(form, 'role'), start: field(form, 'start'), end: field(form, 'end') };
        if (service.end && service.end < service.start) { setError('Sign-off must be on or after sign-on.'); return; }
        next.services = [...data.services.filter(item => item.id !== service.id), service];
        break;
      }
      default: return;
    }
    void save(next, message);
  }

  function open(next: Dialog) { setError(''); setDialog(next); }

  const heading = (title: string, intro: string, action?: ReactNode) => <div className="page-heading"><div><h1>{title}</h1><p>{intro}</p></div>{action}</div>;

  function documents() {
    return <>
      {heading('Documents', 'Manage your maritime documents and stay ready to sail.', <button className="primary" onClick={() => open({ mode: 'document' })}><Plus size={19} /> Add document</button>)}
      <section className="voyage-hero">
        <div className="hero-copy">
          <div className="hero-kicker"><Ship size={16} /> UPCOMING VOYAGE</div>
          <h2>{voyage.vessel}</h2>
          <p>{voyage.role}<span>·</span>Joins {formatted(voyage.joining)}</p>
          <button onClick={() => navigate('Voyage')}>View voyage <ArrowRight size={16} /></button>
        </div>
        <div className="hero-progress"><strong>{met}<small> / {requirements.length}</small></strong><span>Documents ready</span></div>
      </section>
      {(blockers > 0 || attention.length > 0) && <button className="attention" onClick={() => navigate(blockers ? 'Voyage' : 'Reminders')}>
        <span className="attention-icon"><CircleAlert size={22} /></span>
        <span><strong>Needs attention</strong><small>{blockers ? `${blockers} voyage document ${blockers === 1 ? 'requirement needs' : 'requirements need'} attention before joining.` : `${attention.length} ${attention.length === 1 ? 'document needs' : 'documents need'} renewal.`}</small></span>
        <span className="attention-action">Review <ArrowRight size={16} /></span>
      </button>}
      <section className="library">
        <div className="section-heading"><div className="flex items-center gap-3"><h2>Document library</h2><span className="count">{data!.documents.length}</span></div>
          <div className="view-options" aria-label="Library view"><button aria-label="List view" aria-pressed={!grid} onClick={() => setGrid(false)}><List size={18} /></button><button aria-label="Grid view" aria-pressed={grid} onClick={() => setGrid(true)}><LayoutGrid size={17} /></button></div></div>
        <div className="filters">
          <label className="search"><Search size={18} /><input aria-label="Search documents" placeholder="Search documents…" value={query} onChange={event => setQuery(event.target.value)} /></label>
          <label className="status-filter"><select aria-label="Filter by status" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="">All statuses</option>{allStatuses.map(value => <option key={value}>{value}</option>)}</select><ChevronDown size={16} /></label>
        </div>
        <div className="chips" aria-label="Document categories">{['All documents', ...categories].map(value => <button key={value} aria-pressed={category === value} onClick={() => setCategory(value)}>{value}</button>)}</div>
        <div className={grid ? 'doc-grid' : 'doc-list'}>
          {!grid && <div className="doc-table-head"><span>Document name</span><span>Expiry date</span><span>Status</span><span /></div>}
          {filtered.map(item => <button className="doc-row" key={item.id} onClick={() => open({ mode: 'detail', item })}>
            <span className="doc-name"><span className={'file-icon ' + (types[item.kind] === 'Certificates' ? 'certificate' : '')}>{types[item.kind] === 'Certificates' ? <FileCheck2 size={21} /> : <FileText size={21} />}</span><span><strong>{item.title}</strong><small>{types[item.kind]}</small></span></span>
            <span className="doc-date">{formatted(item.expiry)}</span><Badge value={status(item, data!.reminderDays)} /><ChevronRight className="row-arrow" size={17} />
          </button>)}
          {!filtered.length && <div className="empty"><FolderClosed size={24} /><p>No matching documents.</p><button className="secondary" onClick={() => { setQuery(''); setCategory('All documents'); setStatusFilter(''); }}>Clear filters</button></div>}
        </div>
      </section>
    </>;
  }

  function voyagePage() {
    return <>
      {heading('Voyage readiness', 'Track the documents and tasks you need before joining.', <button className="secondary" onClick={() => open({ mode: 'voyage' })}>Edit voyage</button>)}
      <section className="panel voyage-panel"><div><div className="flex items-center gap-2 text-sm"><Ship size={18} /> Current voyage</div><h2>{voyage.vessel}</h2><p>{voyage.role} · Joins {formatted(voyage.joining)}</p></div><Badge value={blockers || openTasks || !voyage.joining || !requirements.length ? 'Needs Review' : 'Voyage Ready'} /></section>
      <section className="panel">
        <div className="section-heading"><div><h2>Required documents</h2><p>{met} of {requirements.length} requirements met</p></div><button className="secondary" onClick={() => open({ mode: 'requirement' })}><Plus size={17} /> Add requirement</button></div>
        {!requirements.length && <p className="subtle">Add a requirement to start assessing this voyage.</p>}
        {requirements.map(row => <div className="item-line" key={row.requirement.id}>
          <button className="item-main" onClick={() => focusRequirement(row)}><span><strong>{row.requirement.kind}</strong><small>{row.document?.title ?? 'Add a matching document'}</small></span><Badge value={row.result} /><ChevronRight size={16} /></button>
          <button className="icon-button" aria-label={'Edit ' + row.requirement.kind + ' requirement'} onClick={() => open({ mode: 'requirement', id: row.requirement.id })}><Pencil size={16} /></button>
          <button className="icon-button" aria-label={'Remove ' + row.requirement.kind + ' requirement'} onClick={() => void save({ ...data!, voyage: { ...voyage, requirements: voyage.requirements.filter(item => item.id !== row.requirement.id) } }, 'Requirement removed')}><X size={17} /></button>
        </div>)}
      </section>
      <section className="panel" id="voyage-checklist">
        <div className="section-heading"><div><h2>Pre-voyage checklist</h2><p>{openTasks} remaining</p></div><button className="secondary" onClick={() => open({ mode: 'checklist' })}><Plus size={17} /> Add task</button></div>
        {!voyage.checklist.length && <p className="subtle">No checklist items yet.</p>}
        {voyage.checklist.map(task => <div className="item-line" key={task.id}><label className="item-main justify-start"><input type="checkbox" checked={task.done} onChange={() => void save({ ...data!, voyage: { ...voyage, checklist: voyage.checklist.map(item => item.id === task.id ? { ...item, done: !item.done } : item) } }, task.done ? 'Task reopened' : 'Task completed')} /><span><strong>{task.title}</strong><small>{task.due ? 'Due ' + formatted(task.due) : 'No due date'}</small></span></label><button className="icon-button" aria-label={'Edit ' + task.title} onClick={() => open({ mode: 'checklist', id: task.id })}><Pencil size={16} /></button><button className="icon-button" aria-label={'Remove ' + task.title} onClick={() => void save({ ...data!, voyage: { ...voyage, checklist: voyage.checklist.filter(item => item.id !== task.id) } }, 'Task removed')}><X size={17} /></button></div>)}
      </section>
    </>;
  }

  function reminderPage() {
    return <>
      {heading('Reminders', 'Upcoming renewals and pre-voyage tasks.', <button className="secondary" onClick={() => open({ mode: 'settings' })}><Settings size={17} /> Settings</button>)}
      <section className="panel">{!queue.length && <p className="subtle">You’re caught up. New reminders will appear here.</p>}
        {queue.map(item => <button className="item-main reminder-row" key={item.kind + item.id} onClick={() => {
          if (item.kind === 'document') {
            const doc = data!.documents.find(record => record.id === item.id);
            if (doc) open({ mode: 'detail', item: doc });
          } else {
            navigate('Voyage');
            requestAnimationFrame(() => document.getElementById('voyage-checklist')?.scrollIntoView({ block: 'center' }));
          }
        }}><span className="file-icon"><Bell size={19} /></span><span><strong>{item.title}</strong><small>Due {formatted(item.date)}</small></span><ChevronRight size={17} /></button>)}
      </section>
    </>;
  }

  function profilePage() {
    return <>
      {heading('Profile', 'Manage your maritime career and personal settings.', <button className="secondary" onClick={() => open({ mode: 'settings' })}><Settings size={18} /> Settings</button>)}
      <section className="panel"><div className="section-heading"><div><h2>{data!.profile.name || 'Your profile'}</h2><p>{data!.profile.rank}</p></div><button className="secondary" onClick={() => open({ mode: 'profile' })}>Edit profile</button></div><p>{data!.profile.summary}</p></section>
      <section className="panel"><div className="section-heading"><div><h2>Sea Service</h2><p>{data!.services.length} service records</p></div><button className="secondary" onClick={() => open({ mode: 'service' })}><Plus size={17} /> Add service</button></div>
        {cv.services.map(item => <button className="item-main reminder-row" key={item.id} onClick={() => open({ mode: 'service', id: item.id })}><span><strong>{item.vessel} · {item.role}</strong><small>{formatted(item.start)} – {item.end ? formatted(item.end) : 'Present'}</small></span><ChevronRight size={17} /></button>)}
      </section>
      <section className="panel"><div className="section-heading"><div><h2>Maritime CV</h2><p>Select certificates to include in your CV.</p></div><button className="primary" onClick={() => window.print()}>Print / Save PDF</button></div>
        {data!.documents.filter(item => types[item.kind] === 'Certificates').map(item => <label className="cv-choice" key={item.id}><input type="checkbox" checked={data!.cvIds.includes(item.id)} onChange={() => void save({ ...data!, cvIds: data!.cvIds.includes(item.id) ? data!.cvIds.filter(key => key !== item.id) : [...data!.cvIds, item.id] }, 'CV updated')} />{item.title}</label>)}
        <article id="cv-preview" className="cv-preview"><h2>{cv.profile.name}</h2><p>{cv.profile.rank} · {cv.profile.email}</p><p>{cv.profile.summary}</p><h3>Sea Service</h3>{cv.services.map(item => <p key={item.id}>{item.vessel} · {item.role} · {formatted(item.start)} – {item.end ? formatted(item.end) : 'Present'}</p>)}<h3>Certificates</h3>{cv.certificates.map(item => <p key={item.id}>{item.title} · {item.issuer || 'Issuer not recorded'} · {item.verification}{item.expiry && ' · Expires ' + formatted(item.expiry)}</p>)}</article>
      </section>
    </>;
  }

  function renderDialog() {
    if (!dialog) return;
    const close = () => { setDialog(undefined); setError(''); };
    if (dialog.mode === 'detail') {
      const item = dialog.item;
      return <Modal title={item.title} close={close}>
        <div className="detail-data"><Badge value={status(item, data!.reminderDays)} /><p>{types[item.kind]} · {item.kind}</p><dl><div><dt>Expiry date</dt><dd>{formatted(item.expiry)}</dd></div><div><dt>Issue date</dt><dd>{formatted(item.issued)}</dd></div><div><dt>Issuer</dt><dd>{item.issuer || '—'}</dd></div></dl></div>
        {item.file ? <Attachment file={item.file} report={setError} /> : <p className="file-empty"><FileText size={18} /> No attachment added</p>}
        {error && <p role="alert" className="error">{error}</p>}
        <div className="form-actions"><details className="action-menu"><summary>More actions</summary><button type="button" onClick={() => {
          if (window.confirm('Delete this document and its attachment?')) void save({ ...data!, documents: data!.documents.filter(doc => doc.id !== item.id), cvIds: data!.cvIds.filter(key => key !== item.id) }, 'Document deleted');
        }}>Delete document</button></details><button className="primary" onClick={() => open({ mode: 'document', item })}>Edit document</button></div>
      </Modal>;
    }
    let title: string;
    let fields: ReactNode;
    switch (dialog.mode) {
      case 'document': {
        const item = dialog.item;
        title = item ? 'Edit document' : 'Add document';
        fields = <><label>Document name<input name="title" required maxLength={120} defaultValue={item?.title ?? dialog.kind ?? ''} /></label><label>Document type<select name="kind" defaultValue={item?.kind ?? dialog.kind ?? 'Passport'}>{kinds.map(kind => <option key={kind}>{kind}</option>)}</select></label><label>Issuer<input name="issuer" defaultValue={item?.issuer} maxLength={120} /></label><div className="form-pair"><label>Issue date<input type="date" name="issued" defaultValue={item?.issued} /></label><label>Expiry date<input type="date" name="expiry" defaultValue={item?.expiry} /></label></div><label className="upload"><UploadCloud size={22} /> {item?.file ? 'Replace ' + item.file.name : 'Attach a PDF or photo'}<input type="file" name="attachment" accept="application/pdf,image/*" /></label></>;
        break;
      }
      case 'voyage':
        title = 'Edit voyage';
        fields = <><label>Vessel<input required name="vessel" defaultValue={voyage.vessel} maxLength={120} /></label><label>Role<input required name="role" defaultValue={voyage.role} maxLength={120} /></label><label>Joining date<input required name="joining" type="date" defaultValue={voyage.joining} /></label></>;
        break;
      case 'requirement': {
        const item = voyage.requirements.find(requirement => requirement.id === dialog.id);
        title = item ? 'Edit document requirement' : 'Add document requirement';
        fields = <><label>Document type<select name="kind" defaultValue={item?.kind}>{kinds.map(kind => <option key={kind}>{kind}</option>)}</select></label><label className="inline-check"><input name="expires" type="checkbox" defaultChecked={item?.expires ?? true} /> Expiry date required</label></>;
        break;
      }
      case 'checklist': {
        const item = voyage.checklist.find(task => task.id === dialog.id);
        title = item ? 'Edit checklist task' : 'Add checklist task';
        fields = <><label>Task name<input required name="title" maxLength={120} defaultValue={item?.title} /></label><label>Due date<input name="due" type="date" defaultValue={item?.due} /></label></>;
        break;
      }
      case 'profile':
        title = 'Edit profile';
        fields = <><label>Name<input required name="name" defaultValue={data!.profile.name} maxLength={120} /></label><label>Rank<input name="rank" defaultValue={data!.profile.rank} maxLength={120} /></label><label>Email<input name="email" type="email" defaultValue={data!.profile.email} /></label><label>Professional summary<textarea name="summary" defaultValue={data!.profile.summary} maxLength={1000} /></label></>;
        break;
      case 'settings':
        title = 'Reminder settings';
        fields = <label>Renewal lead time (days)<input required name="days" type="number" min={1} max={365} defaultValue={data!.reminderDays} /></label>;
        break;
      case 'service': {
        const item = data!.services.find(service => service.id === dialog.id);
        title = item ? 'Edit sea service' : 'Add sea service';
        fields = <><label>Vessel<input required name="vessel" defaultValue={item?.vessel} /></label><label>Role<input required name="role" defaultValue={item?.role} /></label><div className="form-pair"><label>Sign-on<input required name="start" type="date" defaultValue={item?.start} /></label><label>Sign-off<input name="end" type="date" defaultValue={item?.end} /></label></div></>;
        break;
      }
    }
    return <Modal title={title} close={close}><form key={title} className="editor" onSubmit={submit}>{fields}{error && <p role="alert" className="error">{error}</p>}<div className="form-actions"><button type="button" className="secondary" onClick={close}>Cancel</button><button className="primary" type="submit">{dialog.mode === 'document' ? 'Save document' : 'Save changes'}</button></div></form></Modal>;
  }

  return <>
    <aside className="sidebar">
      <button className="brand" onClick={() => navigate('Documents')} aria-label="Toolbox home"><span className="brand-symbol"><Anchor size={23} /></span><span>Toolbox<small>CREW WORKSPACE</small></span></button>
      <nav aria-label="Main navigation">{tabs.map(({ name, icon: Icon }) => <button key={name} aria-current={tab === name ? 'page' : undefined} onClick={() => navigate(name)}><Icon size={20} /><span>{name}</span></button>)}</nav>
      <div className="sidebar-foot"><button aria-current={tab === 'Reminders' ? 'page' : undefined} onClick={() => navigate('Reminders')}><Bell size={19} /> Reminders {queue.length ? <span className="sidebar-count">{queue.length}</span> : null}</button><div className="local"><span /><LockKeyhole size={14} /> Stored on this device</div></div>
    </aside>
    <div className="workspace">
      <header className="topbar"><button className="mobile-brand" onClick={() => navigate('Documents')}><Anchor size={21} /> Toolbox</button><div className="breadcrumb"><span>Workspace</span><ChevronRight size={15} /><strong>{tab}</strong></div><div className="top-actions"><button className="icon-button notification" aria-label="Open reminders" onClick={() => navigate('Reminders')}><Bell size={21} />{queue.length > 0 && <i />}</button><button className="avatar" aria-label="Open profile" onClick={() => navigate('Profile')}>{initials}</button></div></header>
      <main className="content">
        {error && !dialog && <p className="error" role="alert">{error}</p>}
        {tab === 'Documents' && documents()}
        {tab === 'Voyage' && voyagePage()}
        {tab === 'Reminders' && reminderPage()}
        {tab === 'Profile' && profilePage()}
        {tab === 'Tools' && (utility ? <div className="panel legacy" dangerouslySetInnerHTML={{ __html: legacy.toolboxUtilityPage?.(utility) || '' }} /> : <Tools utilityDirectory={legacy.toolboxToolDirectory?.() || ''} />)}
        <footer className="content-foot"><ShieldCheck size={16} /> Toolbox preview <span>·</span> Use sample documents</footer>
      </main>
    </div>
    {notice && <div className="toast" role="status"><Check size={18} />{notice}<button aria-label="Dismiss message" onClick={() => setNotice('')}><X size={16} /></button></div>}
    {renderDialog()}
  </>;
}
