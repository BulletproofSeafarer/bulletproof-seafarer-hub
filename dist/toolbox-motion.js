/* Toolbox 2.6.1: one-shot viewport motion; no timers, no perpetual loops. */
(function(){'use strict';
  var selector='.tb-intro-art img,.crew-companion[data-mood="thinking"] .crew-mascot,.cloud-boat';
  if(!('IntersectionObserver' in window))return;
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce)return;
  var observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){
    if(!entry.isIntersecting)return;
    observer.unobserve(entry.target);
    entry.target.classList.add('motion-enter');
    entry.target.addEventListener('animationend',function(){entry.target.classList.remove('motion-enter')},{once:true});
  });},{threshold:0.2});
  function register(){document.querySelectorAll(selector).forEach(function(el){
    if(el.dataset.motionRegistered)return;
    el.dataset.motionRegistered='1';observer.observe(el);
  });}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',register,{once:true});else register();
  /* On-demand UI (onboarding/dialogs) may appear after initial load. */
  document.addEventListener('click',function(e){
    var el=e.target.closest&&e.target.closest(selector);
    if(!el)return;
    el.classList.remove('motion-tap');void el.offsetWidth;el.classList.add('motion-tap');
    el.addEventListener('animationend',function(){el.classList.remove('motion-tap')},{once:true});
  });
  document.addEventListener('toolbox:viewchange',register);
  if('MutationObserver' in window){
    var queued=false;
    new MutationObserver(function(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;register()})})
      .observe(document.documentElement,{childList:true,subtree:true});
  }
})();
