/* Toolbox 2.6.9. Enhance the existing native dialog; do not replace its save/close behavior. */
(()=>{'use strict';const modal=document.getElementById('modal');if(!modal)return;
const viewport=window.visualViewport;
function size(){if(!modal.open)return;const h=viewport?.height||window.innerHeight;modal.style.setProperty('--tb-sheet-height',Math.max(240,Math.floor(h*0.88))+'px')}
function clear(){modal.style.removeProperty('--tb-sheet-height')}
modal.addEventListener('close',clear);
const observer=new MutationObserver(()=>{if(modal.open)size()});observer.observe(modal,{attributes:true,attributeFilter:['open']});
if(viewport){viewport.addEventListener('resize',size);viewport.addEventListener('scroll',size)}
modal.addEventListener('focusin',e=>{const t=e.target;if(!t.matches('input,textarea,select,[contenteditable="true"]'))return;requestAnimationFrame(()=>{if(!modal.open)return;t.scrollIntoView({block:'nearest',behavior:'instant'})})});
})();