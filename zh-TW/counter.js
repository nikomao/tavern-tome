/* 頂部訪客序號 + 今日新增（Abacus 公開計數器） */
(function(){
  var el = document.getElementById("visitBadge");
  if(!el) return;
  var NS = "tavern-tome", KEY = "visits", API = "https://abacus.jasoncameron.dev";
  var numEl = el.querySelector("b");
  var todayEl = el.querySelector(".vb-today");
  var counted = false;
  try { counted = sessionStorage.getItem("tt-visit") === "1"; } catch(e){}

  var d = new Date();
  var day = d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0");
  var TODAY = "today-" + day;

  function animate(n){
    var from = Math.max(0, n - 30), start = performance.now(), dur = 750;
    function tick(t){
      var p = Math.min(1, (t - start) / dur);
      var v = Math.round(from + (n - from) * (1 - Math.pow(1 - p, 3)));
      numEl.textContent = v.toLocaleString("en-US");
      if(p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  function paint(total, today){
    el.hidden = false;
    animate(total);
    if(todayEl && today != null) todayEl.textContent = "今日 +" + today;
  }
  function call(kind, key){
    return fetch(API + "/" + kind + "/" + NS + "/" + key, { cache: "no-store" })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){ return j && j.value != null ? j.value : null; })
      .catch(function(){ return null; });
  }

  if(counted){
    Promise.all([call("get", KEY), call("get", TODAY)]).then(function(res){
      var total = res[0], today = res[1];
      if(total == null || today == null){
        Promise.all([call("hit", KEY), call("hit", TODAY)]).then(function(r2){ paint(r2[0] || 0, r2[1] || 0); });
      } else paint(total, today);
    });
  } else {
    Promise.all([call("hit", KEY), call("hit", TODAY)]).then(function(res){
      var total = res[0], today = res[1];
      if(total == null){ call("get", KEY).then(function(v){ total = v; }); }
      paint(total || 0, today || 0);
      try { sessionStorage.setItem("tt-visit", "1"); } catch(e){}
    });
  }
})();
