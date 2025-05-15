/* ====================================================================
   CREATE-CHARACTER • client-side logic
   ==================================================================== */
   (() => {
    /* ----- CONFIG ------------------------------------------------- */
    const ATTR_POOL = 20, SKILL_POOL = 24;
    const ATTR_MIN  = 1,  ATTR_MAX  = 5;
    const SKL_MIN   = 0,  SKL_MAX   = 5;
  
    /* ----- DOM SHORTCUTS ------------------------------------------ */
    const $  = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
    const stars = (v, m) => "✦".repeat(v) + "✧".repeat(m - v);
  
    /* ----- PAGE ELEMENTS ------------------------------------------ */
    const spanInlineAttr  = $("#attrPointsRemaining");
    const spanInlineSkill = $("#skillPointsRemaining");
    const spanSideAttr    = $("#attrPointsRemainSide");
    const spanSideSkill   = $("#skillPointsRemainSide");
    const submitBtn       = $("#createCharSubmit");
  
    const avatarInput = $("#charAvatar");
    const previewImg  = $("#charImgPreview");
    const regionSelect = $("#Region");
    const houseSelect  = $("#House");
  
    /* ----- POOL CALCS --------------------------------------------- */
    const attrInputs  = () => $$(".attribute-input");
    const skillInputs = () => $$(".skill-input");
  
    const spentAttr  = () => attrInputs().reduce((sum, i) => sum + +i.value, 0);
    const spentSkill = () => skillInputs().reduce((sum, i) => sum + +i.value, 0);
  
    const refreshPools = () => {
      const a = ATTR_POOL  - spentAttr();
      const s = SKILL_POOL - spentSkill();
      spanInlineAttr.textContent  = a;
      spanInlineSkill.textContent = s;
      spanSideAttr.textContent    = a;
      spanSideSkill.textContent   = s;
      submitBtn.disabled = !(a === 0 && s === 0);
    };
  
    /* ----- STAR / VALUE RENDER ------------------------------------ */
    const renderCard = (card, max) => {
      const input = $("input", card);
      $(".attr-value, .skill-value", card).textContent  = input.value;
      $(".attribute-stars, .skill-stars", card).textContent =
        stars(+input.value, max);
    };
  
    /* ----- INCREMENT / DECREMENT ---------------------------------- */
    const adjust = (card, delta, min, max, poolLeftFn) => {
      const input  = $("input", card);
      const cur    = +input.value;
      const target = Math.max(min, Math.min(max, cur + delta));
      const cost   = target - cur;  // negative = refund
      if (cost > 0 && poolLeftFn() < cost) return;
      input.value = target;
      renderCard(card, max);
      refreshPools();
    };
  
    /* --------------------------------------------------------------
       EVENT HANDLERS
       -------------------------------------------------------------- */
    // plus / minus
    document.addEventListener("click", e => {
      const btn = e.target.closest(
        ".attr-plus, .attr-minus, .skill-plus, .skill-minus"
      );
      if (!btn) return;
  
      const isAttr = btn.classList.contains("attr-plus") ||
                     btn.classList.contains("attr-minus");
      const card   = btn.closest(isAttr ? ".attribute-item" : ".skill-item");
      const delta  = btn.classList.contains("attr-plus") ||
                     btn.classList.contains("skill-plus") ? 1 : -1;
  
      if (isAttr) {
        adjust(card, delta, ATTR_MIN, ATTR_MAX,
               () => ATTR_POOL  - spentAttr());
      } else {
        adjust(card, delta, SKL_MIN,  SKL_MAX,
               () => SKILL_POOL - spentSkill());
      }
    });
  
    // avatar preview
    avatarInput?.addEventListener("change", ({ target }) => {
      const file = target.files?.[0];
      if (file) previewImg.src = URL.createObjectURL(file);
    });
  
    /* ----- REGION ➜ HOUSE CASCADE --------------------------------- */
    function populateHouses(regionId) {
      houseSelect.innerHTML = "";
      const list = window.housesByRegion?.[regionId] || [];
      list.forEach(h => {
        const opt = new Option(h.name, h.id);
        houseSelect.add(opt);
      });
      houseSelect.disabled = list.length === 0;
    }
  
    regionSelect?.addEventListener("change", e =>
      populateHouses(e.target.value));
  
    /* ----- CHARACTER COUNTERS ------------------------------------- */
    function initCounters() {
      $$(".char-counter").forEach(cnt => {
        const field = document.querySelector(`[name="${cnt.dataset.for}"]`);
        if (!field) return;
        const maxLen = +field.maxLength || 0;
        const draw   = () => { cnt.textContent = ` ${field.value.length}/${maxLen}`; };
        field.addEventListener("input", draw);
        draw();
      });
    }
  
    /* ----- INITIAL RENDER ON LOAD --------------------------------- */
    document.addEventListener("DOMContentLoaded", () => {
      // Houses
      if (regionSelect && regionSelect.value) {
        populateHouses(regionSelect.value);
      }
  
      // Stars & Pools
      $$(".attribute-item").forEach(card => renderCard(card, ATTR_MAX));
      $$(".skill-item"    ).forEach(card => renderCard(card, SKL_MAX));
      refreshPools();
  
      // Counters
      initCounters();
    });
  })();
  