/* 卡牌 3D 悬停效果（桌面端） */
(function(){
  if(window.matchMedia && window.matchMedia("(hover: none)").matches) return;
  if(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var SEL = ".comp-slot, .tb-card, .fc, .ps-slot";
  var current = null;

  document.addEventListener("pointermove", function(e){
    var el = e.target.closest ? e.target.closest(SEL) : null;
    if(!el){ if(current){ current.style.transform = ""; current = null; } return; }
    if(el !== current) current = el;
    var r = el.getBoundingClientRect();
    var px = (e.clientX - r.left) / r.width - 0.5;
    var py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = "perspective(760px) rotateX(" + (-py * 16).toFixed(2) + "deg) rotateY(" + (px * 16).toFixed(2) + "deg) translateZ(0)";
  }, { passive: true });

  document.addEventListener("pointerleave", function(){
    if(current){ current.style.transform = ""; current = null; }
  }, true);
})();
