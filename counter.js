/* 顶部累计访问人数（Abacus 公开计数器） */
(function(){
  var el = document.getElementById("visitBadge");
  if(!el) return;
  var NS = "tavern-tome", KEY = "visits";
  var API = "https://abacus.jasoncameron.dev";
  var numEl = el.querySelector("b");
  var counted = false;
  try { counted = sessionStorage.getItem("tt-visit") === "1"; } catch(e){}

  function animate(n){
    var from = Math.max(0, n - 30);
    var start = performance.now();
    var dur = 700;
    function tick(t){
      var p = Math.min(1, (t - start) / dur);
      var v = Math.round(from + (n - from) * (1 - Math.pow(1 - p, 3)));
      numEl.textContent = v.toLocaleString("en-US");
      if(p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  function paint(n){
    el.hidden = false;
    animate(n);
  }
  function get(){
    return fetch(API + "/get/" + NS + "/" + KEY, { cache: "no-store" })
      .then(function(r){ return r.ok ? r.json() : null; });
  }
  function hit(){
    return fetch(API + "/hit/" + NS + "/" + KEY, { cache: "no-store" })
      .then(function(r){ return r.json(); });
  }

  if(counted){
    get().then(function(j){
      if(j && typeof j.value === "number") paint(j.value);
      else hit().then(function(j2){ if(j2 && j2.value != null) paint(j2.value); });
    }).catch(function(){});
  } else {
    hit().then(function(j){
      if(j && j.value != null){
        paint(j.value);
        try { sessionStorage.setItem("tt-visit", "1"); } catch(e){}
      }
    }).catch(function(){});
  }
})();
