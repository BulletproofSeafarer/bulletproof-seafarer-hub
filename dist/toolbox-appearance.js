/* Toolbox 2.6.8: one light appearance; developer credit remains at bottom of Profile. */
(()=>{'use strict';
function render(){const page=document.querySelector('#view .account-page');if(!page)return;
page.querySelectorAll('.account-brand,.tb-account-credit,#toolboxAppearance').forEach(el=>el.remove());
const foot=document.createElement('footer');foot.className='tb-account-credit';
const img=document.createElement('img');img.src='assets/bulletproof-seafarer-official.png';img.alt='Bulletproof Seafarer';img.loading='lazy';img.onerror=()=>img.remove();
const credit=document.createElement('div');const brand=document.createElement('strong');brand.textContent='Bulletproof Seafarer';const author=document.createElement('small');author.textContent='Developed by JV Ursal';credit.append(brand,author);foot.append(img,credit);page.appendChild(foot)}
let queued=false;function init(){document.documentElement.dataset.toolboxTheme='light';const view=document.getElementById('view');if(!view)return;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;if(view.querySelector('.account-page')&&!view.querySelector('.tb-account-credit'))render()})}).observe(view,{childList:true,subtree:false});render()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init()
})();