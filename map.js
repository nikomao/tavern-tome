/* 访客世界地图（jsVectorMap） */
(function(){
  var host = document.getElementById("worldMap");
  if(!host || typeof jsVectorMap === "undefined") return;
  var topEl = document.getElementById("visitTop");
  var note = document.getElementById("visitNote");

  var NAME2ISO = {
    "China":"CN","Taiwan":"TW","Hong Kong":"HK","Macao":"MO","Japan":"JP","South Korea":"KR","Korea, Republic of":"KR",
    "Singapore":"SG","Malaysia":"MY","Thailand":"TH","Vietnam":"VN","Philippines":"PH","Indonesia":"ID","India":"IN",
    "Australia":"AU","New Zealand":"NZ","United Kingdom":"GB","Germany":"DE","France":"FR","Canada":"CA","Brazil":"BR",
    "Russia":"RU","Ukraine":"UA","Turkey":"TR","Saudi Arabia":"SA","United Arab Emirates":"AE","Netherlands":"NL",
    "Spain":"ES","Italy":"IT","Poland":"PL","Sweden":"SE","Norway":"NO","Denmark":"DK","Finland":"FI","Switzerland":"CH",
    "Austria":"AT","Belgium":"BE","Portugal":"PT","Ireland":"IE","Czechia":"CZ","Czech Republic":"CZ","Romania":"RO",
    "Greece":"GR","Hungary":"HU","Israel":"IL","Egypt":"EG","South Africa":"ZA","Mexico":"MX","Argentina":"AR",
    "Chile":"CL","Colombia":"CO","Peru":"PE","Pakistan":"PK","Bangladesh":"BD","Sri Lanka":"LK","Nepal":"NP",
    "Kazakhstan":"KZ","Uzbekistan":"UZ","Mongolia":"MN","Myanmar":"MM","Cambodia":"KH","Laos":"LA","Brunei":"BN",
    "Qatar":"QA","Kuwait":"KW","Iraq":"IQ","Iran":"IR","Morocco":"MA","Nigeria":"NG","Kenya":"KE","Ethiopia":"ET",
    "Ghana":"GH","Algeria":"DZ","Tunisia":"TN","Belarus":"BY","Bulgaria":"BG","Croatia":"HR","Serbia":"RS",
    "Slovakia":"SK","Slovenia":"SI","Lithuania":"LT","Latvia":"LV","Estonia":"EE","Iceland":"IS","Luxembourg":"LU",
    "Malta":"MT","Cyprus":"CY","Georgia":"GE","Armenia":"AM","Azerbaijan":"AZ"
  };

  function render(countries){
    var values = {};
    var rows = [];
    (countries || []).forEach(function(c){
      var iso = NAME2ISO[c.name];
      if(!iso) return;
      values[iso] = (values[iso] || 0) + c.views;
      rows.push({ name: c.name, views: c.views });
    });
    rows.sort(function(a,b){ return b.views - a.views; });

    var has = Object.keys(values).length > 0;
    if(topEl){
      topEl.innerHTML = has ? rows.slice(0, 6).map(function(r){
        return '<li><span>' + r.name + '</span><b>' + r.views + '</b></li>';
      }).join("") : '<li class="muted">还没有国家数据</li>';
    }
    if(note){
      note.textContent = has
        ? "数据来自 Cloudflare Web Analytics，每天更新。越亮 = 访问越多。"
        : "接入 Cloudflare API 后，这里会每天自动点亮。";
    }

    var map = new jsVectorMap({
      selector: "#worldMap",
      map: "world",
      zoomButtons: false,
      backgroundColor: "transparent",
      regionStyle: {
        initial: { fill: "#2e1b10", stroke: "#5a3a1e", strokeWidth: 0.6 },
        hover: { fill: "#e2b45f", stroke: "#ffd98a" }
      },
      onRegionTooltipShow: function(e, tooltip, code){
        var v = values[code];
        tooltip.text(tooltip.text() + (v ? " · " + v + " 次访问" : ""));
      }
    });

    function colorFor(v){
      var max = Math.max.apply(null, Object.keys(values).map(function(k){ return values[k]; }).concat([1]));
      var t = Math.pow(v / max, 0.5);
      var stops = [[58,34,17],[110,66,24],[180,120,46],[232,184,104],[255,235,180]];
      var p = t * (stops.length - 1);
      var i = Math.min(stops.length - 2, Math.floor(p));
      var f = p - i;
      var a = stops[i], b = stops[i + 1];
      var c = [0,1,2].map(function(n){ return Math.round(a[n] + (b[n] - a[n]) * f); });
      return "rgb(" + c.join(",") + ")";
    }
    function paint(){
      var paths = document.querySelectorAll("#worldMap path[data-code]");
      for(var i = 0; i < paths.length; i++){
        var code = paths[i].getAttribute("data-code");
        if(values[code]) paths[i].setAttribute("fill", colorFor(values[code]));
      }
    }
    setTimeout(paint, 400);
    setTimeout(paint, 1200);
  }

  function demo(){
    return [
      { name: "China", views: 128 }, { name: "Taiwan", views: 54 }, { name: "United States", views: 41 },
      { name: "Japan", views: 22 }, { name: "Singapore", views: 16 }, { name: "Germany", views: 9 }
    ];
  }

  fetch("popular.json?t=" + Date.now())
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(j){
      var countries = (j && j.countries) || [];
      if(!countries.length && /(\?|&)demo=1/.test(location.search)) countries = demo();
      render(countries);
    })
    .catch(function(){ render(/demo=1/.test(location.search) ? demo() : []); });
})();
