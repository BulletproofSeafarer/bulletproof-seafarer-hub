'use strict';
// Presentation layer only: existing profile saves, ownership, and cloud sync stay intact.
let crewSetupStep=0;
const crewSetupStages=[
  ['What should we call you?','Add the name you want to use in Toolbox.',['name']],
  ['Your email stays private.','For your account, not your public profile.',['email']],
  ['Where do you serve?','Your department and rank personalise your learning profile.',['department','rank']],
  ['Make it yours.','A photo and a few words are optional. You can add them later.',['experience','country','bio']]
];
function crewProfileStageFor(name){return crewSetupStages.findIndex(s=>s[2].includes(name))}
function crewShowSetupStep(form,step,focus=true){
  crewSetupStep=Math.max(0,Math.min(3,step));
  for(const panel of form.querySelectorAll('[data-crew-panel]'))panel.hidden=Number(panel.dataset.crewPanel)!==crewSetupStep;
  const stage=crewSetupStages[crewSetupStep];
  form.querySelector('#crewStepTitle').textContent=stage[0];
  form.querySelector('#crewStepCopy').textContent=stage[1];
  form.querySelector('#crewStepCount').textContent=`PROFILE · ${crewSetupStep+1} OF 4`;
  const progress=form.querySelector('#crewSetupProgress');progress.value=crewSetupStep+1;
  form.querySelector('#crewNext').hidden=crewSetupStep===3;
  form.querySelector('#crewFinish').hidden=crewSetupStep!==3;
  form.querySelector('#crewSetupBack').textContent=crewSetupStep===0?'← Guide':'← Back';
  form.querySelector('#crewStepError').textContent='';
  if(focus)form.querySelector(`[data-crew-panel="${crewSetupStep}"] input:not([readonly]),[data-crew-panel="${crewSetupStep}"] select`)?.focus({preventScroll:true});
}
function crewValidatePanel(form,step){
  const fields=form.querySelectorAll(`[data-crew-panel="${step}"] input,[data-crew-panel="${step}"] select,[data-crew-panel="${step}"] textarea`);
  for(const field of fields){
    if(field.required&&field.type!=='file'&&!field.value.trim())field.setCustomValidity('Please complete this field.');else field.setCustomValidity('');
    if(!field.checkValidity()){crewShowSetupStep(form,step,false);form.querySelector('#crewStepError').textContent=field.validationMessage;field.focus();field.reportValidity();return false}
  }
  return true;
}
globalThis.hubValidateProfile=function(form){
  if(!form.classList.contains('crew-setup-form'))return true;
  // Enter must advance the current card, never silently finish an incomplete setup.
  if(crewSetupStep<3){if(crewValidatePanel(form,crewSetupStep))crewShowSetupStep(form,crewSetupStep+1);return false}
  for(let i=0;i<4;i++)if(!crewValidatePanel(form,i))return false;
  return true;
};
function crewEnhanceSetup(){
  const form=app.querySelector('#qaProfileForm');
  if(!form||typeof form.append!=='function'||form.classList.contains('crew-setup-form'))return;
  form.classList.add('crew-setup-form');form.noValidate=true;
  app.querySelector('.setup-head')?.remove();app.querySelector('.qa-profile-title')?.remove();
  const panels=crewSetupStages.map((_,i)=>{const p=document.createElement('div');p.className='crew-setup-panel';p.dataset.crewPanel=String(i);return p});
  for(const [i,stage] of crewSetupStages.entries())for(const name of stage[2]){
    const input=form.querySelector(`[name="${name}"]`);const label=input?.closest('.field');if(label)panels[i].append(label);
  }
  const name=form.querySelector('[name="name"]')||panels[0].querySelector('[name="name"]');
  if(name){name.autocomplete='nickname';name.placeholder='Your name';}
  const photo=form.querySelector('#qaProfilePhoto')?.closest('.field');if(photo)panels[3].prepend(photo);
  const note=form.querySelector('.profile-email-note');if(note)panels[1].append(note);
  const save=form.querySelector('button.btn');save.id='crewFinish';save.type='submit';save.textContent='Open my dashboard →';
  form.querySelector('h2')?.remove();
  form.querySelector('.qa-draft-note')?.remove();
  for(const row of form.querySelectorAll('.two'))if(!row.children.length)row.remove();
  form.insertAdjacentHTML('afterbegin','<div class="crew-setup-top"><button type="button" class="back" id="crewSetupBack">← Guide</button><span id="crewStepCount" class="welcome-step"></span></div><progress id="crewSetupProgress" max="4" value="1" aria-label="Profile setup progress"></progress><div class="crew-card-heading"><span class="crew-anchor" aria-hidden="true">⚓</span><h1 id="crewStepTitle" tabindex="-1"></h1><p id="crewStepCopy"></p></div>');
  for(const panel of panels)form.insertBefore(panel,save);
  save.insertAdjacentHTML('beforebegin','<p id="crewStepError" class="crew-step-error" role="alert"></p><button type="button" class="btn" id="crewNext">Continue →</button>');
  save.insertAdjacentHTML('afterend','<p class="crew-setup-foot">Your profile details can be edited later.</p>');
  form.querySelector('#crewNext').onclick=()=>{if(crewValidatePanel(form,crewSetupStep))crewShowSetupStep(form,crewSetupStep+1)};
  form.querySelector('#crewSetupBack').onclick=()=>crewSetupStep?crewShowSetupStep(form,crewSetupStep-1):nav('gettingstarted');
  crewShowSetupStep(form,crewSetupStep,false);
}
// Register before the cloud adapter: intermediate cards must not trigger a cloud save.
document.addEventListener('submit',e=>{if(e.target.id==='qaProfileForm'&&!globalThis.hubValidateProfile(e.target)){e.preventDefault();e.stopImmediatePropagation()}},true);
const renderBeforeCrewMobile=render;
render=function(){renderBeforeCrewMobile();document.body.classList.add('crew-mobile-app');if(page==='setup'&&!state.hubOnboardingCompleted)crewEnhanceSetup();
  const current=document.querySelector('#mobileNav button.active');if(current)current.setAttribute('aria-current','page');
};
// Quiet task screens, reversible review actions, and the crew companion.
let crewFlagsOpen=false,crewMessageTimer,crewDockHidden=false,crewStatusMessage='',crewStatusError=false,crewStatusBusy=false;
const crewAnswerTaskBefore=answerTask;
answerTask=function(){return crewAnswerTaskBefore().replace(/<h3>([^<]+)<\/h3>(<div class="topic-pick">[\s\S]*?<\/div>)/g,(_,name,topics)=>`<details class="crew-department"><summary><span>${name}</span><b aria-hidden="true">⌄</b></summary>${topics}</details>`)};
const crewShelfRowsBefore=shelfTopicRows;
shelfTopicRows=function(){return crewShelfRowsBefore().replace(/<section class="shelf-group"><h2>([^<]+)<\/h2>([\s\S]*?)<\/section>/g,(_,name,topics)=>`<details class="shelf-group crew-library-department" ${shelfTopicQuery?'open':''}><summary><span class="crew-department-icon" aria-hidden="true">${name==='Engine'?'⚙':name==='Deck'?'⚓':name==='Electrical'?'ϟ':'▤'}</span><span>${name}</span><b aria-hidden="true">⌄</b></summary>${topics}</details>`)};
function crewFlaggedView(){const b=reviewBank();const items=b.questions.filter(q=>state.review.flagged.includes(q.id));app.innerHTML=`<button class="back" data-crew-flags-close="true">← Review sets</button><header class="shelf-heading"><h1>Flagged questions</h1><p>Remove a flag to include that question in future practice again.</p></header><div class="crew-flag-list">${items.map(q=>`<article class="card"><span class="hint">${esc(b.title)} · Q${q.number}</span><h2>${esc(q.question)}</h2><button class="btn quiet" data-review-flag="${q.id}">Remove flag</button></article>`).join('')||'<section class="card crew-empty"><span aria-hidden="true">✓</span><h2>All clear.</h2><p>No flagged questions in this reviewer.</p><button class="btn" data-crew-flags-close="true">Back to review</button></section>'}</div>`}
const crewReviewBefore=reviewView;
reviewView=function(){if(crewFlagsOpen&&reviewBank())crewFlaggedView();else crewReviewBefore()};
function crewCompanion(message,mood='happy',action=null,busy=false){
  crewStatusMessage=message;crewStatusError=mood==='careful';crewStatusBusy=busy;
  if(typeof cloudSyncNotice==='function')cloudSyncNotice();
}
const crewToastBefore=toast;
toast=function(message,action=null){document.querySelector('#toast')?.classList.add('hidden');if(!state.hubOnboardingCompleted||['welcome','gettingstarted','setup'].includes(page)||document.body.classList.contains('cloud-auth')){const status=document.querySelector('#qaProfileStatus')||document.querySelector('#authMessage');if(status)status.textContent=message;return}if(/could not|cannot|failed|not saved|not synced|retry|storage.*full|error/i.test(message))crewCompanion(message,'careful',action)};
const crewStatusBefore=showWorkspaceStatus;
let crewWasBusy=false,crewBusyTimer;
showWorkspaceStatus=function(text,busy=false,error=false){clearTimeout(crewBusyTimer);clearTimeout(statusTimer);document.querySelector('#workspaceText').textContent=text;workspaceStatus.classList.remove('visible');crewWasBusy=false;crewStatusMessage=text;crewStatusError=error;crewStatusBusy=busy;if(typeof cloudSyncNotice==='function')cloudSyncNotice()};
function crewSetDock(hidden){
  crewDockHidden=false;document.body.classList.remove('crew-dock-resting');
}
function crewTidyScreen(){
  if(typeof document.body.append!=='function')return;
  document.body.classList.add('crew-calm');
  if(page==='home'&&state.hubOnboardingCompleted){
    const hero=app.querySelector('.task-hero');
    if(hero&&!app.querySelector('.crew-greeting'))hero.insertAdjacentHTML('beforebegin',`<div class="crew-greeting"><p>Welcome aboard,</p><h1>${esc(qProfileName().split(' ')[0])} <span aria-hidden="true">👋</span></h1></div>`);
    const title=hero?.querySelector('h1');if(title)title.textContent=state.contributionMode==='answer'?'Share what you know.':'Let’s find an answer.';
  }
  const manageFlags=app.querySelector('[data-crew-flags]');
  const practiceActions=app.querySelector('.review-journey .review-actions');
  if(manageFlags&&practiceActions){manageFlags.textContent=`Flagged · ${state.review.flagged.filter(id=>id.startsWith(state.review.track+'-')).length}`;manageFlags.className='btn quiet';practiceActions.append(manageFlags)}
  let context=document.querySelector('#crewContext');if(!context){context=document.createElement('div');context.id='crewContext';document.body.append(context)}context.replaceChildren();
  const back=app.querySelector('button.back');
  if(back){if(page==='setup'){const form=app.querySelector('#qaProfileForm');if(form)form.append(back)}else{const label=back.textContent.trim();back.setAttribute('aria-label',label);back.title=label;back.textContent='←';context.append(back)}}
  document.querySelector('#crewDockHandle')?.remove();
  crewSetDock(false);
}
const crewRenderCalmBefore=render;
render=function(){crewRenderCalmBefore();crewTidyScreen()};
document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.crewFlags){crewFlagsOpen=true;render();window.scrollTo(0,0)}
  if(b.dataset.crewFlagsClose){crewFlagsOpen=false;render()}
},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const p=document.querySelector('#crewCompanion');if(p)p.hidden=true;crewSetDock(false)}});
render();
