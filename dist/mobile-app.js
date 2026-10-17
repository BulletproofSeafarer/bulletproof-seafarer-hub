'use strict';
// Presentation layer only: existing profile saves, ownership, and cloud sync stay intact.
let crewSetupStep=0;
const crewSetupStages=[
  ['What should we call you?','Use the name you want the crew to see.',['name']],
  ['Your email stays private.','For your account, not your public profile.',['email']],
  ['Where do you serve?','Your role helps others understand your experience.',['department','rank']],
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
render();
