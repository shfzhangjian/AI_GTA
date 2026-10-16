/* Pure combat helpers: intentionally independent from Canvas/DOM for regression tests. */
(function(root, factory){const api=factory();if(typeof module!=='undefined')module.exports=api;root.PaperZeroCombat=api;})(globalThis,function(){
  function consumeCharge(charges, operator){
    if(operator==='minus') return {ok:true};
    if(!Number.isSafeInteger(charges[operator]) || charges[operator] <= 0) return {ok:false, reason:'铅笔芯用完'};
    charges[operator] -= 1;
    return {ok:true};
  }
  function pointToSegmentDistance(px,py,ax,ay,bx,by){
    const dx=bx-ax,dy=by-ay,den=dx*dx+dy*dy||1;
    const t=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/den));
    return Math.hypot(px-(ax+t*dx),py-(ay+t*dy));
  }
  return {consumeCharge,pointToSegmentDistance};
});
