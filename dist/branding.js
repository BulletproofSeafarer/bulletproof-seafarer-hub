'use strict';
function hubApplyBrand(){
  if(typeof document.body.append!=='function')return;
  document.title='Toolbox | Seafarer Q&A & Review';
  const header=document.querySelector('.topbar');
  if(header&&!header.querySelector('.hub-brand-home'))header.insertAdjacentHTML('afterbegin','<button type="button" class="hub-brand-home" data-nav="home" aria-label="Toolbox home"><img src="assets/hub-logo.svg" alt="" width="42" height="42"></button>');
  const sidebar=document.querySelector('.brand .mark');if(sidebar&&!sidebar.querySelector('img'))sidebar.innerHTML='<img src="assets/hub-logo.svg" width="44" height="44" alt="Toolbox">';
  for(const card of app.querySelectorAll('.short-welcome,.cloud-auth-card'))if(!card.querySelector('.hub-card-brand'))card.insertAdjacentHTML('afterbegin','<div class="hub-card-brand"><img src="assets/hub-logo.svg" width="30" height="30" alt=""><span>Toolbox</span></div>');
}
const hubRenderBeforeBrand=render;
render=function(){hubRenderBeforeBrand();hubApplyBrand();cloudSyncNotice()};
const toolboxAccessBefore=accessUI;
accessUI=function(){toolboxAccessBefore();const status=toolboxSyncSummary();app.insertAdjacentHTML('afterbegin',`<section class="card toolbox-status-card"><h2>Activity status</h2><p id="toolboxStatusDetail" role="status">${esc(status.detail)}</p>${cloudEnabled&&cloudConflict?'<button class="btn quiet" data-cloud="reviewRecovery">Review saved copies</button>':''}</section>`)};
hubApplyBrand();
