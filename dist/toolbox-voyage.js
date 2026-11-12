// Learning Voyage uses the same bundled sources as the full reviewer.
function createLearningVoyage(data, escape, repaint, openLibrary) {
  const key = 'toolbox-learning-voyage-v1';
  let progress;
  try { progress = JSON.parse(localStorage.getItem(key)); } catch {}
  if (!progress?.routes) progress = { route: '', routes: {} };
  let playing = false, selection = null, checked = false, storageWarning = '';
  const phases = ['Learn', 'Practice', 'Challenge'];
  const ends = [5, 15, 20];
  const pools = new Map();
  const labels = {deck:'OIC Deck',engine:'OIC Engine',olp:'OLP',cbt:'Toolbox CBT',gmdss:'GMDSS',study:'Maritime study',speak:'Maritime speaking',interview:'Interview practice',mlc:'MLC Deck'};
  const interviews = [
    'Introduce yourself and the role you are applying for.','Describe a task you have personally performed.','Explain one skill you are developing.','Describe how you prepare for a handover.','Explain how you ask for clarification.',
    'Describe working with a new crewmate.','Give an example of receiving feedback.','Explain what you observed during training.','Describe how you organized two competing tasks.','Describe a time you asked for help.',
    'Explain a technical term in plain English.','Describe an error and what you learned.','Describe a task you completed under supervision.','Explain the responsibilities you held on your last assignment.','Describe how you checked your understanding.',
    'Introduce yourself in three sentences.','Give a specific example supporting your strongest skill.','Explain which part of that example you handled personally.','Describe what you would do differently next time.','Ask the interviewer one question about the role.'
  ];
  function pool(route) {
    if (pools.has(route)) return pools.get(route);
    let items;
    if (route === 'interview') items = interviews.map(question=>({question,topic:'Interview practice',oral:true}));
    else if (route === 'speak') items = (data.speak?.days || []).flatMap(day=>
      [day.scenario, ...(day.drill || [])].filter(Boolean).map(question=>({question,topic:day.title,oral:true,model:day.strong})));
    else if (route === 'study') items = (data.study?.lessons || []).flatMap(l=>l.questions.map(q=>({...q,question:q.stem,topic:l.title})));
    else if (route === 'deck' || route === 'engine') items = (data.oic?.questions || []).filter(q=>q.track===route);
    else if (route === 'mlc') items = (data['mlc-nw']?.questions || []).filter(q=>!q.needsFigure).map(q=>({...q,oral:true,model:q.options.join(' / ')}));
    else items = data[route]?.questions || [];
    const valid = items.filter(q=>q.oral || (!q.needsFigure && !q.keyWarning && q.options?.length && (q.answers ?? [q.answer]).length && (q.answers ?? [q.answer]).every(i=>Number.isInteger(i)&&i>=0&&i<q.options.length)));
    if(valid.length)pools.set(route,valid);
    return valid;
  }
  function save() {
    try {localStorage.setItem(key,JSON.stringify(progress));}
    catch {storageWarning='Device storage is unavailable. Progress will last for this session.';}
  }
  const button = (action,label,extra='')=>'<button type="button" class="vy-button" data-voyage="'+action+'" '+extra+'>'+label+'</button>';
  function render() {
    const route=progress.route, items=pool(route), run=progress.routes[route];
    const routes=Object.entries(labels).map(([id,label])=>'<option value="'+id+'" '+(route===id?'selected':'')+'>'+label+'</option>').join('');
    const art=(name,cls)=>'<img alt="" class="'+cls+'" src="assets/voyage-art/'+name+'.webp">';
    const destination={deck:'bridge',engine:'engine',speak:'radio',gmdss:'radio',interview:'interview'}[route] || 'classroom';
    const library=button('library','Full reviewer &amp; mock exams');
    if (!route) return '<article class="vy welcome"><img width="110" src="assets/toolbox-mascot-learn.webp" alt=""><h1>Welcome aboard</h1><p>Choose your learning voyage.</p><select aria-label="Choose a route" data-voyage-route><option value="">Choose route</option>'+routes+'</select>'+library+'</article>';
    const total=Math.ceil(items.length/20), level=run.level, count=run.answers.length;
    const title=labels[route];
    const milestones=run?.results?.length ? '<p>'+run.results.length+' levels completed · '+(20*run.results.length)+' XP</p>' : '';
    const warning=storageWarning?'<p role="alert">'+storageWarning+'</p>':'';
    if (!playing || level>=total) {
      const first=Math.max(0,Math.min(level,total-1)-1);
      const stops=Array.from({length:Math.min(4,total-first)},(_,i)=>{
        const n=first+i, q=items[n*20];
        return button('start',art(n<level?'complete':n===level?'current':'locked','vy-marker')+'Level '+(n+1)+' · '+escape(q.topic || data[route]?.topics?.find(t=>t.id===q.topicId)?.title || title),n===level?'':'disabled');
      }).join('');
      return '<article class="vy">'+warning+'<h1>Learning Voyage</h1><select data-voyage-route aria-label="Learning route">'+routes+'</select><div class="vy-chart">'+art(destination,'vy-destination')+''+art('ship','vy-boat')+''+stops+'</div>'+milestones+'<p>'+(!total?'Study material is available in the reviewer.':level>=total?'Route completed.':count?'Resume level · '+count+' of 20 answered':'Each level has three rounds of 5, 10 and 5.')+'</p>'+library+'</article>';
    }
    const phase=run.phase, start=phase?ends[phase-1]:0;
    function score(answers) {
      const oral=answers.filter(a=>a==='spoken').length, graded=answers.length-oral;
      return [graded?answers.filter(a=>a===true).length+' / '+graded+' correct':'',oral?oral+' speaking tasks completed':''].filter(Boolean).join(' · ');
    }
    if (count===ends[phase] && !checked) return '<article class="vy">'+warning+'<h1>'+phases[phase]+' complete</h1><p>'+score(run.answers.slice(start))+'</p>'+(phase===2?'<p>Level result · '+score(run.answers)+'</p>':'')+button('advance',phase===2?'Return to voyage':'Continue to '+phases[phase+1])+'</article>';
    const pos=checked?count-1:count;
    const q=items[(level*20+pos)%items.length], keys=q.answers ?? [q.answer];
    const choices=(q.options||[]).map((v,i)=>{
      const selected=selection?.includes(i);
      const status=checked?(keys.includes(i)?'correct':selected?'wrong':''):selected?'chosen':'';
      return button('option',escape(v)+(checked&&keys.includes(i)?' ✓':''),'data-index="'+i+'" data-state="'+status+'" aria-pressed="'+!!selected+'" '+(checked?'disabled':''));
    }).join('');
    return '<article class="vy">'+warning+button('map','← Voyage map')+'<p>'+title+' · Level '+(level+1)+' · '+phases[phase]+' '+(pos-start+1)+'/'+(ends[phase]-start)+'</p><progress max="20" value="'+count+'"></progress><h2>'+escape(q.question)+'</h2>'+(q.oral?(typeof speechSynthesis!=='undefined'?button('listen','Listen to prompt'):'')+'<p>Speak aloud, or rehearse silently. Check that your answer is clear and specific.</p>'+ (q.model?'<details><summary>Example response</summary>'+escape(q.model)+'</details>':'')+button('spoken','Mark practice complete'): (keys.length>1?'<p>Select all correct answers.</p>':'')+choices+(checked?'<p role="status">'+(run.answers[pos]?'Correct.':'Review the highlighted answer.')+' '+escape(q.explanation||'')+'</p>'+button('next','Continue'):button('check','Check answer',selection?.length?'':'disabled')))+'</article>';
  }
  function leave(){playing=false;selection=null;checked=false;}
  function change(route) {
    if (!labels[route]) return;
    progress.route=route;
    progress.routes[route] ||= {level:0,phase:0,answers:[]};
    playing=false;checked=false;selection=null;save();repaint();
  }
  function click(b) {
    const action=b.dataset.voyage, run=progress.routes[progress.route];
    if(action==='library'){playing=false;openLibrary();return;}
    if(action==='listen'){
      const items=pool(progress.route),q=items[(run.level*20+run.answers.length)%items.length];
      const utterance=new SpeechSynthesisUtterance(q.question);
      utterance.lang='en-US';speechSynthesis.cancel();speechSynthesis.speak(utterance);return;
    }
    if(action==='start') playing=true;
    if(action==='map') playing=false;
    if(action==='option'||action==='check'){
      const items=pool(progress.route),q=items[(run.level*20+run.answers.length)%items.length],keys=q.answers??[q.answer];
      if(action==='option'){
        const i=Number(b.dataset.index);
        selection=keys.length===1?[i]:(selection||[]).includes(i)?selection.filter(x=>x!==i):[...(selection||[]),i];
        repaint();return;
      }
      if(!selection?.length||checked)return;
      run.answers.push(keys.length===selection.length&&keys.every(i=>selection.includes(i)));
      checked=true;save();repaint();return;
    }
    if(action==='spoken')run.answers.push('spoken');
    if(action==='advance'){
      if(run.phase===2){(run.results ||= []).push([...run.answers]);run.level++;run.phase=0;run.answers=[];playing=false;}
      else run.phase++;
    }
    selection=null;checked=false;save();repaint();
  }
  return {render,change,click,leave};
}
