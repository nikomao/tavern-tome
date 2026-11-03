/* 背景：火星粒子 + 視差 */
(function(){
  var c = document.getElementById("bgFx");
  if(!c) return;
  var x = c.getContext("2d");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var W = 0, H = 0, DPR = 1, parts = [], raf = 0;

  function resize(){
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    c.width = Math.round(W * DPR); c.height = Math.round(H * DPR);
    c.style.width = W + "px"; c.style.height = H + "px";
    x.setTransform(DPR, 0, 0, DPR, 0, 0);
    seed();
  }
  function seed(){
    var n = reduce ? 14 : 42;
    parts = [];
    for(var i = 0; i < n; i++){
      parts.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.6 + Math.random() * 1.8,
        vy: 0.15 + Math.random() * 0.5,
        drift: 0.2 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
        a: 0.25 + Math.random() * 0.55
      });
    }
  }
  function draw(t){
    x.clearRect(0, 0, W, H);
    for(var i = 0; i < parts.length; i++){
      var p = parts[i];
      if(!reduce){
        p.y -= p.vy;
        p.x += Math.sin(t / 2600 + p.phase) * p.drift * 0.35;
        if(p.y < -10){ p.y = H + 10; p.x = Math.random() * W; }
      }
      var flick = 0.72 + Math.sin(t / 420 + p.phase) * 0.28;
      var g = x.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
      g.addColorStop(0, "rgba(255,206,120," + (p.a * flick).toFixed(3) + ")");
      g.addColorStop(0.4, "rgba(226,150,60," + (p.a * flick * 0.45).toFixed(3) + ")");
      g.addColorStop(1, "rgba(226,150,60,0)");
      x.fillStyle = g;
      x.beginPath(); x.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2); x.fill();
    }
    raf = requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", function(){
    if(document.hidden){ cancelAnimationFrame(raf); raf = 0; }
    else if(!raf){ raf = requestAnimationFrame(draw); }
  });

  if(reduce){
    draw(0);
    cancelAnimationFrame(raf); raf = 0;
  } else {
    raf = requestAnimationFrame(draw);
  }

  // 鼠標視差
  if(!reduce && window.matchMedia("(hover: hover)").matches){
    document.addEventListener("pointermove", function(e){
      var px = (e.clientX / window.innerWidth - 0.5);
      var py = (e.clientY / window.innerHeight - 0.5);
      document.documentElement.style.setProperty("--mx", px.toFixed(3));
      document.documentElement.style.setProperty("--my", py.toFixed(3));
    }, { passive: true });
  }
})();
