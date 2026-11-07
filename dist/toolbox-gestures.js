/* In-app screen history. Keep drafts and study sessions in memory. */
const ToolboxScreens=(()=>{
 const view=document.getElementById('view'),entries=[];
 let index=0,restoring=false,start=null,axis='',busy=false;
 const reduced=()=>document.documentElement.classList.contains('toolbox-reduced-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
 function slide(sign){
  if(!reduced())view.animate([{transform:'translateX('+sign*100+'%)',opacity:.82},{transform:'translateX(0)',opacity:1}],{duration:225,easing:'ease-out'});
 }
 function visit(id,show){
  if(restoring)return;
  if(entries[index]?.id===id){entries[index].show=show;return}
  entries.splice(index+1);entries.push({id,show,y:0});index=entries.length-1;
  if(index>0)slide(1);
 }
 function move(step){
  const next=entries[index+step];if(!next)return;
  entries[index].y=scrollY;index+=step;restoring=true;
  try{next.show();window.scrollTo(0,next.y);slide(step)}finally{restoring=false}
 }
 function remember(){if(entries[index])entries[index].y=scrollY}
 const indicator=document.createElement('div');indicator.className='tb-refresh';indicator.hidden=true;
 indicator.setAttribute('role','status');indicator.innerHTML='<i class="tb-spinner"></i><span>Pull to refresh</span>';document.body.append(indicator);
 function feedback(label){indicator.hidden=false;indicator.lastChild.textContent=label}
 async function refresh(){
  busy=true;feedback('Refreshing…');
  try{
   // Re-read saved voyage data. Learn repaints from its active session.
   state.voyage=load();render();
   if(navigator.onLine&&navigator.serviceWorker){
    const reg=await navigator.serviceWorker.getRegistration();
    if(reg)await reg.update();
   }
   feedback(navigator.onLine?'Refreshed':'Local data refreshed');
  }catch{feedback('Local data refreshed')}finally{
   busy=false;setTimeout(()=>{if(!busy&&!start)indicator.hidden=true},750);
  }
 }
 const skip='input,textarea,select,[contenteditable],dialog,.utility-marquee,.category-scroll';
 view.addEventListener('touchstart',e=>{
  if(busy||e.touches.length!==1||document.querySelector('dialog[open]')||e.target.closest(skip))return;
  const t=e.touches[0];start={x:t.clientX,y:t.clientY,top:scrollY<=1,page:state.page};axis='';
 },{passive:true});
 function cancel(){start=null;axis='';if(!busy)indicator.hidden=true}
 view.addEventListener('touchcancel',cancel,{passive:true});
 view.addEventListener('touchmove',e=>{
  if(!start)return;
  if(e.touches.length!==1){cancel();return}
  const t=e.touches[0],dx=t.clientX-start.x,dy=t.clientY-start.y;
  if(!axis&&Math.max(Math.abs(dx),Math.abs(dy))>10){
   axis=dx>1.5*Math.abs(dy)&&index>0?'x':dy>0&&start.top&&Math.abs(dx)*1.5<dy&&['home','documents','account','learn'].includes(start.page)&&!view.querySelector('.tl-back,.utility-screen')?'pull':'scroll';
   for(let el=e.target;el&&el!==view;el=el.parentElement){
    if(axis==='x'&&el.scrollWidth>el.clientWidth+2&&['scroll','auto'].includes(getComputedStyle(el).overflowX))axis='scroll';
   }
  }
  if(axis==='pull'){if(e.cancelable)e.preventDefault();feedback(dy>=75?'Release to refresh':'Pull to refresh')}
  if(axis==='x'&&e.cancelable)e.preventDefault();
 },{passive:false});
 view.addEventListener('touchend',e=>{
  if(!start)return;
  const t=e.changedTouches[0],dx=t.clientX-start.x,dy=t.clientY-start.y,gesture=axis;cancel();
  if(gesture==='pull'&&dy>=75)refresh();
  if(gesture==='x'&&dx>=75&&dx>1.5*Math.abs(dy))move(-1);
 });
 document.addEventListener('click',event=>{
  if(index<1||document.querySelector('dialog[open]'))return;
  if(!event.target.closest('button.back,button.tl-back,[data-utility-back],[data-account-back]'))return;
  event.preventDefault();event.stopImmediatePropagation();move(-1);
 },true);
 return {visit,remember};
})();
