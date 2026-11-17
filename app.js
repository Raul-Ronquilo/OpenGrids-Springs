/* OpenGrid Springs — app logic (vanilla JS, no build step) */
(function () {
  "use strict";

  const PAGES = ["home", "why", "dashboard", "ordinance", "events", "action", "ads"];
  const TITLES = {
    home: "OpenGrid Springs — Know the numbers before you decide.",
    why: "Why It Matters · OpenGrid Springs",
    dashboard: "Dashboard · OpenGrid Springs",
    ordinance: "The Ordinance · OpenGrid Springs",
    events: "Events · OpenGrid Springs",
    action: "Take Action · OpenGrid Springs",
    ads: "Ad mockups · OpenGrid Springs"
  };
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const fmt = (n, d = 0) => Number(n).toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });
  const money = n => "$" + fmt(n);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const icon = id => `<svg class="ic" aria-hidden="true"><use href="#${id}"/></svg>`;
  const THANKS = "Thanks! (demo only, nothing was sent)";

  /* ---------------- Router ---------------- */
  let firstRoute = true;
  function route() {
    let id = (location.hash || "#home").slice(1);
    if (id === "main") return; // skip link target
    if (!PAGES.includes(id)) id = "home";

    $$(".page").forEach(p => {
      const on = p.dataset.page === id;
      if (on) {
        p.hidden = false;
        // restart fade animation
        p.style.animation = "none"; void p.offsetWidth; p.style.animation = "";
      } else {
        p.hidden = true;
      }
    });
    $$("[data-nav]").forEach(a => {
      if (a.dataset.nav === id) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    document.title = TITLES[id];
    closeNav();
    window.scrollTo(0, 0);
    if (!firstRoute) $("#main").focus({ preventScroll: true });
    firstRoute = false;
  }
  window.addEventListener("hashchange", route);

  // Skip link: focus main without changing the route
  $(".skip-link").addEventListener("click", e => { e.preventDefault(); $("#main").focus(); });

  /* ---------------- Mobile nav ---------------- */
  const toggle = $(".nav-toggle");
  const nav = $("#site-nav");
  function closeNav() { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }
  toggle.addEventListener("click", () => {
    const open = !nav.classList.contains("open");
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    if (open) $("a", nav).focus();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && nav.classList.contains("open")) { closeNav(); toggle.focus(); }
  });
  document.addEventListener("click", e => {
    if (nav.classList.contains("open") && !nav.contains(e.target) && !toggle.contains(e.target)) closeNav();
  });
  window.matchMedia("(min-width: 768px)").addEventListener("change", closeNav);

  /* ---------------- Dashboard ---------------- */
  const dash = $("#dash");
  const cardsEl = $("#cards");
  const state = { mode: "example", filter: "All", sort: "default" };

  const REAL_TIER = { novva: "Large", t5: "Large", taurus: "Large" }; // only where public info gives a size

  const nr = (i) => `<span class="pill-nr" style="--i:${i}">Not reported</span>`;
  const srcLinks = keys => keys.map(k => `<a class="src" href="${SOURCES[k].url}" target="_blank" rel="noopener">${esc(SOURCES[k].label)}</a>`).join("");

  function tierChip(tier) {
    if (!tier) return `<span class="chip">Size: not reported</span>`;
    return tier === "Large" ? `<span class="chip chip-large">Large · 10+ MW</span>` : `<span class="chip">Small · 1–10 MW</span>`;
  }

  function exampleCard(f, i) {
    const e = f.example;
    const proj = f.status === "Proposed";
    const auditIcon = e.auditType === "ok" ? icon("i-check") : "";
    return `
    <article class="fcard" style="--i:${i}">
      <div class="fcard-head">
        <h3>${esc(f.name)}</h3>
        <p class="fcard-op">${esc(f.operator)}${f.address ? " · " + esc(f.address) : ""}</p>
        <div class="chips">
          <span class="chip ${proj ? "chip-prop" : "chip-op"}">${f.status}</span>
          ${tierChip(f.tier)}
          <span class="chip">${fmt(e.avgMW, 1).replace(/\.0$/, "")} MW avg</span>
        </div>
      </div>
      <dl class="metrics">
        <div class="metric power"><dt>${icon("i-bolt")}Power this qtr</dt><dd>${fmt(e.mwh)}<small>MWh${proj ? " (proj.)" : ""}</small></dd></div>
        <div class="metric power"><dt>${icon("i-home")}Homes equiv.</dt><dd>≈ ${fmt(e.homes)}<small>approx.</small></dd></div>
        <div class="metric water"><dt>${icon("i-drop")}Water this qtr</dt><dd>${fmt(e.gallons)}<small>gal${proj ? " (proj.)" : ""}</small></dd></div>
        <div class="metric"><dt>${icon("i-fan")}Cooling</dt><dd class="txt">${esc(e.cooling)}</dd></div>
        <div class="metric power"><dt>${icon("i-gauge")}PUE</dt><dd>${fmt(e.pue, 2)}</dd></div>
        <div class="metric water"><dt>${icon("i-drop")}WUE</dt><dd>${fmt(e.wue, 2)}<small>L/kWh</small></dd></div>
      </dl>
      <div class="audit audit-${e.auditType}">${auditIcon}<span>${esc(e.audit)}</span></div>
      <div class="fcard-foot"><span class="src-lead">Example data · made up for illustration</span></div>
    </article>`;
  }

  function realCard(f, i) {
    const r = f.real;
    const proj = f.status === "Proposed";
    const tier = REAL_TIER[f.id];
    let k = 0; const n = () => nr(i + (k++) * 0.6);
    const pue = r.pue ? `<span class="claim">${esc(r.pue)}<em>self-reported, unaudited</em></span>` : n();
    const cooling = r.cooling ? `<span class="claim">${esc(r.cooling)}<em>unverified</em></span>` : n();
    const waterCell = r.conflict
      ? `<span class="claim">See conflicting reports below</span>`
      : n();
    const notes = r.notes.length ? `<ul class="notes">${r.notes.map(t => `<li>${esc(t)}</li>`).join("")}</ul>` : "";
    const conflict = r.conflict ? `
      <div class="conflict" role="group" aria-label="Conflicting water reports">
        <h4>${icon("i-drop")}Conflicting reports: water</h4>
        <div class="conflict-row">
          <div class="conflict-opt"><strong>200,000 gal</strong>one-time fill, per Raeden/Gazette <a class="src" href="${SOURCES.gazette.url}" target="_blank" rel="noopener">Gazette</a></div>
          <div class="conflict-opt"><strong>Up to 200,000 gal</strong>daily, per KOAA <a class="src" href="${SOURCES.koaa.url}" target="_blank" rel="noopener">KOAA</a></div>
        </div>
        <p class="conflict-note">One-time vs. daily is a 365× difference per year. Audited reporting would settle it.</p>
        <p class="conflict-note" style="font-weight:500">Council decision postponed to April 2027. <a class="src" href="${SOURCES.axios.url}" target="_blank" rel="noopener">Axios</a></p>
      </div>` : "";
    return `
    <article class="fcard" style="--i:${i}">
      <div class="fcard-head">
        <h3>${esc(f.name)}</h3>
        <p class="fcard-op">${esc(f.operator)}${f.address ? " · " + esc(f.address) : ""}</p>
        <div class="chips">
          <span class="chip ${proj ? "chip-prop" : "chip-op"}">${f.status}</span>
          ${tierChip(tier)}
          ${r.tierNote ? `<span class="chip">${esc(r.tierNote)}</span>` : ""}
        </div>
      </div>
      <dl class="metrics">
        <div class="metric power"><dt>${icon("i-bolt")}Power this qtr</dt><dd>${proj ? `<span class="claim">Not yet operating</span>` : n()}</dd></div>
        <div class="metric power"><dt>${icon("i-home")}Homes equiv.</dt><dd>${proj ? `<span class="claim">—</span>` : n()}</dd></div>
        <div class="metric water"><dt>${icon("i-drop")}Water this qtr</dt><dd>${waterCell}</dd></div>
        <div class="metric"><dt>${icon("i-fan")}Cooling</dt><dd>${cooling}</dd></div>
        <div class="metric power"><dt>${icon("i-gauge")}PUE</dt><dd>${pue}</dd></div>
        <div class="metric water"><dt>${icon("i-drop")}WUE</dt><dd>${n()}</dd></div>
      </dl>
      <div class="audit audit-none"><span>${proj ? "Not operating · no audit possible yet" : "Not independently audited"}</span></div>
      ${conflict}
      ${notes}
      <div class="fcard-foot"><span class="src-lead">Sources:</span>${srcLinks(r.sources)}</div>
    </article>`;
  }

  function renderTotals() {
    const op = FACILITIES.filter(f => f.status === "Operating");
    const mwh = op.reduce((s, f) => s + f.example.mwh, 0);
    const gal = op.reduce((s, f) => s + f.example.gallons, 0);
    const homes = op.reduce((s, f) => s + f.example.homes, 0);
    const ok = op.filter(f => f.example.auditType === "ok").length;
    $("#exampleTotals").innerHTML = `
      <div class="tot tot-power"><div class="tot-label">${icon("i-bolt")}Power this qtr</div><div class="tot-val">${fmt(mwh)} MWh</div></div>
      <div class="tot tot-water"><div class="tot-label">${icon("i-drop")}Water this qtr</div><div class="tot-val">${fmt(gal / 1e6, 1)}M gal</div></div>
      <div class="tot tot-power"><div class="tot-label">${icon("i-home")}Homes equiv.</div><div class="tot-val">≈ ${fmt(homes)}</div></div>
      <div class="tot"><div class="tot-label">${icon("i-check")}Audits</div><div class="tot-val">${ok} of ${op.length} clean</div></div>`;
  }

  function visibleFacilities() {
    let list = FACILITIES.slice();
    if (state.filter !== "All") {
      list = list.filter(f => (state.mode === "example" ? f.tier : REAL_TIER[f.id]) === state.filter);
    }
    if (state.mode === "example" && state.sort !== "default") {
      const key = state.sort === "power" ? "mwh" : "gallons";
      list.sort((a, b) => b.example[key] - a.example[key]);
    }
    return list;
  }

  function renderCards() {
    const list = visibleFacilities();
    if (!list.length) {
      cardsEl.innerHTML = `<div class="panel" style="grid-column:1/-1"><p style="margin:0"><strong>No facility publicly reports its size in this tier.</strong> Under the ordinance, every facility would.</p></div>`;
    } else {
      cardsEl.innerHTML = list.map((f, i) => state.mode === "example" ? exampleCard(f, i) : realCard(f, i)).join("");
    }
    $("#sortNote").hidden = !(state.mode === "real" && state.sort !== "default");
  }

  function animateZero() {
    const el = $("#zeroCount");
    if (reducedMotion.matches) { el.textContent = "0"; return; }
    let n = 8; el.textContent = n;
    const t = setInterval(() => { n--; el.textContent = n; if (n <= 0) clearInterval(t); }, 70);
  }

  let switching = false;
  function setMode(mode, focusBtn) {
    if (mode === state.mode || switching) return;
    state.mode = mode;
    $$(".mode-btn").forEach(b => {
      const on = b.dataset.mode === mode;
      b.setAttribute("aria-checked", String(on));
      b.tabIndex = on ? 0 : -1;
      if (on && focusBtn) b.focus();
    });
    dash.dataset.mode = mode;
    const finish = () => {
      renderCards();
      cardsEl.style.transition = ""; cardsEl.style.opacity = "";
      if (mode === "real") animateZero();
      switching = false;
    };
    if (reducedMotion.matches) return finish();
    switching = true;
    cardsEl.style.transition = "opacity .18s ease";
    cardsEl.style.opacity = "0";
    setTimeout(finish, 190);
  }

  $$(".mode-btn").forEach(b => {
    b.tabIndex = b.dataset.mode === state.mode ? 0 : -1;
    b.addEventListener("click", () => setMode(b.dataset.mode));
    b.addEventListener("keydown", e => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        setMode(state.mode === "example" ? "real" : "example", true);
      }
    });
  });
  $$(".seg-btn").forEach(b => b.addEventListener("click", () => {
    state.filter = b.dataset.filter;
    $$(".seg-btn").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    renderCards();
  }));
  $("#sortSel").addEventListener("change", e => { state.sort = e.target.value; renderCards(); });

  /* ---------------- Tables: labels for stacked phone layout ---------------- */
  $$("table").forEach(t => {
    const heads = $$("thead th", t).map(th => th.textContent.trim());
    $$("tbody tr", t).forEach(tr => {
      $$("td", tr).forEach((td, i) => td.setAttribute("data-label", heads[i + 1] || ""));
    });
  });

  /* ---------------- Fine calculator ---------------- */
  const calcForm = $("#calcForm");
  function calc() {
    const tier = calcForm.tier.value;
    const v = calcForm.violation.value;
    const repeat = calcForm.repeat.checked;
    const rule = FINES[v][tier];
    $("#daysField").hidden = v !== "late";
    let amount, detail = "", capped = false, prefix = "";
    if (v === "late") {
      const days = Math.max(0, Math.min(365, parseInt(calcForm.days.value, 10) || 0));
      const raw = rule.perDay * days;
      amount = Math.min(raw, rule.cap);
      capped = raw > rule.cap;
      detail = `${days} day${days === 1 ? "" : "s"} × ${money(rule.perDay)}/day = ${money(raw)}${capped ? `, capped at ${money(rule.cap)}/yr` : ` (cap ${money(rule.cap)}/yr)`}`;
    } else if (v === "off") {
      amount = rule.flat; detail = "Flat fine, plus a re-audit at the operator's cost.";
    } else {
      amount = rule.upTo; prefix = "Up to "; detail = "Maximum fine for a knowingly false report.";
    }
    if (repeat) { amount *= 2; detail += " · Doubled for a repeat violation within 3 years."; }
    $("#calcOut").innerHTML = `<span class="co-label">${tier} facility · ${esc(FINES[v].label)}</span>
      <span class="co-val">${prefix}${money(amount)}</span>
      <span class="co-detail">${detail}</span>${capped ? `<span class="co-cap">Cap applied</span>` : ""}`;
  }
  calcForm.addEventListener("input", calc);
  calcForm.addEventListener("change", calc);
  calcForm.addEventListener("submit", e => e.preventDefault());

  /* ---------------- Events ---------------- */
  const MONTHS = { Jan: "Jan", Feb: "Feb", Mar: "Mar", Apr: "Apr", Dec: "Dec" };
  function dateParts(str) {
    const m = str.match(/(\w{3}),\s(\w{3})\s(\d+),\s(\d{4})/);
    if (m) return { m: MONTHS[m[2]] || m[2], d: m[3], y: m[4] };
    const m2 = str.match(/(\w+)\s(\d{4})/);
    return { m: m2 ? m2[1].slice(0, 3) : "", d: "TBA", y: m2 ? m2[2] : "" };
  }
  $("#eventList").innerHTML = EVENTS.map(ev => {
    const p = dateParts(ev.date);
    return `
    <article class="event">
      <div class="event-date" aria-hidden="true"><span class="m">${p.m}</span><span class="d">${p.d}</span><span class="y">${p.y}</span></div>
      <div class="event-body">
        <h3>${esc(ev.title)}</h3>
        <p class="event-meta"><span>${esc(ev.date)} · ${esc(ev.time)}</span><span>${esc(ev.place)}</span></p>
        <p>${esc(ev.blurb)}</p>
        <button class="btn btn-ghost btn-sm rsvp-toggle" type="button" aria-expanded="false" aria-controls="rsvp-${ev.id}">RSVP</button>
        <form class="rsvp demo-form" id="rsvp-${ev.id}" hidden>
          <label class="field"><span>Name</span><input type="text" name="name" autocomplete="name" required></label>
          <label class="field"><span>Email</span><input type="email" name="email" autocomplete="email" required></label>
          <label class="field"><span>How many people?</span>
            <select name="guests"><option>1</option><option>2</option><option>3</option><option>4+</option></select></label>
          <button class="btn btn-primary btn-sm" type="submit">Confirm RSVP</button>
          <p class="form-msg" role="status" aria-live="polite"></p>
        </form>
      </div>
    </article>`;
  }).join("");
  $$(".rsvp-toggle").forEach(btn => btn.addEventListener("click", () => {
    const form = document.getElementById(btn.getAttribute("aria-controls"));
    const open = form.hidden;
    form.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
    btn.textContent = open ? "Close RSVP" : "RSVP";
    if (open) $("input", form).focus();
  }));

  /* ---------------- Demo forms ---------------- */
  function wireDemoForm(form) {
    form.addEventListener("submit", e => {
      e.preventDefault();
      const msg = $(".form-msg", form);
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      msg.className = "form-msg ok";
      msg.textContent = THANKS;
      $$("input:not([type=checkbox]), select", form).forEach(i => { if (i.tagName === "SELECT") i.selectedIndex = 0; else i.value = ""; });
    });
  }
  $$(".demo-form").forEach(wireDemoForm);

  /* ---------------- Clipboard ---------------- */
  function fallbackCopy(text, selectEl) {
    let el = selectEl, temp = false;
    if (!el) {
      el = document.createElement("textarea");
      el.value = text; el.setAttribute("readonly", "");
      el.style.position = "fixed"; el.style.top = "-1000px";
      document.body.appendChild(el); temp = true;
    }
    el.focus(); el.select();
    try { el.setSelectionRange(0, text.length); } catch (_) {}
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (_) {}
    if (temp) document.body.removeChild(el);
    return ok;
  }
  function copyText(text, statusEl, okMsg, selectEl) {
    const show = (ok) => {
      statusEl.className = "form-msg " + (ok ? "ok" : "err");
      statusEl.textContent = ok ? okMsg : "Couldn't copy automatically. The text is selected, so press Ctrl+C (or ⌘+C) to copy.";
      if (!ok && selectEl) { selectEl.focus(); selectEl.select(); }
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => show(true), () => show(fallbackCopy(text, selectEl)));
    } else {
      show(fallbackCopy(text, selectEl));
    }
  }
  $("#copyMsg").addEventListener("click", () => {
    const ta = $("#councilMsg");
    copyText(ta.value, $("#copyStatus"), "Copied! Paste it into your message to City Council.", ta);
  });
  $$(".share-btn").forEach(b => b.addEventListener("click", () => {
    const base = location.href.split("#")[0];
    const url = base + (b.dataset.share || "");
    copyText(url, $("#shareStatus"), "Link copied: " + url);
  }));

  /* ---------------- Ad click-through ---------------- */
  const overlay = $("#adTransition");
  $$(".ad-click").forEach(a => a.addEventListener("click", e => {
    e.preventDefault();
    const target = a.getAttribute("href");
    a.classList.add("pressed");
    if (reducedMotion.matches) { location.hash = target; a.classList.remove("pressed"); return; }
    setTimeout(() => overlay.classList.add("on"), 120);
    setTimeout(() => {
      location.hash = target;
      a.classList.remove("pressed");
      setTimeout(() => overlay.classList.remove("on"), 80);
    }, 820);
  }));

  /* ---------------- Init ---------------- */
  renderTotals();
  renderCards();
  calc();
  route();
})();
