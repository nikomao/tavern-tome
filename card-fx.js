/* 卡牌 3D 悬停效果（桌面端） */
(function(){
  if(window.matchMedia && window.matchMedia("(hover: none)").matches) return;
  if(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var SEL = ".comp-slot, .tb-card, .fc, .ps-slot";
  var current = null;

  document.addEventListener("pointermove", function(e){
    var el = e.target.closest ? e.target.closest(SEL) : null;
    if(!el){ if(current){ current.style.setProperty("--rx","0deg"); current.style.setProperty("--ry","0deg"); current = null; } return; }
    if(el !== current) current = el;
    var r = el.getBoundingClientRect();
    var px = (e.clientX - r.left) / r.width - 0.5;
    var py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--ry", (px * 16).toFixed(2) + "deg");
    el.style.setProperty("--rx", (-py * 16).toFixed(2) + "deg");
  }, { passive: true });

  document.addEventListener("pointerleave", function(){
    if(current){ current.style.setProperty("--rx","0deg"); current.style.setProperty("--ry","0deg"); current = null; }
  }, true);
})();
