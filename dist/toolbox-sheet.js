/* Fit the sheet to the visible viewport when the software keyboard opens. */
(()=>{
 'use strict';
 const modal=document.getElementById('modal');
 if(!modal)return;
 const viewport=window.visualViewport;
 let frame=0, drag=null;
 function dismiss(){
  // Forms may hold scanner attachments even before any text has been entered.
  if(modal.querySelector('input,textarea,select,[contenteditable="true"]') &&
     !window.confirm('Discard changes and go back?'))return;
  document.getElementById('closeToolboxModal').click();
 }
 modal.addEventListener('click',event=>{
  if(event.target!==modal)return;
  const box=modal.getBoundingClientRect();
  if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dismiss();
 });
 modal.addEventListener('touchstart',event=>{
  drag=null;
  const point=event.touches[0], body=modal.querySelector('.toolbox-modal-body');
  if(event.touches.length===1 && body && body.contains(event.target) && body.scrollTop<=0 &&
     point.clientY<=body.getBoundingClientRect().top+48 && !event.target.closest('button,input,textarea,select,a'))
   drag={x:point.clientX,y:point.clientY};
 },{passive:true});
 modal.addEventListener('touchcancel',()=>{drag=null});
 modal.addEventListener('touchend',event=>{
  if(!drag)return;
  const point=event.changedTouches[0],dy=point.clientY-drag.y,dx=point.clientX-drag.x;
  drag=null;
  if(dy>65 && dy>1.5*Math.abs(dx))dismiss();
 },{passive:true});
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
