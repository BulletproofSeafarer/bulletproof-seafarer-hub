'use strict';
function hubApplyBrand(){
  if(typeof document.body.append!=='function')return;
  const header=document.querySelector('.topbar');
  if(header&&!header.querySelector('.hub-brand-home'))header.insertAdjacentHTML('afterbegin','<button type="button" class="hub-brand-home" data-nav="home" aria-label="Bulletproof Seafarer Hub home"><img src="assets/hub-logo.svg" alt="" width="42" height="42"></button>');
  const sidebar=document.querySelector('.brand .mark');if(sidebar&&!sidebar.querySelector('img'))sidebar.innerHTML='<img src="assets/hub-logo.svg" width="44" height="44" alt="Bulletproof Seafarer Hub">';
  for(const card of app.querySelectorAll('.short-welcome,.cloud-auth-card'))if(!card.querySelector('.hub-card-brand'))card.insertAdjacentHTML('afterbegin','<div class="hub-card-brand"><img src="assets/hub-logo.svg" width="30" height="30" alt=""><span>Bulletproof Seafarer Hub</span></div>');
}
const hubRenderBeforeBrand=render;
render=function(){hubRenderBeforeBrand();hubApplyBrand()};
hubApplyBrand();
