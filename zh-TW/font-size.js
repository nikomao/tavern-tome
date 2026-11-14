/**
 * Tavern Tome - 網站字號動態調節模塊 (font-size.js)
 * 支持標准 (100%)、中大 (112%)、大號 (125%)、超大 (140%) 四檔調節
 * 状態持久化于 localStorage，全站页面（首页、對局助手、卡牌池、分享页）即時同步
 */
(function () {
  const SIZES = ["default", "medium", "large", "huge"];
  const META = {
    default: { label: "標准", percent: "100%", zoom: 1.0 },
    medium:  { label: "中大", percent: "112%", zoom: 1.12 },
    large:   { label: "大號", percent: "125%", zoom: 1.25 },
    huge:    { label: "超大", percent: "140%", zoom: 1.40 }
  };

  const STORAGE_KEY = "tt_font_size";

  function getSavedSize() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SIZES.includes(saved)) return saved;
    } catch (e) {}
    return "default";
  }

  function applySize(size, showNotice = false) {
    if (!SIZES.includes(size)) size = "default";
    const meta = META[size];

    if (size === "default") {
      document.documentElement.removeAttribute("data-font-size");
    } else {
      document.documentElement.setAttribute("data-font-size", size);
    }

    try {
      localStorage.setItem(STORAGE_KEY, size);
    } catch (e) {}

    // 更新页面所有字號控件的 UI 状態
    updateUI(size);

    // 觸發窗口 resize 讓 canvas / 視差背景與圖表自動适配
    try {
      window.dispatchEvent(new Event("resize"));
      window.dispatchEvent(new CustomEvent("tt-font-size-change", { detail: { size, ...meta } }));
    } catch (e) {}

    if (showNotice) {
      showToast(`字號已調整：${meta.label} (${meta.percent})`);
    }
  }

  function updateUI(size) {
    const meta = META[size] || META.default;

    // 更新頂部按钮文案
    const labels = document.querySelectorAll("#fsCurrentLabel, .fs-current-label");
    labels.forEach(el => {
      el.textContent = size === "default" ? "字號" : meta.percent;
    });

    const percentSpans = document.querySelectorAll("#fspCurrentPercent, .fsp-current-val");
    percentSpans.forEach(el => {
      el.textContent = `${meta.label} · ${meta.percent}`;
    });

    // 更新 pill 選中状態
    const pills = document.querySelectorAll(".fsp-pill, [data-font-size-opt]");
    pills.forEach(pill => {
      const pSize = pill.getAttribute("data-size") || pill.getAttribute("data-font-size-opt");
      if (pSize === size) {
        pill.classList.add("on");
        pill.setAttribute("aria-selected", "true");
      } else {
        pill.classList.remove("on");
        pill.removeAttribute("aria-selected");
      }
    });

    // 更新按钮 title
    const btns = document.querySelectorAll("#fontScaleBtn, .font-scale-btn");
    btns.forEach(btn => {
      btn.title = `調整網站字號大小（當前：${meta.label} ${meta.percent}）`;
    });
  }

  function stepSize(delta, showNotice = true) {
    const current = getSavedSize();
    let idx = SIZES.indexOf(current);
    if (idx === -1) idx = 0;
    idx = Math.max(0, Math.min(SIZES.length - 1, idx + delta));
    applySize(SIZES[idx], showNotice);
  }

  function cycleNextSize() {
    const current = getSavedSize();
    let idx = SIZES.indexOf(current);
    idx = (idx + 1) % SIZES.length;
    applySize(SIZES[idx], true);
  }

  let toastTimer = 0;
  function showToast(msg) {
    let t = document.getElementById("ttFontToast");
    if (!t) {
      t = document.createElement("div");
      t.id = "ttFontToast";
      t.className = "tt-font-toast";
      t.setAttribute("role", "status");
      t.setAttribute("aria-live", "polite");
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      t.classList.remove("show");
    }, 1800);
  }

  let docBound = false;
  function bindEvents() {
    // 监聽所有字號彈窗的打開與交互
    document.querySelectorAll(".font-scale-wrap").forEach(wrap => {
      if (wrap._ttBound) return;
      wrap._ttBound = true;
      const btn = wrap.querySelector(".font-scale-btn");
      const pop = wrap.querySelector(".font-scale-pop");
      if (!btn || !pop) return;

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const willOpen = pop.hidden;
        // 關閉其他可能打開的 pop
        document.querySelectorAll(".font-scale-pop").forEach(p => { if (p !== pop) p.hidden = true; });
        pop.hidden = !willOpen;
        btn.setAttribute("aria-expanded", String(willOpen));
      });

      pop.addEventListener("click", (e) => {
        e.stopPropagation();
        const pill = e.target.closest(".fsp-pill, [data-size]");
        if (pill) {
          const sz = pill.getAttribute("data-size");
          if (sz) applySize(sz, true);
        }
      });
    });

    // 減小 / 增大按钮
    document.querySelectorAll("#fspStepDec, .fsp-step-dec").forEach(btn => {
      if (btn._ttBound) return;
      btn._ttBound = true;
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        stepSize(-1, true);
      });
    });

    document.querySelectorAll("#fspStepInc, .fsp-step-inc").forEach(btn => {
      if (btn._ttBound) return;
      btn._ttBound = true;
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        stepSize(1, true);
      });
    });

    // 側边栏快捷切換按钮（首页 sideRail）
    const railFontBtn = document.getElementById("railFontBtn");
    if (railFontBtn && !railFontBtn._ttBound) {
      railFontBtn._ttBound = true;
      railFontBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        cycleNextSize();
      });
    }

    if (!docBound) {
      docBound = true;
      // 全局点擊空白處關閉彈窗
      document.addEventListener("click", (e) => {
        if (!e.target.closest(".font-scale-wrap")) {
          document.querySelectorAll(".font-scale-pop").forEach(pop => {
            pop.hidden = true;
          });
          document.querySelectorAll(".font-scale-btn").forEach(btn => {
            btn.setAttribute("aria-expanded", "false");
          });
        }
      });

      // ESC 鍵關閉彈窗
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          document.querySelectorAll(".font-scale-pop").forEach(pop => {
            pop.hidden = true;
          });
          document.querySelectorAll(".font-scale-btn").forEach(btn => {
            btn.setAttribute("aria-expanded", "false");
          });
        }
      });
    }
  }

  // 初始化執行
  const cur = getSavedSize();
  if (cur !== "default") {
    document.documentElement.setAttribute("data-font-size", cur);
  }

  // 立即绑定已存在的 DOM 節点，並在 DOMContentLoaded 時補充绑定
  bindEvents();
  updateUI(cur);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      bindEvents();
      updateUI(cur);
    });
  }

  // 暴露公共 API 供控制臺或其他模塊使用
  window.TTFontSize = {
    get: getSavedSize,
    set: applySize,
    step: stepSize,
    cycle: cycleNextSize,
    SIZES,
    META
  };
})();
