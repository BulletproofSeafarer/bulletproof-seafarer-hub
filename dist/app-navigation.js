'use strict';
// App search is separate from the Library's topic and file searches.
const hubMainTabs=['home','learn','review','progress','profile'];
const hubDestinations=[['home','Contribute','Ask answer questions help crew'],['learn','Library','Toolbox topics books saved questions answers'],['review','Review','OIC NW OIC EW reviewer quiz practice'],['progress','Progress','Badges milestones points contribution'],['profile','Profile','Name rank bio photo email'],['settings','Settings','Appearance light dark theme'],['feedback','Feedback','Report app problem suggestion support'],['privacy','Privacy policy','Data information privacy'],['access','Account & storage','Sign in password sync saved data'],['community','Facebook community','Group community'],['help','How to use the Toolbox','Instructions help guide'],['leaderboard','Top seafarers','Leaderboard contributors rankings']];
let hubRouteHistory=[],hubHistoryOwner='',hubRestoringRoute=false,hubSearchTimer,hubSearchItems=[],hubSearchOpener=null,hubTouch=null;
function hubSearchNormal(text){return String(text||'').toLowerCase().replace(/\bfwg\b/g,'fresh water generator').replace(/[^\p{L}\p{N}]+/gu,' ').trim()}
function hubAppMatches(text){
  const words=hubSearchNormal(text).split(' ').filter(Boolean);const match=t=>words.every(w=>hubSearchNormal(t).includes(w));
  const screens=hubDestinations.filter(x=>!words.length||match(x[1]+' '+x[2]+(x[0]==='profile'?' '+Object.values(state.profile).filter(x=>typeof x==='string'&&!x.startsWith('data:')&&!x.startsWith('https:')).join(' '):''))).map(x=>({kind:'Screen',title:x[1],page:x[0]}));
  if(!words.length)return screens;
  const topics=equipment.slice(1).filter(t=>match(t+' '+departmentFor(t))).map(t=>({kind:'Topic',title:t,topic:t}));
  const questions=all().filter(q=>match([q.title,q.body,q.equipment,q.author,q.role,...q.tags,...q.answers.map(a=>a.text+' '+a.name)].join(' '))).slice(0,20).map(q=>({kind:'Question',title:q.title,id:q.id,topic:q.equipment}));
  const reviews=reviewBanks.flatMap(b=>b.questions.filter(q=>match(b.title+' '+q.question+' '+q.options.join(' ')+' '+q.number)).slice(0,10).map(q=>({kind:'Review',title:q.question,id:q.id,track:b.id,set:q.set})));
  return [...screens,...topics,...questions,...reviews].slice(0,50);
}
function hubSearchResults(value){const target=document.querySelector('#hubAppSearchResults');if(!target)return;hubSearchItems=hubAppMatches(value);target.innerHTML=hubSearchItems.length?hubSearchItems.map((r,i)=>`<button type="button" class="hub-app-result" data-app-result="${i}"><span class="hub-result-kind">${esc(r.kind)}</span><strong>${esc(r.title)}</strong><span aria-hidden="true">›</span></button>`).join(''):'<div class="crew-empty"><h2>No matches yet.</h2><p>Try a journal title, reviewer term, or app feature.</p></div>';const status=document.querySelector('#hubAppSearchStatus');if(status)status.textContent=value.trim()?`${hubSearchItems.length} matches shown`:'Choose a shortcut or search the app.'}
function hubOpenAppSearch(){
  if(!state.hubOnboardingCompleted)return;
  if(typeof document.body.append!=='function')return;
  let dialog=document.querySelector('#hubAppSearch');
  if(!dialog){dialog=document.createElement('dialog');dialog.id='hubAppSearch';dialog.setAttribute('aria-labelledby','hubAppSearchTitle');dialog.innerHTML='<div class="hub-app-search-head"><h2 id="hubAppSearchTitle">Search the Toolbox</h2><button type="button" data-app-search-close="true" aria-label="Close app search">×</button></div><label class="search">'+icon('search')+'<input id="hubAppSearchInput" type="search" autocomplete="off" placeholder="Journal titles, review, settings…" aria-label="Search everything in the app"></label><p id="hubAppSearchStatus" class="hint" role="status"></p><div id="hubAppSearchResults"></div>';document.body.append(dialog);dialog.addEventListener('close',()=>hubSearchOpener?.focus?.());dialog.querySelector('#hubAppSearchInput').oninput=e=>{clearTimeout(hubSearchTimer);hubSearchTimer=setTimeout(()=>hubSearchResults(e.target.value),120)}}
  hubSearchOpener=document.activeElement;dialog.querySelector('#hubAppSearchInput').value='';hubSearchResults('');if(!dialog.open)dialog.showModal();dialog.querySelector('#hubAppSearchInput').focus();
}
function hubOpenAppResult(index){const item=hubSearchItems[index];if(!item)return;document.querySelector('#hubAppSearch')?.close();if(item.kind==='Screen'){nav(item.page);return}if(item.kind==='Topic'){page='learn';shelfTopic=item.topic;shelfFileQuery='';shelfStatus='all';shelfReturn=false}if(item.kind==='Question'){page='detail';selected=item.id;shelfTopic=item.topic;shelfReturn=true}if(item.kind==='Review'){page='review';state.review.track=item.track;reviewReadSet=item.set;reviewReadIndex=reviewBank().questions.filter(q=>q.set===item.set).findIndex(q=>q.id===item.id);reviewReveal=false;reviewScreen='sets';crewFlagsOpen=false}render();window.scrollTo(0,0)}
function hubRouteSnapshot(){return {page,selected,shelfTopic,shelfFileQuery,shelfTopicQuery,shelfStatus,shelfReturn,reviewScreen,reviewReadSet,reviewReadIndex,reviewSetPage,reviewFilter,track:state.review?.track,crewFlagsOpen,editingProfile,mode:state.contributionMode,scrollY:window.scrollY||0}}
function hubRouteKey(r){return JSON.stringify([r.page,r.selected,r.shelfTopic,r.page==='review'?[r.track,r.reviewScreen,r.reviewReadSet,r.crewFlagsOpen]:null,r.editingProfile,r.page==='home'?r.mode:null])}
function hubRecordRoute(){
  if(!state.hubOnboardingCompleted||(cloudEnabled&&(!cloudUser||!cloudReady))){hubRouteHistory=[];hubHistoryOwner='';hubSearchItems=[];document.querySelector('#hubAppSearch')?.close?.();return}
  const owner=cloudEnabled?cloudUser.id:'local';if(hubHistoryOwner!==owner){hubHistoryOwner=owner;hubRouteHistory=[]}
  const next=hubRouteSnapshot();if(!hubRestoringRoute&&(!hubRouteHistory.length||hubRouteKey(next)!==hubRouteKey(hubRouteHistory.at(-1))))hubRouteHistory.push(next);if(hubRouteHistory.length>60)hubRouteHistory.shift();
}
function hubBack(){
  if(hubRouteHistory.length<2){const back=document.querySelector('#crewContext .back');if(back&&!back.dataset.hubHistoryBack){back.click();return true}return false}
  hubRouteHistory.pop();const r=hubRouteHistory.at(-1);hubRestoringRoute=true;
  page=r.page;selected=r.selected;shelfTopic=r.shelfTopic;shelfFileQuery=r.shelfFileQuery;shelfTopicQuery=r.shelfTopicQuery;shelfStatus=r.shelfStatus;shelfReturn=r.shelfReturn;reviewScreen=r.reviewScreen;reviewReadSet=r.reviewReadSet;reviewReadIndex=r.reviewReadIndex;reviewSetPage=r.reviewSetPage;reviewFilter=r.reviewFilter;crewFlagsOpen=r.crewFlagsOpen;editingProfile=r.editingProfile;state.review.track=r.track;state.contributionMode=r.mode;
  render();hubRestoringRoute=false;window.scrollTo(0,r.scrollY);return true;
}
function hubCanSwipe(){return state.hubOnboardingCompleted&&!(cloudEnabled&&(!cloudReady||cloudBusy))&&!editingProfile&&!['ask','feedback'].includes(page)&&!app.querySelector('form:not(#contributionSearch)')&&!document.querySelector('dialog[open]')}
function hubSwipeTarget(direction){if(direction==='right')return hubRouteHistory.length>1?'back':null;const root=hubMainTabs.includes(page)&&!(page==='learn'&&shelfTopic)&&!(page==='review'&&(reviewReadSet||reviewScreen==='round'||crewFlagsOpen));if(!root)return null;return hubMainTabs[hubMainTabs.indexOf(page)+1]||null}
function hubRefreshNavigation(){
  const search=document.querySelector('#globalSearch');if(search){search.setAttribute('aria-label','Search the whole app');const label=search.querySelector('span');if(label)label.textContent='Search the app'}
  if(typeof document.body.append!=='function')return;
  const context=document.querySelector('#crewContext');if(context&&state.hubOnboardingCompleted){if(hubRouteHistory.length>1){context.replaceChildren();const b=document.createElement('button');b.type='button';b.className='back hub-history-back';b.dataset.hubHistoryBack='true';b.innerHTML='<span aria-hidden="true">←</span> Back';b.setAttribute('aria-label','Back to previous screen');b.onclick=hubBack;context.append(b)}else{const back=context.querySelector('.back');if(back){back.classList.add('hub-history-back');back.textContent='← Back'}}}
}
const hubRenderBeforeNavigation=render;
render=function(){hubRenderBeforeNavigation();hubRecordRoute();hubRefreshNavigation()};
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.globalSearch){e.preventDefault();e.stopImmediatePropagation();hubOpenAppSearch()}if(b.dataset.appSearchClose){document.querySelector('#hubAppSearch')?.close()}if(b.dataset.appResult!==undefined)hubOpenAppResult(Number(b.dataset.appResult))},true);
document.addEventListener('touchstart',e=>{if(e.touches.length!==1||!hubCanSwipe()||e.target.closest('input,textarea,select,button,a,summary,[role=slider],.photos')){hubTouch=null;return}const t=e.touches[0];if(t.clientX<25||t.clientX>window.innerWidth-25){hubTouch=null;return}hubTouch={x:t.clientX,y:t.clientY,time:Date.now()}},{passive:true});
document.addEventListener('touchend',e=>{if(!hubTouch||e.changedTouches.length!==1)return;const start=hubTouch;hubTouch=null;const t=e.changedTouches[0],dx=t.clientX-start.x,dy=t.clientY-start.y;if(Math.abs(dx)<85||Math.abs(dx)<Math.abs(dy)*2||Date.now()-start.time>750||!hubCanSwipe())return;const target=hubSwipeTarget(dx>0?'right':'left');if(target==='back')hubBack();else if(target)nav(target)},{passive:true});
document.addEventListener('touchcancel',()=>{hubTouch=null},{passive:true});
window.addEventListener('scroll',()=>{if(hubRouteHistory.length)hubRouteHistory.at(-1).scrollY=window.scrollY||0},{passive:true});
render();
