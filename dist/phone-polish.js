'use strict';
// Compact task screens. Content remains free to grow with text size and long questions.
let hubReviewSet=1;
let hubShelfDepartment='',hubAnswerDepartment='';
function hubLibraryChoices(){
  const groups=matchingShelfTopics(),departments=Object.keys(groups).filter(d=>groups[d].length);
  if(!departments.length)return '<p class="hint" role="status">No matching topics.</p>';
  if(!departments.includes(hubShelfDepartment))hubShelfDepartment=departments.length===1?departments[0]:'';
  const topics=groups[hubShelfDepartment]||[];
  return `<div class="hub-department-grid">${departments.map(d=>`<button type="button" data-hub-shelf-dept="${esc(d)}" class="${d===hubShelfDepartment?'active':''}" aria-pressed="${d===hubShelfDepartment}"><span aria-hidden="true">${d==='Engine'?'⚙':d==='Deck'?'⚓':d==='Electrical'?'ϟ':'▤'}</span>${esc(d)}<b aria-hidden="true">›</b></button>`).join('')}</div>${topics.length?`<section class="card hub-topic-select"><label class="field">${esc(hubShelfDepartment)} topic<select id="hubShelfSelect" aria-label="Choose a topic first"><option value="">Choose a topic</option>${topics.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('')}</select></label><button type="button" class="btn" id="hubOpenShelf" disabled>Open topic →</button></section>`:''}`;
}
function hubWireLibraryChoices(){const select=document.querySelector('#hubShelfSelect');if(select)select.onchange=e=>{const b=document.querySelector('#hubOpenShelf');b.disabled=!e.target.value;b.dataset.shelfTopic=e.target.value}}
shelfRoot=function(){
  shelfTopic=null;
  app.innerHTML=`<header class="shelf-heading"><h1>Library</h1></header><label class="search">${icon('search')}<input id="shelfTopicSearch" type="search" aria-label="Find a topic" placeholder="Find a topic: FWG, mooring…" value="${esc(shelfTopicQuery)}"></label><div id="shelfTopics">${hubLibraryChoices()}</div>`;
  document.querySelector('#shelfTopicSearch').oninput=e=>{shelfTopicQuery=e.target.value;document.querySelector('#shelfTopics').innerHTML=hubLibraryChoices();hubWireLibraryChoices()};hubWireLibraryChoices();
};
answerTask=function(){
  const picked=state.answerTopics,departments=Object.keys(topicsByDepartment);if(!departments.includes(hubAnswerDepartment))hubAnswerDepartment=departments.includes(state.profile.department)?state.profile.department:departments[0];
  const questions=all().filter(q=>picked.includes(q.equipment)&&q.status!=='Resolved'&&(includeAnswered||!q.answers.length));
  return `<section class="card hub-answer-picker"><div class="hub-picker-fields"><label class="field">Department<select id="hubAnswerDepartment">${departments.map(d=>`<option ${d===hubAnswerDepartment?'selected':''}>${esc(d)}</option>`).join('')}</select></label><label class="field">Topic<select id="hubAnswerTopic"><option value="">Choose a topic</option>${topicsByDepartment[hubAnswerDepartment].filter(t=>!picked.includes(t)).map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('')}</select></label></div><button type="button" class="btn" id="hubAddAnswerTopic" disabled>Find questions →</button></section>${picked.length?`<div class="chips">${picked.map(t=>`<button class="chip active" data-answer-topic="${esc(t)}">${esc(t)} ×</button>`).join('')}</div><div class="task-options"><span>${questions.length} discussions</span><label><input type="checkbox" id="includeAnswered" ${includeAnswered?'checked':''}>Include answered</label></div>${questions.map(card).join('')||'<div class="empty">No unanswered questions here.</div>'}`:''}`;
};
chooseReview=function(option){
  const s=state.review.session;
  if(!s||s.done||s.answers[s.ids[s.index]]!==undefined||![0,1,2,3].includes(option))return false;
  const id=s.ids[s.index],q=reviewIndex.get(id);if(!q)return false;
  return reviewCommit(()=>{s.answers[id]=option;const old=state.review.records[id];state.review.records[id]={attempts:(old?.attempts||0)+1,correct:option===q.answer};s.choice=null});
};
reviewLanding=function(){
  app.innerHTML=`<header class="hub-task-heading"><h1>Review</h1><p>Choose your reviewer.</p></header><div class="review-track-grid">${reviewBanks.map(b=>`<button class="review-track" data-review-track="${b.id}"><span class="review-track-icon" aria-hidden="true">${b.id==='nw'?'◈':'⚙'}</span><strong>${b.title}</strong><span>${b.subtitle}</span><small>${b.questions.length.toLocaleString()} questions</small><b>Choose →</b></button>`).join('')}</div><p class="hub-key-note">Practice keys are provisional. Use ? for guidance.</p>`;
};
reviewTrackView=function(){
  const b=reviewBank();if(!b){reviewLanding();return}
  const r=state.review,records=b.questions.filter(q=>r.records[q.id]),correct=records.filter(q=>r.records[q.id].correct).length,missed=records.length-correct;
  const sets=reviewSets(b),filtered=sets.filter(s=>!reviewFilter||s.questions.some(q=>(q.question+' '+q.number).toLowerCase().includes(reviewFilter.toLowerCase())));
  const picked=filtered.find(s=>s.set===hubReviewSet)||filtered[0];if(picked)hubReviewSet=picked.set;
  const setCorrect=picked?.questions.filter(q=>r.records[q.id]?.correct).length||0;
  app.innerHTML=`<button class="back" data-review-action="tracks">← Reviewers</button><header class="hub-task-heading"><h1>${b.title}</h1></header><div class="review-track-switch" role="group" aria-label="Reviewer">${reviewBanks.map(x=>`<button data-review-track="${x.id}" aria-pressed="${x.id===b.id}" class="${x.id===b.id?'active':''}">${x.title}</button>`).join('')}</div><section class="review-journey card"><div class="hub-inline-stat"><span>Latest-attempt progress</span><strong>${correct} / ${b.questions.length.toLocaleString()}</strong></div><progress value="${correct}" max="${b.questions.length}" aria-label="Questions answered correctly on latest attempt"></progress></section>${r.session?.track===b.id&&!r.session.done?'<button class="btn hub-resume" data-review-action="resume">Continue your round →</button>':''}<section class="card review-set-picker"><label class="field">Practice set<select id="reviewSetSelect" ${picked?'':'disabled'}>${filtered.map(x=>`<option value="${x.set}" ${x.set===picked?.set?'selected':''}>Set ${String(x.set).padStart(2,'0')} · Q${x.questions[0].number}–${x.questions.at(-1).number}</option>`).join('')}</select></label><label class="search">${icon('search')}<input id="reviewSearch" type="search" value="${esc(reviewFilter)}" placeholder="Find a word or question number" aria-label="Find practice sets"></label>${picked?`<div class="hub-inline-stat"><span>${picked.questions.length} questions</span><span>${setCorrect} correct</span></div><progress max="${picked.questions.length}" value="${setCorrect}" aria-label="Selected set progress"></progress><div class="review-actions"><button class="btn" data-review-start="${picked.set}">Start 10 questions →</button><button class="btn quiet" data-review-read="${picked.set}">Read answers</button></div>`:'<p role="status">No matching sets.</p>'}</section><div class="review-quick-actions"><button class="btn quiet" data-review-start="all">Mixed round</button><button class="btn quiet" data-review-action="mistakes" ${missed?'':'disabled'}>Mistakes · ${missed}</button><button class="text-button" data-crew-flags="true">Flagged · ${r.flagged.filter(id=>id.startsWith(b.id+'-')).length}</button></div><p class="hub-key-note">Source-order sets · provisional answer keys</p>`;
  document.querySelector('#reviewSetSelect').onchange=e=>{hubReviewSet=Number(e.target.value);render()};
  document.querySelector('#reviewSearch').oninput=e=>{reviewFilter=e.target.value;reviewSetPage=0;const start=e.target.selectionStart;reviewTrackView();const next=document.querySelector('#reviewSearch');next.focus();next.setSelectionRange?.(start,start)};
};
reviewQuestionView=function(){
  const s=state.review.session,q=reviewIndex.get(s?.ids[s.index]);if(!q){reviewTrackView();return}if(s.done){reviewResultView();return}
  const checked=s.answers[q.id]!==undefined,chosen=checked?s.answers[q.id]:null;
  app.innerHTML=`<button class="back" data-review-action="sets">← Practice sets</button><div class="review-round-meta"><strong>${reviewBank().title} · ${s.set?'Set '+s.set:'Mixed round'}</strong><span>${s.index+1} / ${s.ids.length}</span></div><progress class="review-round-progress" value="${s.index+(checked?1:0)}" max="${s.ids.length}" aria-label="Round progress"></progress><article class="card review-question"><span class="eyebrow">QUESTION ${q.number}</span><h1 id="reviewPrompt">${esc(q.question)}</h1><div class="review-options" role="group" aria-labelledby="reviewPrompt">${q.options.map((text,i)=>`<button class="review-option ${chosen===i?'selected':''} ${checked&&i===q.answer?'correct':''} ${checked&&chosen===i&&i!==q.answer?'incorrect':''}" data-review-choice="${i}" aria-pressed="${chosen===i}" ${checked?'disabled':''}><b>${'ABCD'[i]}</b><span>${esc(text)}</span>${checked&&i===q.answer?'<strong aria-label="Marked answer">✓</strong>':checked&&chosen===i?'<strong aria-label="Incorrect">×</strong>':''}</button>`).join('')}</div><div id="reviewFeedback" aria-live="polite" aria-atomic="true">${checked?`<section class="review-feedback ${chosen===q.answer?'right':'retry'}"><strong>${chosen===q.answer?'Correct':'Incorrect'} · marked key</strong><p><b>${'ABCD'[q.answer]}.</b> ${esc(q.options[q.answer])}</p></section>`:''}</div><div class="review-actions"><button class="btn" data-review-action="next" ${checked?'':'disabled'}>${s.index+1===s.ids.length?'See my score':'Next question'} →</button></div><div class="review-question-foot">${reviewSource(q)}<button class="text-button" data-review-flag="${q.id}" aria-pressed="${state.review.flagged.includes(q.id)}">${state.review.flagged.includes(q.id)?'Remove flag':'Flag an issue'}</button></div></article>`;
};
function hubReviewProgress(){
  const history=state.review.history||[],latest=history[0],total=history.reduce((n,h)=>n+h.total,0),score=history.reduce((n,h)=>n+h.score,0),active=state.review.session&&!state.review.session.done?state.review.session:null;
  return `<section class="card hub-review-progress"><div class="section-heading"><h2>Review scores</h2><button class="text-button" data-nav="review">Review →</button></div>${latest?`<div class="hub-review-score"><strong>${latest.score}<small> / ${latest.total}</small></strong><span>Latest round · ${reviewBanks.find(b=>b.id===latest.track)?.title||latest.track}<br>${new Date(latest.date).toLocaleDateString()}</span></div><progress value="${latest.score}" max="${latest.total}" aria-label="Latest review score"></progress>`:'<p class="hint">Finish a round to record your first score.</p>'}<div class="hub-review-stats"><span><b>${history.length}</b> recent rounds</span><span><b>${total?Math.round(score/total*100)+'%':'—'}</b> recent accuracy</span></div>${active?`<p class="hint">In progress: ${reviewScore(active)} correct / ${Object.keys(active.answers).length} answered</p>`:''}${reviewBanks.map(b=>{const rows=history.filter(h=>h.track===b.id);return rows.length?`<div class="hub-inline-stat"><span>${b.title} · latest</span><strong>${rows[0].score} / ${rows[0].total}</strong></div>`:''}).join('')}<small class="hub-key-note">Marked-key scores · separate from contribution points</small></section>`;
}
const hubProgressBeforeCompact=progressView;
progressView=function(){hubProgressBeforeCompact();app.insertAdjacentHTML('afterbegin',hubReviewProgress())};

// Help is opened by the user. No automatic tours, coachmarks or interruptions.
const hubQuickGuides={
  home:['Contribute',['Switch between Answer and Ask.','Choose topics to find questions you can answer.','When asking, include equipment details and permitted photos.']],
  learn:['Library',['Choose a department, then a topic.','Search within that topic to find a question.','Open a question file to read its answers.']],
  review:['Review',['Choose OIC NW or OIC EW, then a practice set.','Tap an answer to check it immediately; Next moves on.','Complete a round to record its score in Progress.','Keys follow the supplied PDFs and need verification. Sets follow source order, not official competencies.','Flag a questionable item to skip it later. Remove its flag to restore it.']],
  progress:['Progress',['Review scores show your recent practice results.','Contribution badges and points recognise helping others.','Tap an activity count to open its original discussions.']],
  profile:['Profile',['Your rank appears below your name.','Use Edit to change your profile.','Settings includes appearance, privacy and feedback.']],
  ask:['Ask a question',['Choose the relevant topic.','Describe the observation and equipment model.','Add permitted photos, then post.']],
  detail:['Question & answers',['Read the complete question before replying.','Share relevant experience and its context.','Save the discussion to find it later.']]
};
function hubHelpKey(){return hubQuickGuides[page]?page:'profile'}
function hubHelpPreference(key){try{return JSON.parse(localStorage.getItem('hub-help-v1:'+key)||'{}')}catch{return {}}}
function hubSaveHelpPreference(key,value){try{localStorage.setItem('hub-help-v1:'+key,JSON.stringify(value));return true}catch{return false}}
let hubHelpOpener=null;
function hubOpenQuickHelp(){
  const key=hubHelpKey(),guide=hubQuickGuides[key],prefs=hubHelpPreference(key);let dialog=document.querySelector('#hubQuickHelp');
  if(!dialog){dialog=document.createElement('dialog');dialog.id='hubQuickHelp';dialog.setAttribute('aria-labelledby','hubQuickHelpTitle');document.body.append(dialog);dialog.addEventListener('close',()=>hubHelpOpener?.focus?.())}
  hubHelpOpener=document.activeElement;
  dialog.innerHTML=`<div class="hub-help-head"><h2 id="hubQuickHelpTitle">${guide[0]} · quick help</h2><button type="button" data-help-close="true" aria-label="Close help">×</button></div><div class="hub-help-checklist">${guide[1].map((tip,i)=>`<label><input type="checkbox" data-help-step="${i}" ${prefs.steps?.includes(i)?'checked':''}><span>${esc(tip)}</span></label>`).join('')}</div><label class="hub-help-hide"><input type="checkbox" id="hubHideHelp" ${prefs.hidden?'checked':''}>Don't show the help tip again</label><p id="hubHelpStatus" class="hint" role="status">You can always reopen help with ?.</p><div class="review-actions"><button class="btn quiet" type="button" data-help-close="true">Skip</button><button class="btn" type="button" data-help-done="true">Done</button></div>`;
  dialog.dataset.helpKey=key;if(!dialog.open)dialog.showModal();
}
function hubCompactScreen(){
  if(typeof document.body.append!=='function')return;
  const ready=state.hubOnboardingCompleted&&!document.body.classList.contains('cloud-auth');
  document.body.classList.toggle('hub-compact',!!ready);document.body.dataset.hubPage=page;
  if(!ready){document.querySelector('#hubQuickHelp')?.close?.();return}
  const top=document.querySelector('.topbar');
  if(top&&!top.querySelector('#hubQuickHelpButton')){const b=document.createElement('button');b.id='hubQuickHelpButton';b.type='button';b.className='hub-help-button';b.textContent='?';b.setAttribute('aria-label','Help for this screen');b.onclick=hubOpenQuickHelp;top.append(b)}
  const help=top?.querySelector('#hubQuickHelpButton');if(help)help.title=hubHelpPreference(hubHelpKey()).hidden?'':'Need help? Open the short checklist.';
  const context=document.querySelector('#crewContext');
  if(context){
    const parent=context.querySelector('.back');
    if(hubRouteHistory.length<2&&parent&&!parent.dataset.hubHistoryBack){parent.classList.add('hub-history-back');parent.textContent='← Back'}
    else{context.replaceChildren();const b=document.createElement('button');b.type='button';b.className='back hub-history-back';b.dataset.hubHistoryBack='true';b.innerHTML='<span aria-hidden="true">←</span> Back';b.disabled=hubRouteHistory.length<2;b.setAttribute('aria-label','Back to previous screen');b.onclick=hubBack;context.append(b)}
  }
  // Keep public Q&A and reading content intact; remove repeated introductions.
  if(page==='home'){
    app.querySelector('.crew-greeting')?.remove();
    const hero=app.querySelector('.task-hero');if(hero)hero.innerHTML=`<h1>${state.contributionMode==='ask'?'Ask a question':'Answer a question'}</h1>`;
    app.querySelector('.empty p')?.remove();
    const department=app.querySelector('#hubAnswerDepartment');if(department)department.onchange=e=>{hubAnswerDepartment=e.target.value;render()};
    const topicSelect=app.querySelector('#hubAnswerTopic');if(topicSelect)topicSelect.onchange=e=>{const b=app.querySelector('#hubAddAnswerTopic');b.disabled=!e.target.value;b.dataset.answerTopic=e.target.value};
  }
  const heading=app.querySelector('.shelf-heading h1');if(page==='learn'&&!shelfTopic&&heading)heading.textContent='Library';
  for(const el of app.querySelectorAll('.shelf-instruction,.shelf-heading>p,.task-hero>p,.qa-head>div>p,.cloud-start,.cloud-return,.ask-path>p'))el.remove();
  if(page==='review'&&reviewReadSet===null)document.body.dataset.hubReview=reviewScreen==='round'?'round':reviewBank()?'sets':'tracks';else document.body.dataset.hubReview='';
  const progressHead=page==='progress'?app.querySelector('.qa-head h1'):null;if(progressHead)progressHead.textContent='Your progress';
}
const hubRenderBeforeCompact=render;
render=function(){hubRenderBeforeCompact();hubCompactScreen()};
document.addEventListener('click',e=>{
  const department=e.target.closest('[data-hub-shelf-dept]');if(department){hubShelfDepartment=department.dataset.hubShelfDept;document.querySelector('#shelfTopics').innerHTML=hubLibraryChoices();hubWireLibraryChoices();return}
  const b=e.target.closest('button');if(b?.dataset.helpClose||b?.dataset.helpDone){
    const d=document.querySelector('#hubQuickHelp');if(!d)return;
    if(b.dataset.helpDone){const key=d.dataset.helpKey,prefs=hubHelpPreference(key);prefs.hidden=!!d.querySelector('#hubHideHelp').checked;
      if(!hubSaveHelpPreference(key,prefs)){d.querySelector('#hubHelpStatus').textContent='This browser could not save your help preference. You can still close help.';return}}
    d.close();hubCompactScreen();
  }
});
document.addEventListener('change',e=>{if(e.target.dataset?.helpStep!==undefined){const d=document.querySelector('#hubQuickHelp'),key=d.dataset.helpKey,prefs=hubHelpPreference(key),i=Number(e.target.dataset.helpStep);prefs.steps=e.target.checked?[...new Set([...(prefs.steps||[]),i])]:(prefs.steps||[]).filter(x=>x!==i);hubSaveHelpPreference(key,prefs)}});
// Only one department opens at a time; choices stay compact without hiding readings.
document.addEventListener('toggle',e=>{if(e.target.matches?.('.crew-department,.crew-library-department')&&e.target.open){for(const d of app.querySelectorAll('.crew-department,.crew-library-department'))if(d!==e.target)d.open=false}},true);
render();
