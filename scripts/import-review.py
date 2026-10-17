"""Import user-supplied MARINA reviewer PDFs using table geometry and answer marks.
Usage: python3 scripts/import-review.py /path/to/NW.pdf /path/to/EW.pdf
Requires PyMuPDF. Runtime website has no Python dependency.
Unmarked/ambiguous/incomplete rows are quarantined, never guessed.
"""
import sys, json, re, hashlib, shutil
from pathlib import Path
import fitz

ROOT = Path(__file__).resolve().parents[1]
def extract(path, track):
    doc = fitz.open(path)
    rows = []
    for pi, page in enumerate(doc):
        if pi == 0: continue
        draws = page.get_drawings()
        bounds = sorted(set(round(float(d['rect'].y0), 1) for d in draws
            if 40 < d['rect'].x0 < 44 and 80 < d['rect'].x1 < 85
            and d['rect'].height < 1 and d.get('fill') == (0, 0, 0)))
        # Some tables end in a row continued on the next page.
        if len(bounds) < 2: continue
        words = page.get_text('words')
        marks = [d['rect'] for d in draws if d.get('fill') and
                 d['fill'][0] > .9 and d['fill'][1] > .9 and d['fill'][2] < .2]
        for a in page.annots() or []:
            if a.type[0] == 8:
                # Quads avoid the bounding rectangle swallowing adjacent rows.
                vs = a.vertices or []
                marks.extend(fitz.Quad(vs[i:i+4]).rect for i in range(0,len(vs),4))
        for top, bottom in zip(bounds, bounds[1:]):
            if bottom-top < 3: continue
            cells = []
            edges = [42,84,214.2,300,386,472,559]
            for left,right in zip(edges,edges[1:]):
                ws = [w for w in words if left <= (w[0]+w[2])/2 < right
                      and top < (w[1]+w[3])/2 < bottom]
                ws.sort(key=lambda w:(round(w[1]/3),w[0]))
                cells.append(' '.join(w[4] for w in ws).strip())
            if cells[0] == 'Nr' or cells[1] == 'Questions': continue
            if not any(cells): continue
            number = re.fullmatch(r'\d+',cells[0])
            if number:
                row = dict(id=track+'-'+cells[0],number=int(cells[0]),page=pi+1,
                           pages=[pi+1],question=cells[1],options=cells[2:],marks=set())
                rows.append(row)
            elif not cells[0] and rows:
                row=rows[-1]
                if pi+1 not in row['pages']: row['pages'].append(pi+1)
                row['question'] += ' '+cells[1]
                row['options'] = [(' '.join([a,b])).strip() for a,b in zip(row['options'],cells[2:])]
            else: continue
            for mark in marks:
                if top < (mark.y0+mark.y1)/2 < bottom:
                    cx=(mark.x0+mark.x1)/2
                    for idx,(left,right) in enumerate(zip(edges[2:],edges[3:])):
                        if left < cx < right: row['marks'].add(idx)
    good=[]; excluded=[]; seen=set()
    for row in rows:
        reason=[]
        row['question']=re.sub(r'\s+',' ',row['question']).strip()
        row['options']=[re.sub(r'\s+',' ',x).strip() for x in row['options']]
        if len(row['marks']) != 1: reason.append('missing or multiple marked answers')
        if not row['question'] or not all(row['options']): reason.append('incomplete table text')
        if len(set(x.lower() for x in row['options'])) != 4: reason.append('duplicate options')
        if row['id'] in seen: reason.append('duplicate source number')
        if re.search(r'(?:figure|diagram|illustration|shown (?:above|below)|refer to (?:the )?(?:sketch|drawing))',row['question'],re.I): reason.append('requires source figure')
        seen.add(row['id'])
        marks=sorted(row.pop('marks'))
        if reason: excluded.append(dict(**row,markedOptions=marks,reason=reason))
        else: good.append(dict(**row,answer=marks[0],set=(row['number']-1)//50+1))
    return dict(id=track,title='OIC '+('NW' if track=='nw' else 'EW'),
        subtitle='Navigational Watch' if track=='nw' else 'Engine Watch',
        source=Path(path).name,sha256=hashlib.sha256(Path(path).read_bytes()).hexdigest(),
        pageCount=len(doc),questions=good), dict(track=track,parsed=len(rows),included=len(good),excluded=excluded)

if __name__=='__main__':
    banks=[];audit=[]
    for path,track in zip(sys.argv[1:],['nw','ew']):
        b,a=extract(path,track);banks.append(b);audit.append(a)
        (ROOT/'dist/assets/review').mkdir(parents=True,exist_ok=True)
        shutil.copyfile(path,ROOT/('dist/assets/review/'+track+'.pdf'))
    if len(banks)!=2: raise SystemExit('Pass the NW and EW PDFs, in that order.')
    (ROOT/'dist/review-bank.js').write_text('"use strict";\nconst reviewBanks='+json.dumps(banks,ensure_ascii=False,separators=(',',':'))+';\n')
    (ROOT/'review-import-audit.json').write_text(json.dumps(audit,indent=2,ensure_ascii=False))
    print(json.dumps([{k:v for k,v in a.items() if k!='excluded'}|{'excluded':len(a['excluded'])} for a in audit]))
