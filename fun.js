/* 滚动动画 + 随机阵容 */
(function(){
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(!reduce && "IntersectionObserver" in window){
    var secs = document.querySelectorAll(".section");
    Array.prototype.forEach.call(secs, function(s){ s.classList.add("reveal"); });
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.01, rootMargin: "0px 0px -30px 0px" });
    Array.prototype.forEach.call(secs, function(s){ io.observe(s); });
  }

  var btn = document.getElementById("compRandom");
  if(btn){
    btn.addEventListener("click", function(){
      var cards = document.querySelectorAll(".comp-card");
      if(!cards.length) return;
      var pick = cards[Math.floor(Math.random() * cards.length)];
      pick.scrollIntoView({ behavior: "smooth", block: "center" });
      pick.classList.add("comp-flash");
      btn.classList.add("rolling");
      setTimeout(function(){ pick.classList.remove("comp-flash"); btn.classList.remove("rolling"); }, 1400);
    });
  }
})();
