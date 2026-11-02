/* 右侧悬浮章节导航 */
(function(){
  var rail = document.getElementById("sideRail");
  var dots = document.getElementById("railDots");
  var fill = document.getElementById("railFill");
  var topBtn = document.getElementById("railTop");
  if(!rail || !dots) return;

  var ITEMS = [
    { id: "start", label: "入门" },
    { id: "laws", label: "定律" },
    { id: "math", label: "数学" },
    { id: "fusion", label: "融合" },
    { id: "positioning", label: "站位" },
    { id: "tribes", label: "种族" },
    { id: "table", label: "速查" },
    { id: "meta", label: "周报" },
    { id: "heroes", label: "英雄" },
    { id: "news", label: "热点" },
    { id: "visitors", label: "足迹" },
    { id: "finder", label: "反查" },
    { id: "flow", label: "决策" },
    { id: "glossary", label: "术语" }
  ];

  var btns = {};
  ITEMS.forEach(function(it){
    var sec = document.getElementById(it.id);
    if(!sec) return;
    var b = document.createElement("button");
    b.type = "button";
    b.className = "rail-dot";
    b.setAttribute("data-id", it.id);
    b.setAttribute("aria-label", it.label);
    b.innerHTML = '<span class="rd-label">' + it.label + '</span><i></i>';
    b.addEventListener("click", function(){
      sec.scrollIntoView({ behavior: "smooth", block: "start" });
      if(history.replaceState) history.replaceState(null, "", "#" + it.id);
    });
    dots.appendChild(b);
    btns[it.id] = b;
  });

  var sections = ITEMS.map(function(it){ return document.getElementById(it.id); }).filter(Boolean);
  var active = null;
  function setActive(id){
    if(active === id) return;
    active = id;
    Object.keys(btns).forEach(function(k){ btns[k].classList.toggle("on", k === id); });
  }

  function onScroll(){
    var mid = window.scrollY + window.innerHeight * 0.35;
    var current = sections[0];
    for(var i = 0; i < sections.length; i++){
      if(sections[i].offsetTop <= mid) current = sections[i];
    }
    if(current) setActive(current.id);

    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    if(fill) fill.style.height = (p * 100).toFixed(2) + "%";
    if(topBtn) topBtn.classList.toggle("show", window.scrollY > 600);
  }

  var ticking = false;
  window.addEventListener("scroll", function(){
    if(!ticking){
      ticking = true;
      requestAnimationFrame(function(){ onScroll(); ticking = false; });
    }
  }, { passive: true });
  onScroll();

  if(topBtn) topBtn.addEventListener("click", function(){ window.scrollTo({ top: 0, behavior: "smooth" }); });
})();
