/* Fit the sheet to the visible viewport when the software keyboard opens. */
(()=>{
 'use strict';
 const modal=document.getElementById('modal');
 if(!modal)return;
 const viewport=window.visualViewport;
 let frame=0;
 function layout(){
  frame=0;
  if(!modal.open)return;
  const height=viewport?.height||window.innerHeight;
  modal.style.setProperty('--tb-sheet-height',Math.floor(height*.88)+'px');
  const inset=Math.max(0,window.innerHeight-height-(viewport?.offsetTop||0));
  modal.style.setProperty('--tb-keyboard-inset',inset+'px');
  const field=document.activeElement;
  if(!modal.contains(field)||!field.matches('input,textarea,select,[contenteditable="true"]'))return;
  const body=modal.querySelector('.toolbox-modal-body');
  if(!modal.querySelector('#docTitle')||!body){
   field.scrollIntoView({block:'nearest',behavior:'instant'});
   return;
  }
  const bounds=body.getBoundingClientRect();
  const top=Math.max(bounds.top,viewport?.offsetTop||0)+12;
  const bottom=Math.min(bounds.bottom,(viewport?.offsetTop||0)+height)-12;
  let target=(field.closest('label')||field).getBoundingClientRect();
  if(target.height>bottom-top)target=field.getBoundingClientRect();
  if(target.bottom>bottom)body.scrollTop+=target.bottom-bottom;
  else if(target.top<top)body.scrollTop+=target.top-top;
 }
 function schedule(){if(modal.open&&!frame)frame=requestAnimationFrame(layout)}
 modal.addEventListener('close',()=>{
  cancelAnimationFrame(frame);frame=0;
  modal.style.removeProperty('--tb-sheet-height');
  modal.style.removeProperty('--tb-keyboard-inset');
 });
 new MutationObserver(schedule).observe(modal,{attributes:true,attributeFilter:['open']});
 viewport?.addEventListener('resize',schedule);
 viewport?.addEventListener('scroll',schedule);
 window.addEventListener('resize',schedule);
 modal.addEventListener('focusin',schedule);
})();
