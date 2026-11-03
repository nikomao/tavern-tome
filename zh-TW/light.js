/* 跟隨阅讀的暖光 */
(function(){
  var el = document.getElementById("readLight");
  if(!el) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var tx = 0.5, ty = 0.32, cx = 0.5, cy = 0.32, raf = 0, idle = 0;

  function apply(){
    el.style.setProperty("--lx", (cx * 100).toFixed(2) + "%");
    el.style.setProperty("--ly", (cy * 100).toFixed(2) + "%");
  }
  function tick(){
    cx += (tx - cx) * 0.08;
    cy += (ty - cy) * 0.08;
    apply();
    raf = requestAnimationFrame(tick);
  }

  function onMove(e){
    tx = e.clientX / window.innerWidth;
    ty = e.clientY / window.innerHeight;
    idle = 0;
  }

  window.addEventListener("pointermove", onMove, { passive: true });

  // 滚動時把光拉回視線中心，模擬“照亮正在讀的地方”
  var scrollTimer = 0;
  window.addEventListener("scroll", function(){
    clearTimeout(scrollTimer);
    if(idle > 900){
      tx = 0.5;
      ty = 0.34 + (Math.random() - 0.5) * 0.02;
    }
    scrollTimer = setTimeout(function(){ idle = 9999; }, 1200);
  }, { passive: true });

  setInterval(function(){ idle += 200; }, 200);

  if(reduce){
    apply();
    return;
  }
  tick();
})();
