/* ================================================================
   EDIT-CHARACTER • client-side logic
   ================================================================ */
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
    const submitBtn       = $("#editCharSubmit");
  
    const avatarInput = $("#charAvatar");
    const previewImg  = $("#charImgPreview");
    const regionSel   = $("#charRegion");
    const houseSel    = $("#charHouse");
  
    /* ----- POOL CALCS --------------------------------------------- */
    const attrInputs  = () => $$(".attribute-input");
    const skillInputs = () => $$(".skill-input");
  
    const spentAttr  = () => attrInputs().reduce((s, i) => s + +i.value, 0);
    const spentSkill = () => skillInputs().reduce((s, i) => s + +i.value, 0);
  
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
      const cost   = target - cur;                 // negative = refund
      if (cost > 0 && poolLeftFn() < cost) return; // not enough points
      input.value = target;
      renderCard(card, max);
      refreshPools();
    };
  
    /* -------------------------------------------------------------- */
    /*  EVENT HANDLERS                                                */
    /* -------------------------------------------------------------- */
    /* plus / minus buttons */
    document.addEventListener("click", e => {
      const btn = e.target.closest(
        ".attr-plus, .attr-minus, .skill-plus, .skill-minus"
      );
      if (!btn) return;
  
      const isAttr = btn.classList.contains("attr-plus") ||
                     btn.classList.contains("attr-minus");
      const card  = btn.closest(isAttr ? ".attribute-item" : ".skill-item");
      const delta = btn.classList.contains("attr-plus") ||
                    btn.classList.contains("skill-plus") ? 1 : -1;
  
      if (isAttr) {
        adjust(card, delta, ATTR_MIN, ATTR_MAX,
               () => ATTR_POOL  - spentAttr());
      } else {
        adjust(card, delta, SKL_MIN,  SKL_MAX,
               () => SKILL_POOL - spentSkill());
      }
    });
  
    /* avatar preview */
    avatarInput?.addEventListener("change", ({ target }) => {
      const file = target.files?.[0];
      if (file) previewImg.src = URL.createObjectURL(file);
    });
  
    /* ----- REGION ➜ HOUSE CASCADE --------------------------------- */
    function populateHouses (regionId, preselectId = null) {
      houseSel.innerHTML = "";
      const list = window.housesByRegion?.[regionId] || [];
      list.forEach(h => {
        const opt = new Option(h.name, h.id, false, h.id == preselectId);
        houseSel.add(opt);
      });
      houseSel.disabled = list.length === 0;
    }
  
    /* rebuild list when region changes */
    regionSel?.addEventListener("change", e =>
      populateHouses(+e.target.value));
  
    /* if form loaded with an existing region, populate immediately */
    document.addEventListener("DOMContentLoaded", () => {
      if (regionSel && regionSel.value) {
        populateHouses(+regionSel.value,
                       parseInt(houseSel.dataset.cur || "", 10));
      }
    });
  
    /* ----- CHARACTER COUNTERS ------------------------------------- */
    $$(".char-counter").forEach(cnt => {
      const field = $(`[name="${cnt.dataset.for}"]`);
      if (!field) return;
      const max   = +field.maxLength || 0;
      const draw  = () => { cnt.textContent = ` ${field.value.length}/${max}`; };
      field.addEventListener("input", draw);
      draw();
    });
  
    /* ----- FIRST RENDER ------------------------------------------- */
    $$(".attribute-item").forEach(card => renderCard(card, ATTR_MAX));
    $$(".skill-item"    ).forEach(card => renderCard(card, SKL_MAX));
    refreshPools();
  })();
  