/**
 * 酒馆手札 - 全局卡牌详情弹窗与卡牌名称交互引擎
 * 支持全站所有卡牌名称/格子点击弹窗查看卡牌具体信息
 */
(function(){
  "use strict";

  // 1. 常用玩家别名/黑话与官方全名映射表
  var ALIAS_MAP = {
    "铜须": "布莱恩·铜须",
    "瑞文": "提图斯·瑞文戴尔",
    "提图斯": "提图斯·瑞文戴尔",
    "巴琳达": "巴琳达·斯通赫尔斯",
    "白狼": "巨狼戈德林",
    "戈德林": "巨狼戈德林",
    "赤红守备": "赤红守备巨龙",
    "守备巨龙": "赤红守备巨龙",
    "诗心龙": "执念诗心龙",
    "偏折": "偏折机器人",
    "偏折机械": "偏折机器人",
    "光耀": "炫目的光耀之子",
    "光耀之子": "炫目的光耀之子",
    "卡雷": "奥术守护者卡雷苟斯",
    "卡雷苟斯": "奥术守护者卡雷苟斯",
    "达卡莱": "达卡莱附魔师",
    "附魔师": "达卡莱附魔师",
    "卡尔加": "卡尔加",
    "诺米": "厨房名厨诺米",
    "狂战": "死神4000型",
    "狂战斧": "死神4000型",
    "火车王": "莽神火车王",
    "坑道爆破师": "坑道爆破师",
    "爆破师": "坑道爆破师",
    "扎普": "扎普·斯里维克",
    "扎普·斯罗格": "扎普·斯里维克",
    "扎普·斯里维克": "扎普·斯里维克",
    "茶水": "茶水大师西塔尔",
    "茶水大师": "茶水大师西塔尔",
    "西塔尔": "茶水大师西塔尔",
    "电表": "舰队上将特塞斯",
    "特塞斯": "舰队上将特塞斯",
    "红衣": "红衣纳迪娜",
    "纳迪娜": "红衣纳迪娜",
    "青铜守卫": "青铜守卫",
    "乌祖尔": "贪食的乌祖尔",
    "魔蝠": "饥饿的魔蝠",
    "跳蛙": "跳蛙骑士",
    "跳蛙骑士": "跳蛙骑士",
    "玛诺洛斯": "玛诺洛斯",
    "斯瑟拉": "异教徒斯瑟拉",
    "异教徒斯瑟拉": "异教徒斯瑟拉",
    "地卜术师": "得胜的地卜术师",
    "得胜的地卜术师": "得胜的地卜术师",
    "测绘员": "热气球测绘员",
    "热气球": "热气球测绘员",
    "守门融合怪": "守门融合怪",
    "融合怪": "守门融合怪",
    "邪火咒龙": "邪火咒龙",
    "傀儡师": "黑暗傀儡师",
    "黑暗傀儡师": "黑暗傀儡师",
    "摩托车": "极速野猪骑士",
    "极速野猪骑士": "极速野猪骑士",
    "双头飞龙": "重金属双头飞龙",
    "香蕉猴": "香蕉猛猿",
    "香蕉猛猿": "香蕉猛猿",
    "佩吉": "佩吉·斯特迪伯",
    "金枪": "金枪格蕾塔",
    "金枪格蕾塔": "金枪格蕾塔",
    "小瞎眼": "小瞎眼",
    "合唱鱼人": "合唱鱼人",
    "低音提琴鱼人": "低音提琴鱼人",
    "裁脍鱼人": "裁脍鱼人",
    "深沉蓝调": "深沉蓝调歌手",
    "深沉蓝调歌手": "深沉蓝调歌手",
    "蓝调": "深沉蓝调歌手",
    "沙锤手": "热情沙锤手",
    "潮汐主母": "潮汐主母阿茜萨",
    "奥戈佐亚": "照看者奥戈佐亚",
    "永恒骑士": "永恒骑士",
    "永恒召唤者": "永恒召唤者",
    "亡语者姐妹": "亡语者姐妹",
    "蛛魔之王": "蛛魔之王阿努巴拉克",
    "阿努巴拉克": "蛛魔之王阿努巴拉克",
    "兵主": "兵主的勇士",
    "兵主的勇士": "兵主的勇士",
    "作曲鬃师": "作曲鬃师",
    "暗膘爵士乐手": "暗膘爵士乐手",
    "獠牙队长": "獠牙队长",
    "阿格姆": "阿格姆·棘咒",
    "阿格姆·棘咒": "阿格姆·棘咒",
    "宝石走私商": "宝石走私商",
    "走私商": "宝石走私商",
    "鲁古格": "地卜大师鲁古格",
    "地卜大师鲁古格": "地卜大师鲁古格",
    "油彩画家": "油彩画家",
    "惊喜元素": "惊喜元素",
    "缤纷冰灵": "缤纷冰灵",
    "农场热舞旋风": "农场热舞旋风",
    "热舞旋风": "农场热舞旋风",
    "摇滚岩石": "摇滚岩石",
    "回收魔灵": "回收魔灵",
    "无人机": "多面辅助无人机",
    "多面辅助无人机": "多面辅助无人机",
    "拳手": "极性B-Box拳手",
    "B-BOX": "极性B-Box拳手",
    "B-Box": "极性B-Box拳手",
    "极性B-Box拳手": "极性B-Box拳手",
    "吵吵演艺团": "吵吵演艺团",
    "欧米茄破坏者": "欧米茄破坏者",
    "自适应路障": "自适应路障",
    "唱片走私犯": "唱片走私犯",
    "火药运输工": "火药运输工",
    "开挂荷官": "开挂荷官",
    "刀剑收藏家": "刀剑收藏家",
    "重伤的强盗": "重伤的强盗",
    "克尔苏加德": "大巫妖克尔苏加德",
    "大巫妖克尔苏加德": "大巫妖克尔苏加德",
    "莫罗斯": "死亡管家莫罗斯",
    "死亡管家莫罗斯": "死亡管家莫罗斯",
    "灵魂切分者": "灵魂切分者",
    "千纸幼龙": "千纸幼龙",
    "英勇的巢母": "英勇的巢母",
    "巢母": "英勇的巢母",
    "诺兹多姆的子嗣": "诺兹多姆的子嗣",
    "子嗣": "诺兹多姆的子嗣",
    "希望信使": "希望信使",
    "灵魂倒带者": "灵魂回溯者",
    "倒带者": "灵魂回溯者",
    "回溯者": "灵魂回溯者",
    "灵魂回溯者": "灵魂回溯者",
    "粗暴的猢狲": "粗暴的猢狲",
    "猢狲": "粗暴的猢狲",
    "死神4000型": "死神4000型",
    "洞穴多头蛇": "洞穴多头蛇"
  };

  var RACE_CN = {
    BEAST: "野兽", DEMON: "恶魔", DRAGON: "龙", ELEMENTAL: "元素", MECHANICAL: "机械",
    MURLOC: "鱼人", NAGA: "纳迦", PIRATE: "海盗", QUILBOAR: "野猪人", UNDEAD: "亡灵",
    ABERRATION: "畸变怪", ALL: "全种族"
  };

  var TRIBE_ID = {
    BEAST: "beast", DEMON: "demon", DRAGON: "dragon", ELEMENTAL: "elemental",
    MECHANICAL: "mech", MURLOC: "murloc", NAGA: "naga", PIRATE: "pirate",
    QUILBOAR: "quilboar", UNDEAD: "undead", ABERRATION: "aberration", ALL: "fusion"
  };

  function tierStars(n){
    n = Number(n);
    if(!n || n < 1) return "";
    return '<i class="star"></i>'.repeat(Math.min(7, n));
  }

  // 格式化卡牌效果关键词为彩色胶囊
  function formatCardKeywords(text){
    return String(text || "")
      .replace(/战吼/g, '<span class="cp-kw battlecry">战吼</span>')
      .replace(/亡语/g, '<span class="cp-kw deathrattle">亡语</span>')
      .replace(/圣盾/g, '<span class="cp-kw shield">圣盾</span>')
      .replace(/烈毒|剧毒/g, '<span class="cp-kw poison">烈毒</span>')
      .replace(/风怒/g, '<span class="cp-kw windfury">风怒</span>')
      .replace(/嘲讽/g, '<span class="cp-kw taunt">嘲讽</span>')
      .replace(/复生/g, '<span class="cp-kw reborn">复生</span>')
      .replace(/磁力/g, '<span class="cp-kw magnetic">磁力</span>')
      .replace(/进击/g, '<span class="cp-kw magnetic">进击</span>')
      .replace(/塑造法术/g, '<span class="cp-kw windfury">塑造法术</span>')
      .replace(/复仇/g, '<span class="cp-kw deathrattle">复仇</span>');
  }

  // 全局卡牌查询核心
  function findCard(query){
    if(!query) return null;
    var raw = String(query).trim().replace(/^[【「『]/, '').replace(/[】」』]$/, '').trim();
    if(!raw) return null;

    var poolList = (typeof POOL !== "undefined" && Array.isArray(POOL)) ? POOL : [];
    var extraDict = (typeof EXTRA_CARDS !== "undefined") ? EXTRA_CARDS : {};
    var cardsDict = (typeof CARDS !== "undefined") ? CARDS : {};

    // 1. 根据 ID 精确匹配 (如 BG25_354, TB_BaconUps_045, BGS_040 等)
    if(/^[A-Za-z0-9_]+$/.test(raw)){
      for(var i = 0; i < poolList.length; i++){
        if(poolList[i].i === raw) return buildCardDetail(poolList[i], raw);
      }
      if(extraDict[raw]){
        return buildCardDetail(Object.assign({ i: raw }, extraDict[raw]), raw);
      }
    }

    // 2. 根据官方全名在 POOL 中精确匹配
    for(var j = 0; j < poolList.length; j++){
      if(poolList[j].n === raw) return buildCardDetail(poolList[j], raw);
    }

    // 3. 在 EXTRA_CARDS 中精确匹配
    for(var ek in extraDict){
      if(extraDict[ek].n === raw) return buildCardDetail(Object.assign({ i: ek }, extraDict[ek]), raw);
    }

    // 4. 在 CARDS 字典中匹配 key
    if(cardsDict[raw]){
      var cd = cardsDict[raw];
      var offName = cd.n || raw;
      // 尝试去 POOL 拿完整数据
      for(var k = 0; k < poolList.length; k++){
        if(poolList[k].n === offName) return buildCardDetail(poolList[k], raw, cd);
      }
      return buildCardDetailFromCARDS(cd, raw);
    }

    // 5. 在 ALIAS_MAP 中查找别名映射
    var aliasTarget = ALIAS_MAP[raw];
    if(aliasTarget){
      for(var m = 0; m < poolList.length; m++){
        if(poolList[m].n === aliasTarget) return buildCardDetail(poolList[m], raw);
      }
      for(var em in extraDict){
        if(extraDict[em].n === aliasTarget) return buildCardDetail(Object.assign({ i: em }, extraDict[em]), raw);
      }
      if(cardsDict[aliasTarget]){
        return buildCardDetailFromCARDS(cardsDict[aliasTarget], raw);
      }
    }

    // 6. 模糊匹配 (前缀/包含/去修饰词)
    var clean = raw.replace(/^(金色|巨型|普通)/, '');
    for(var n = 0; n < poolList.length; n++){
      var pName = poolList[n].n;
      if(pName === clean || pName.indexOf(clean) >= 0 || clean.indexOf(pName) >= 0){
        return buildCardDetail(poolList[n], raw);
      }
    }

    for(var ck in cardsDict){
      if(ck === clean || ck.indexOf(clean) >= 0 || clean.indexOf(ck) >= 0){
        return buildCardDetailFromCARDS(cardsDict[ck], raw);
      }
    }

    return null;
  }

  // 组装标准卡牌数据对象
  function buildCardDetail(c, queryName, optionalCardObj){
    var id = c.i || (optionalCardObj && optionalCardObj.img ? optionalCardObj.img.replace(/^.*\//, '').replace(/\.[^.]+$/, '') : "");
    var name = c.n || queryName;
    var alias = (queryName && queryName !== name) ? queryName : "";
    var tier = c.t != null ? c.t : (optionalCardObj ? optionalCardObj.t : null);
    var isSpell = (c.y === 1) || (optionalCardObj && optionalCardObj.k === "spell");
    var atk = c.a != null ? c.a : (optionalCardObj ? optionalCardObj.a : null);
    var hp = c.h != null ? c.h : (optionalCardObj ? optionalCardObj.h : null);
    var desc = c.x || (optionalCardObj ? optionalCardObj.x : "") || "暂无卡牌描述";
    var raceRaw = c.r || (optionalCardObj ? optionalCardObj.r : "") || "";

    var races = [];
    if(raceRaw){
      races = String(raceRaw).split("/").map(function(r){ return RACE_CN[r] || r; }).filter(Boolean);
    }

    // 图片路径自适应
    var inSub = (typeof location !== "undefined" && (location.pathname.indexOf("/zh-TW/") >= 0 || location.pathname.indexOf("\\zh-TW\\") >= 0));
    var pfx = inSub ? "../pool/" : "pool/";
    var imgSrc = "";
    if(c.m && c.i){
      imgSrc = pfx + c.i + ".webp";
    } else if(optionalCardObj && optionalCardObj.img){
      imgSrc = (inSub && optionalCardObj.img.indexOf("../") !== 0) ? ("../" + optionalCardObj.img) : optionalCardObj.img;
    } else if(c.i){
      imgSrc = pfx + c.i + ".webp";
    }

    // 角色定位
    var roleTag = getCardRoleTag(name, queryName);

    return {
      id: id,
      name: name,
      alias: alias,
      tier: tier,
      isSpell: isSpell,
      attack: atk,
      health: hp,
      races: races,
      raceRaw: raceRaw,
      desc: desc,
      img: imgSrc,
      hasImg: !!imgSrc,
      roleTag: roleTag
    };
  }

  function buildCardDetailFromCARDS(cd, queryName){
    var name = cd.n || queryName;
    var alias = (queryName && queryName !== name) ? queryName : "";
    var races = cd.r ? [cd.r] : [];
    var id = "";
    if(cd.img){
      var m = /\/([^\/]+)\.webp$/.exec(cd.img);
      if(m) id = m[1];
    }
    return {
      id: id,
      name: name,
      alias: alias,
      tier: cd.t,
      isSpell: cd.k === "spell",
      attack: cd.a,
      health: cd.h,
      races: races,
      raceRaw: cd.r || "",
      desc: cd.x || "暂无卡牌描述",
      img: cd.img || "",
      hasImg: !!cd.img,
      roleTag: getCardRoleTag(name, queryName)
    };
  }

  // 提取核心定位标签 (Carrier / Engine / Finisher)
  function getCardRoleTag(name, alias){
    if(typeof COMP_NOTES === "undefined") return null;
    var targets = [name, alias].filter(Boolean);
    for(var key in COMP_NOTES){
      var m = COMP_NOTES[key].cardsMapping;
      if(!m) continue;
      for(var i = 0; i < targets.length; i++){
        var t = targets[i];
        if(m.carrier && m.carrier.indexOf(t) >= 0) return { type: "carrier", label: "🎯 核心承载宿主" };
        if(m.engine && m.engine.indexOf(t) >= 0) return { type: "engine", label: "⚡ 核心乘数引擎" };
        if(m.finisher && m.finisher.indexOf(t) >= 0) return { type: "finisher", label: "👑 终局终结位" };
      }
    }
    return null;
  }

  // 2. 初始化全局弹窗 DOM
  var modalEl = null;

  function ensureModalDOM(){
    if(modalEl && document.body.contains(modalEl)) return modalEl;

    // 检查是否页面已有 poolModal (如 cards.html)
    var existing = document.getElementById("poolModal");
    if(existing){
      modalEl = existing;
      return modalEl;
    }

    var div = document.createElement("div");
    div.className = "pool-modal";
    div.id = "globalCardModal";
    div.hidden = true;
    div.setAttribute("aria-hidden", "true");
    div.setAttribute("role", "dialog");
    div.setAttribute("aria-modal", "true");

    div.innerHTML =
      '<div class="pm-card">' +
        '<button type="button" class="pm-close" id="gcmClose" aria-label="关闭">×</button>' +
        '<div class="pm-img" id="gcmImgWrap">' +
          '<img id="gcmImg" alt="" />' +
          '<div class="pm-noimg" id="gcmNoImg" style="display:none;"><i>?</i><span>卡图收录中</span></div>' +
        '</div>' +
        '<div class="pm-info">' +
          '<div class="pm-title-row">' +
            '<h3 id="gcmName"></h3>' +
            '<span class="pm-alias" id="gcmAlias" style="display:none;"></span>' +
          '</div>' +
          '<div class="pm-meta" id="gcmMeta"></div>' +
          '<p class="pm-text" id="gcmText"></p>' +
          '<div class="pm-extra" id="gcmExtra"></div>' +
          '<div class="pm-footer">' +
            '<div class="pm-tribes" id="gcmTribes"></div>' +
            '<a class="pm-pool-link" id="gcmPoolLink" href="#" target="_blank" rel="noopener">在完整卡池中查看 →</a>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(div);
    modalEl = div;
    bindModalEvents(modalEl);
    return modalEl;
  }

  function bindModalEvents(m){
    m.addEventListener("click", function(e){
      if(e.target === m || e.target.closest("#gcmClose") || e.target.closest("#pmClose") || e.target.closest(".pm-close")){
        closeCardModal();
      }
    });
  }

  document.addEventListener("keydown", function(e){
    if(e.key === "Escape" && modalEl && !modalEl.hidden){
      closeCardModal();
    }
  });

  // 打开卡牌详情弹窗
  function openCardModal(query){
    var card = findCard(query);
    if(!card) return false;

    var m = ensureModalDOM();
    if(!m) return false;

    // 隐藏现有可能跟随鼠标的 popover
    var pop = document.getElementById("cardPop");
    if(pop) pop.hidden = true;

    // 填充数据
    var nameEl = m.querySelector("#gcmName") || m.querySelector("#pmName");
    var aliasEl = m.querySelector("#gcmAlias") || m.querySelector("#pmAlias");
    var metaEl = m.querySelector("#gcmMeta") || m.querySelector("#pmMeta");
    var textEl = m.querySelector("#gcmText") || m.querySelector("#pmText");
    var imgEl = m.querySelector("#gcmImg") || m.querySelector("#pmImg");
    var noImgEl = m.querySelector("#gcmNoImg");
    var extraEl = m.querySelector("#gcmExtra");
    var tribesEl = m.querySelector("#gcmTribes") || m.querySelector("#pmTribes");
    var poolLinkEl = m.querySelector("#gcmPoolLink");

    // 标题与别名
    if(nameEl) nameEl.textContent = card.name;
    if(aliasEl){
      if(card.alias && card.alias !== card.name){
        aliasEl.textContent = "别名：" + card.alias;
        aliasEl.style.display = "";
      } else {
        aliasEl.style.display = "none";
      }
    }

    // 元数据 (星级 / 身材 / 种族)
    var metaBits = [];
    if(card.tier != null) metaBits.push('<span class="stars">' + tierStars(card.tier) + '</span>');
    if(card.isSpell) metaBits.push('酒馆法术');
    else if(card.attack != null && card.health != null) metaBits.push(card.attack + ' / ' + card.health);
    if(card.races && card.races.length) metaBits.push(card.races.join(' / '));
    else if(!card.isSpell) metaBits.push('无种族');

    if(metaEl) metaEl.innerHTML = metaBits.join(' · ');

    // 卡牌效果描述 (高亮关键词)
    if(textEl) textEl.innerHTML = formatCardKeywords(card.desc);

    // 图片处理
    if(imgEl){
      if(card.hasImg && card.img){
        imgEl.src = card.img;
        imgEl.style.display = "";
        if(noImgEl) noImgEl.style.display = "none";
        imgEl.onerror = function(){
          this.style.display = "none";
          if(noImgEl) noImgEl.style.display = "flex";
        };
      } else {
        imgEl.style.display = "none";
        if(noImgEl) noImgEl.style.display = "flex";
      }
    }

    // 进阶属性 (金色身材 / 核心定位)
    if(extraEl){
      var extras = [];
      if(!card.isSpell && card.attack != null && card.health != null){
        extras.push('<span class="cp-golden">✨ 金色 <b>' + (card.attack * 2) + '/' + (card.health * 2) + '</b> (翻倍)</span>');
      }
      if(card.roleTag){
        extras.push('<span class="cp-role ' + card.roleTag.type + '">' + card.roleTag.label + '</span>');
      }
      extraEl.innerHTML = extras.join(' ');
      extraEl.style.display = extras.length ? "flex" : "none";
    }

    // 种族图鉴跳转
    if(tribesEl){
      tribesEl.innerHTML = "";
      var rRaw = (card.raceRaw || "").split("/");
      rRaw.forEach(function(r){
        var tid = TRIBE_ID[r];
        if(!tid) return;
        var rName = RACE_CN[r] || r;
        var a = document.createElement("a");
        a.href = "index.html?tribe=" + tid + "#tribes";
        a.textContent = "看「" + rName + "」流派 →";
        a.addEventListener("click", function(){ closeCardModal(); });
        tribesEl.appendChild(a);
      });
    }

    // 卡池页面链接
    if(poolLinkEl){
      if(card.id){
        poolLinkEl.href = "cards.html?card=" + encodeURIComponent(card.id);
        poolLinkEl.style.display = "";
      } else {
        poolLinkEl.href = "cards.html?search=" + encodeURIComponent(card.name);
        poolLinkEl.style.display = "";
      }
    }

    m.hidden = false;
    m.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    return true;
  }

  function closeCardModal(){
    if(!modalEl) return;
    modalEl.hidden = true;
    modalEl.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  // 3. 全局捕获阶段点击委托拦截器
  // 增加移动端滑动防误触机制：手指滑动距离超过 8px 视作滑屏滚屏，不触发卡牌弹窗
  var touchStartX = 0, touchStartY = 0, touchMoved = false;
  document.addEventListener("touchstart", function(e){
    if(e.touches && e.touches[0]){
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchMoved = false;
    }
  }, { passive: true });

  document.addEventListener("touchmove", function(e){
    if(e.touches && e.touches[0]){
      var dx = Math.abs(e.touches[0].clientX - touchStartX);
      var dy = Math.abs(e.touches[0].clientY - touchStartY);
      if(dx > 8 || dy > 8){
        touchMoved = true;
      }
    }
  }, { passive: true });

  document.addEventListener("click", function(e){
    // 如果在触摸屏上是在滑屏翻滚，彻底忽略，防止移动端手势误碰
    if(touchMoved) return;

    // 弹窗内部的点击不作为卡牌触发
    if(e.target.closest("#globalCardModal") || e.target.closest("#poolModal")){
      var closeBtn = e.target.closest(".pm-close");
      var modalWrap = e.target.classList.contains("pool-modal");
      if(closeBtn || modalWrap){
        closeCardModal();
      }
      return;
    }

    // 忽略特定功能按钮
    if(e.target.closest(".swap, .to-top, .search-open, #searchOverlay, #tierModal")) return;

    var target = e.target;

    // 寻找任何可能代表卡牌的目标元素
    var chip = target.closest(".card-chip, .card-name-btn");
    var slot = target.closest("[data-card-id], [data-card], .comp-slot, .cr-slot, .tb-card, .fc, .tc, .mc-card, .cmp-slot, .hc-card-item, .demo-card, .fchip, .hero-board a, .core-item .ci-head b, .ps-slot .ps-name, #missList .miss");

    var el = chip || slot;
    if(!el) return;

    // 提取卡牌 ID 或名称
    var id = el.getAttribute("data-card-id");
    var name = el.getAttribute("data-card");

    if(!id && !name){
      var innerIdEl = el.querySelector ? el.querySelector("[data-card-id]") : null;
      if(innerIdEl) id = innerIdEl.getAttribute("data-card-id");
      var innerNameEl = el.querySelector ? el.querySelector(".cs-name, .tb-name, .fc-name, .tc-name, .hc-ci-name, .dc-name, .ps-name, em, b") : null;
      if(innerNameEl) name = innerNameEl.textContent.trim();
    }

    if(!id && !name && el.textContent){
      var txt = el.textContent.trim().replace(/^#[0-9]+\s*/, '').replace(/^[0-9]+\.\s*/, '');
      if(txt.length <= 25) name = txt;
    }

    var query = id || name;
    if(!query) return;

    var hit = findCard(query);
    if(hit){
      e.preventDefault();
      e.stopPropagation();
      openCardModal(query);
    }
  }, true);

  // 4. 文本节点中的卡牌名称自动扫描与增强
  var REGEX_BRACKET_CARD = /【([^】\n\r]+)】/g;

  function enhanceBracketText(text){
    if(!text || text.indexOf("【") < 0) return text;
    return text.replace(REGEX_BRACKET_CARD, function(match, inner){
      // 检查是否有斜杠分隔的多张卡牌，如【地卜师/测绘员】
      if(inner.indexOf("/") >= 0 || inner.indexOf("、") >= 0){
        var parts = inner.split(/[\/、]/);
        var res = [];
        var allMatch = true;
        for(var i = 0; i < parts.length; i++){
          var p = parts[i].trim();
          if(findCard(p)){
            res.push('<span class="card-chip" data-card="' + p + '" role="button" tabindex="0" title="点击查看卡牌具体信息">' + p + '</span>');
          } else {
            allMatch = false;
            break;
          }
        }
        if(allMatch && res.length){
          return '【' + res.join('/') + '】';
        }
      }

      var card = findCard(inner);
      if(card){
        return '<span class="card-chip" data-card="' + inner + '" role="button" tabindex="0" title="点击查看卡牌具体信息">【' + inner + '】</span>';
      }
      return match;
    });
  }

  // 扫描页面上的教学、描述与说明文本
  function enhanceCardMentions(root){
    root = root || document.body;
    if(!root) return;

    var selectors = [
      ".ct-flow-item p", ".ct-trans-row", ".ct-block-head", ".ct-mis-list li", ".ct-math-desc",
      ".sc-desc", ".sc-stage-desc", ".pos-hint", ".cc-pos", "#summaryTable td:nth-child(3)",
      "#glossaryList dd", "#glossaryList dt", ".hc-strat", ".hc-trap", ".tn-desc", ".tn-action",
      ".tech-tag", ".rule p", ".dg-note", ".mc-line", ".mc-good", ".mc-bad", "#adviceMain", "#adviceSub"
    ];

    selectors.forEach(function(sel){
      var els = root.querySelectorAll(sel);
      for(var i = 0; i < els.length; i++){
        var el = els[i];
        if(el.getAttribute("data-card-enhanced")) continue;
        el.setAttribute("data-card-enhanced", "1");
        if(el.innerHTML && el.innerHTML.indexOf("【") >= 0){
          el.innerHTML = enhanceBracketText(el.innerHTML);
        }
      }
    });

    // 核心组件列表中的名称：.core-item .ci-head b
    var coreHeadB = root.querySelectorAll(".core-item .ci-head b");
    for(var j = 0; j < coreHeadB.length; j++){
      var b = coreHeadB[j];
      if(!b.classList.contains("card-name-btn")){
        b.classList.add("card-name-btn");
        b.setAttribute("data-card", b.textContent.trim());
        b.setAttribute("role", "button");
        b.setAttribute("tabindex", "0");
        b.title = "点击查看卡牌效果";
      }
    }
  }

  // DOM 准备好后运行
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", function(){
      ensureModalDOM();
      enhanceCardMentions();
    });
  } else {
    ensureModalDOM();
    enhanceCardMentions();
  }

  // 监听 DOM 变动 (如切换 tab、周报列表异步渲染)
  if("MutationObserver" in window){
    var observer = new MutationObserver(function(mutations){
      var shouldEnhance = false;
      for(var i = 0; i < mutations.length; i++){
        if(mutations[i].addedNodes.length > 0){
          shouldEnhance = true;
          break;
        }
      }
      if(shouldEnhance){
        enhanceCardMentions();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // 暴露全局 API
  window.findCard = findCard;
  window.openCardModal = openCardModal;
  window.closeCardModal = closeCardModal;
  window.enhanceCardMentions = enhanceCardMentions;
  window.formatCardKeywords = formatCardKeywords;

})();
