/* In-app screen history. Keep drafts and study sessions in memory. */
const ToolboxScreens=(()=>{
 const view=document.getElementById('view'),entries=[];
 let index=0,restoring=false,start=null,axis='',busy=false;
 const reduced=()=>document.documentElement.classList.contains('toolbox-reduced-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
 let motion;
 function spring(axis,direction){
  motion?.cancel();
  if(reduced())return;
  const frames=[0,6,-2,0].map(px=>({transform:'translate'+axis+'('+px*direction+'px)'}));
  motion=view.animate(frames,{duration:165,easing:'ease-out'});
 }
 function visit(id,show){
  if(restoring)return;
  if(entries[index]?.id===id){entries[index].show=show;return}
  entries.splice(index+1);entries.push({id,show,y:0});index=entries.length-1;
  motion?.cancel();
 }
 function move(step){
  const next=entries[index+step];if(!next)return;
  entries[index].y=scrollY;index+=step;restoring=true;
  try{next.show();window.scrollTo(0,next.y)}finally{restoring=false}
 }
 function remember(){if(entries[index])entries[index].y=scrollY}
 const indicator=document.createElement('div');indicator.className='tb-refresh';indicator.hidden=true;
 indicator.setAttribute('role','status');indicator.setAttribute('aria-label','Refreshing');
 indicator.innerHTML='<i class="tb-spinner" aria-hidden="true"></i>';document.body.append(indicator);
 function refresh(){
  if(busy)return;
  busy=true;indicator.hidden=false;
  setTimeout(()=>{busy=false;indicator.hidden=true},2500);
  state.voyage=load();render();
  if(navigator.onLine&&navigator.serviceWorker){
   navigator.serviceWorker.getRegistration().then(reg=>reg?.update()).catch(()=>{});
  }
 }
 const skip='input,textarea,select,[contenteditable],dialog,.utility-marquee,.category-scroll';
 view.addEventListener('touchstart',e=>{
  if(e.touches.length!==1||document.querySelector('dialog[open]')||e.target.closest(skip))return;
  const t=e.touches[0];start={x:t.clientX,y:t.clientY,top:scrollY<=1,page:state.page};axis='';
 },{passive:true});
 function cancel(){start=null;axis='';if(!busy)indicator.hidden=true}
 view.addEventListener('touchcancel',cancel,{passive:true});
 view.addEventListener('touchmove',e=>{
  if(!start)return;
  if(e.touches.length!==1){cancel();return}
  const t=e.touches[0],dx=t.clientX-start.x,dy=t.clientY-start.y;
  if(!axis&&Math.max(Math.abs(dx),Math.abs(dy))>10){
   axis=Math.abs(dx)>1.5*Math.abs(dy)?'x':dy>0&&start.top&&Math.abs(dx)*1.5<dy&&['home','documents','account','learn'].includes(start.page)&&!view.querySelector('.tl-back,.utility-screen')?'pull':'scroll';
   for(let el=e.target;el&&el!==view;el=el.parentElement){
    if(axis==='x'&&el.scrollWidth>el.clientWidth+2&&['scroll','auto'].includes(getComputedStyle(el).overflowX))axis='scroll';
   }
  }
  if(axis==='pull'){if(e.cancelable)e.preventDefault();indicator.hidden=false}
  if(axis==='x'&&e.cancelable)e.preventDefault();
 },{passive:false});
 view.addEventListener('touchend',e=>{
  if(!start)return;
  const t=e.changedTouches[0],dx=t.clientX-start.x,dy=t.clientY-start.y,gesture=axis;cancel();
  if(gesture==='pull'&&dy>=75){refresh();spring('Y',1)}
  if(gesture==='scroll'&&dy<=-75&&-dy>1.5*Math.abs(dx))spring('Y',-1);
  if(gesture==='x'&&Math.abs(dx)>=75&&Math.abs(dx)>1.5*Math.abs(dy)){
   if(dx>0)move(-1);
   spring('X',Math.sign(dx));
  }
 });
 document.addEventListener('click',event=>{
  if(index<1||document.querySelector('dialog[open]'))return;
  if(!event.target.closest('button.back,[data-utility-back],[data-account-back]'))return;
  event.preventDefault();event.stopImmediatePropagation();move(-1);
 },true);
 return {visit,remember};
})();
