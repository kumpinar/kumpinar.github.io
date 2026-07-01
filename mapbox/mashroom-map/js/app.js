/* ============================================================================
   Mushroom Map — static client app (vanilla JS)
   Loads species.json + occurrences.geojson, renders list/filter/search/detail,
   and a Mapbox GL map with CLIENT-SIDE clustering (no server).
   ============================================================================ */
"use strict";

// Public Mapbox token (client-side / publishable).
mapboxgl.accessToken =
  "pk.eyJ1IjoiYWNlbWltdWhlbmRpcyIsImEiOiJjbXFzOWhjaTgwNXVqMnJzYnZnaDJsZ2VtIn0.7MtgaeIWe7WmZMr1C10OPQ";

const MAP_STYLE = "mapbox://styles/mapbox/light-v11";
const PAGE_SIZE = 24;

const EDIBILITY = {
  edible: { label: "Edible", color: "#2f8f4e", icon: "✅" },
  conditionally_edible: { label: "Conditionally edible", color: "#c98a1b", icon: "⚠️" },
  inedible: { label: "Inedible", color: "#7a7a7a", icon: "🚫" },
  poisonous: { label: "Poisonous", color: "#d12b2b", icon: "☠️" },
  deadly: { label: "Deadly", color: "#7a0a0a", icon: "💀" },
  medicinal: { label: "Medicinal", color: "#2b6fd1", icon: "💊" },
  psychoactive: { label: "Psychoactive", color: "#8a2be2", icon: "🌀" },
  unknown: { label: "Unknown (unverified)", color: "#94a3b8", icon: "❔" },
};
const EDIB_ORDER = [
  "edible", "conditionally_edible", "medicinal", "inedible",
  "poisonous", "deadly", "psychoactive", "unknown",
];
const DANGER = {
  none: { label: "Harmless", color: "#7a7a7a" },
  mild: { label: "Mildly dangerous", color: "#c98a1b" },
  severe: { label: "Severely dangerous", color: "#d12b2b" },
  deadly: { label: "Deadly", color: "#7a0a0a" },
};
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ---- State ----------------------------------------------------------------
let SPECIES = [];
let BY_SLUG = new Map();
let GEO = null; // full occurrences FeatureCollection
let OCC_BY_SLUG = new Map(); // slug -> features[]
const filters = { q: "", edibility: new Set(), family: "", sort: "name", page: 1 };
let homeMap = null;

// ---- Helpers --------------------------------------------------------------
const $ = (sel, el = document) => el.querySelector(sel);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const title = (sp) => sp.common_name || sp.scientific_name;

function badge(ed, size) {
  const m = EDIBILITY[ed] || EDIBILITY.unknown;
  return `<span class="badge-edib ${size === "md" ? "md" : ""}" style="background:${m.color}" title="${esc(m.label)}"><span>${m.icon}</span><span>${esc(m.label)}</span></span>`;
}

function seasonLabel(months) {
  if (!months || !months.length) return "";
  const s = [...months].sort((a, b) => a - b);
  // contiguous range?
  let contiguous = s.every((v, i) => i === 0 || v === s[i - 1] + 1);
  if (contiguous && s.length > 1) return `${MONTHS[s[0] - 1]}–${MONTHS[s[s.length - 1] - 1]}`;
  return s.map((m) => MONTHS[m - 1]).join(", ");
}

// ---- Data load ------------------------------------------------------------
async function loadData() {
  const [sp, geo] = await Promise.all([
    fetch("./data/species.json").then((r) => r.json()),
    fetch("./data/occurrences.geojson").then((r) => r.json()),
  ]);
  SPECIES = sp;
  BY_SLUG = new Map(sp.map((s) => [s.slug, s]));
  GEO = geo;
  for (const f of geo.features) {
    const k = f.properties.slug;
    if (!OCC_BY_SLUG.has(k)) OCC_BY_SLUG.set(k, []);
    OCC_BY_SLUG.get(k).push(f);
  }
}

// ---- Home rendering -------------------------------------------------------
function buildHome() {
  const view = $("#view");
  view.innerHTML = `
    <div id="home">
      <div class="filterbar"><div class="filterbar-inner glass">
        <div class="pills" id="edib-pills"></div>
        <div class="controls">
          <select id="family-sel" aria-label="Filter by family"></select>
          <select id="sort-sel" aria-label="Sort">
            <option value="name">Name (A–Z)</option>
            <option value="edibility">Edibility</option>
            <option value="observed">Most observed</option>
          </select>
          <button class="clear-btn" id="clear-btn" hidden>Clear</button>
        </div>
      </div></div>

      <div class="result-row">
        <p class="result-count" id="result-count"></p>
        <div class="view-toggle glass-strong" id="view-toggle">
          <button data-v="list" class="active">List</button>
          <button data-v="map">🗺️ Map</button>
        </div>
      </div>

      <div class="split">
        <div class="list-col" id="list-col">
          <div class="grid" id="grid"></div>
          <div class="pager" id="pager"></div>
        </div>
        <div class="map-col" id="map-col">
          <div class="map-panel">
            <div class="map-wrap" id="home-map-wrap">
              <div id="home-map" style="width:100%;height:100%"></div>
              <button class="map-expand glass" id="home-expand">⛶ Fullscreen</button>
            </div>
          </div>
        </div>
      </div>
    </div>`;

  // Edibility pills
  const pills = $("#edib-pills");
  pills.innerHTML = EDIB_ORDER.map((e) => {
    const m = EDIBILITY[e];
    return `<button class="pill" data-e="${e}"><span>${m.icon}</span>${esc(m.label)}</button>`;
  }).join("");
  pills.addEventListener("click", (ev) => {
    const b = ev.target.closest(".pill"); if (!b) return;
    const e = b.dataset.e;
    if (filters.edibility.has(e)) filters.edibility.delete(e); else filters.edibility.add(e);
    filters.page = 1; syncFilterUI(); applyFilters();
  });

  // Family dropdown
  const fams = {};
  for (const s of SPECIES) if (s.family) fams[s.family] = (fams[s.family] || 0) + 1;
  const famSel = $("#family-sel");
  famSel.innerHTML = `<option value="">All families</option>` +
    Object.keys(fams).sort().map((f) => `<option value="${esc(f)}">${esc(f)} (${fams[f]})</option>`).join("");
  famSel.addEventListener("change", () => { filters.family = famSel.value; filters.page = 1; applyFilters(); });

  $("#sort-sel").addEventListener("change", (e) => { filters.sort = e.target.value; filters.page = 1; applyFilters(); });
  $("#clear-btn").addEventListener("click", () => {
    filters.q = ""; filters.edibility.clear(); filters.family = ""; filters.sort = "name"; filters.page = 1;
    $("#search-input").value = ""; famSel.value = ""; $("#sort-sel").value = "name";
    syncFilterUI(); applyFilters();
  });

  // Mobile list/map toggle (adds .show-map on .split; desktop shows both)
  $("#view-toggle").addEventListener("click", (ev) => {
    const b = ev.target.closest("button"); if (!b) return;
    [...$("#view-toggle").children].forEach((x) => x.classList.toggle("active", x === b));
    const showMap = b.dataset.v === "map";
    $(".split").classList.toggle("show-map", showMap);
    if (showMap && homeMap) setTimeout(() => homeMap.resize(), 50);
  });

  // Fullscreen expand
  $("#home-expand").addEventListener("click", () => toggleFullscreen("#home-map-wrap", "#home-expand"));

  syncFilterUI();
  applyFilters();
  initHomeMap();
}

function syncFilterUI() {
  document.querySelectorAll("#edib-pills .pill").forEach((b) => {
    const on = filters.edibility.has(b.dataset.e);
    b.classList.toggle("active", on);
    b.style.background = on ? (EDIBILITY[b.dataset.e].color) : "";
  });
  const any = filters.q || filters.edibility.size || filters.family;
  const cb = $("#clear-btn"); if (cb) cb.hidden = !any;
}

function filteredList() {
  let list = SPECIES;
  if (filters.q) {
    const q = filters.q.toLowerCase();
    list = list.filter((s) =>
      s.scientific_name.toLowerCase().includes(q) ||
      (s.common_name && s.common_name.toLowerCase().includes(q)) ||
      (s.also_known_as_tr && s.also_known_as_tr.some((n) => n.toLowerCase().includes(q))));
  }
  if (filters.edibility.size) list = list.filter((s) => filters.edibility.has(s.edibility));
  if (filters.family) list = list.filter((s) => s.family === filters.family);
  const sorted = [...list];
  if (filters.sort === "name") sorted.sort((a, b) => title(a).localeCompare(title(b)));
  else if (filters.sort === "edibility") sorted.sort((a, b) => EDIB_ORDER.indexOf(a.edibility) - EDIB_ORDER.indexOf(b.edibility) || title(a).localeCompare(title(b)));
  else if (filters.sort === "observed") sorted.sort((a, b) => b.occurrence_count - a.occurrence_count);
  return sorted;
}

function applyFilters() {
  const list = filteredList();
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (filters.page > pages) filters.page = pages;
  const start = (filters.page - 1) * PAGE_SIZE;
  const pageItems = list.slice(start, start + PAGE_SIZE);

  $("#result-count").innerHTML = total ? `<b>${total}</b> mushrooms${filters.q ? ` · results for “${esc(filters.q)}”` : ""}` : "No mushrooms to show.";
  const grid = $("#grid");
  if (!pageItems.length) {
    grid.innerHTML = `<div class="empty glass" style="grid-column:1/-1"><div class="em">🍄</div><p class="t">No matching mushrooms.</p><p class="s">Try changing the filters or clearing the search.</p></div>`;
  } else {
    grid.innerHTML = pageItems.map(cardHTML).join("");
  }
  renderPager(total, pages);
  syncFilterUI();
}

function cardHTML(s) {
  const t = title(s);
  const cover = s.cover ? `<img src="${esc(s.cover)}" alt="${esc(t)}" loading="lazy">` : `<div class="ph">🍄</div>`;
  const meta = [];
  if (s.family) meta.push(esc(s.family));
  const sl = seasonLabel(s.season_months); if (sl) meta.push(`📅 ${sl}`);
  if (s.image_count) meta.push(`📷 ${s.image_count}`);
  return `<a class="card glass" href="#s/${encodeURIComponent(s.slug)}">
    <div class="card-img">${cover}<div class="card-badge">${badge(s.edibility, "sm")}</div></div>
    <div class="card-body">
      <div class="card-title">${esc(t)}</div>
      <div class="card-sci">${esc(s.scientific_name)}</div>
      <div class="card-meta">${meta.map((m) => `<span>${m}</span>`).join('<span aria-hidden="true">·</span>')}</div>
    </div></a>`;
}

function renderPager(total, pages) {
  const pager = $("#pager");
  if (pages <= 1) { pager.innerHTML = ""; return; }
  const p = filters.page;
  const nums = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || (i >= p - 1 && i <= p + 1)) nums.push(i);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }
  pager.innerHTML =
    `<button ${p <= 1 ? "disabled" : ""} data-p="${p - 1}">← Prev</button>` +
    nums.map((n) => n === "…" ? `<span class="dots">…</span>` : `<button class="${n === p ? "active" : ""}" data-p="${n}">${n}</button>`).join("") +
    `<button ${p >= pages ? "disabled" : ""} data-p="${p + 1}">Next →</button>`;
  pager.querySelectorAll("button[data-p]").forEach((b) => b.addEventListener("click", () => {
    filters.page = Number(b.dataset.p); applyFilters(); window.scrollTo({ top: 0, behavior: "smooth" });
  }));
}

// ---- Mapbox cluster map ---------------------------------------------------
function addClusterLayers(map, data, sourceId) {
  if (!map.getSource(sourceId))
    map.addSource(sourceId, { type: "geojson", data, cluster: true, clusterMaxZoom: 12, clusterRadius: 48 });
  if (!map.getLayer(sourceId + "-clusters")) map.addLayer({
    id: sourceId + "-clusters", type: "circle", source: sourceId, filter: ["has", "point_count"],
    paint: {
      "circle-color": ["step", ["get", "point_count"], "#e09e54", 20, "#c07d2b", 100, "#8a4a12"],
      "circle-radius": ["step", ["get", "point_count"], 16, 20, 22, 100, 30],
      "circle-stroke-width": 3, "circle-stroke-color": "#ffffff", "circle-opacity": 0.92,
    },
  });
  if (!map.getLayer(sourceId + "-count")) map.addLayer({
    id: sourceId + "-count", type: "symbol", source: sourceId, filter: ["has", "point_count"],
    layout: { "text-field": ["get", "point_count_abbreviated"], "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"], "text-size": 13 },
    paint: { "text-color": "#ffffff" },
  });
  if (!map.getLayer(sourceId + "-point")) map.addLayer({
    id: sourceId + "-point", type: "circle", source: sourceId, filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": ["match", ["get", "edibility"],
        "edible", "#2f8f4e", "conditionally_edible", "#c98a1b", "inedible", "#7a7a7a",
        "poisonous", "#d12b2b", "deadly", "#7a0a0a", "medicinal", "#2b6fd1",
        "psychoactive", "#8a2be2", /* unknown/other */ "#94a3b8"],
      "circle-radius": 6, "circle-stroke-width": 2, "circle-stroke-color": "#ffffff",
    },
  });

  if (map["_h_" + sourceId]) return; // olay dinleyicileri tek sefer
  map["_h_" + sourceId] = true;

  map.on("click", sourceId + "-clusters", (e) => {
    const f = map.queryRenderedFeatures(e.point, { layers: [sourceId + "-clusters"] });
    const id = f[0].properties.cluster_id;
    map.getSource(sourceId).getClusterExpansionZoom(id, (err, zoom) => {
      if (err) return; map.easeTo({ center: f[0].geometry.coordinates, zoom });
    });
  });
  map.on("click", sourceId + "-point", (e) => {
    const p = e.features[0].properties;
    const c = e.features[0].geometry.coordinates.slice();
    new mapboxgl.Popup({ offset: 12, closeButton: false }).setLngLat(c).setHTML(popupHTML(p)).addTo(map);
  });
  for (const l of ["-clusters", "-point"]) {
    map.on("mouseenter", sourceId + l, () => (map.getCanvas().style.cursor = "pointer"));
    map.on("mouseleave", sourceId + l, () => (map.getCanvas().style.cursor = ""));
  }
}

function popupHTML(p) {
  const cover = p.cover ? `<img src="${esc(p.cover)}" alt="">` : `<div class="ph">🍄</div>`;
  return `<a class="popup-card" href="#s/${encodeURIComponent(p.slug)}">${cover}
    <div class="b"><div class="n">${esc(p.name)}</div><div class="sci">${esc(p.sci)}</div><div class="go">View →</div></div></a>`;
}

// Container gizli/0-boyutta oluşturulduğunda mapbox 'load' tetiklemez; boyutlanınca
// resize() ile tamamlamasını sağla (mobilde harita sekmesi + bazı tarayıcı zamanlamaları).
function observeMapSize(map, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  // Layout oturunca yeniden boyutlandır (bazı tarayıcı/başlangıç zamanlamaları için).
  [200, 800, 2000].forEach((ms) => setTimeout(() => map.resize(), ms));
  if (typeof ResizeObserver === "undefined") return;
  const ro = new ResizeObserver(() => map.resize());
  ro.observe(el);
  map.on("remove", () => ro.disconnect());
}

// Katmanları güvenilir biçimde ekle. 'load' olayı ve isStyleLoaded() bu ortamda
// güvenilmez olabildiğinden: eklemeyi dene, stil hazır değilse hata fırlatır → 200ms
// sonra tekrar dene. addClusterLayers idempotenttir (kısmi durumda güvenli).
function addClustersWhenReady(map, data, id) {
  const done = () => !!map.getLayer(id + "-clusters");
  const add = () => {
    if (done()) return true;
    try { addClusterLayers(map, data, id); } catch (e) { /* stil henüz hazır değil */ }
    return done();
  };
  if (add()) return;
  const iv = setInterval(() => { if (add()) clearInterval(iv); }, 200);
  setTimeout(() => clearInterval(iv), 25000);
}

function initHomeMap() {
  homeMap = new mapboxgl.Map({ container: "home-map", style: MAP_STYLE, center: [15, 40], zoom: 2.2, attributionControl: true });
  homeMap.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
  addClustersWhenReady(homeMap, GEO, "occ");
  observeMapSize(homeMap, "home-map");
}

// ---- Detail ---------------------------------------------------------------
function renderDetail(slug) {
  const s = BY_SLUG.get(slug);
  const view = $("#view");
  if (!s) { view.innerHTML = `<div class="detail"><a class="back glass" href="#">← All mushrooms</a><p>Species not found.</p></div>`; return; }

  const t = title(s);
  const imgs = s.images || [];
  const gallery = imgs.length
    ? `<button class="gallery-main" id="gallery-main" aria-label="Enlarge photo">
         <img src="${esc(imgs[0].url)}" alt="${esc(t)}" id="gallery-img">
         <span class="gallery-badge"><span id="gallery-idx">1</span> / ${imgs.length} · 🔍</span>
       </button>
       ${imgs.length > 1 ? `<div class="thumbs" id="thumbs">${imgs.map((im, i) => `<button class="thumb ${i === 0 ? "active" : ""}" data-i="${i}"><img src="${esc(im.url)}" alt="" loading="lazy"></button>`).join("")}</div>` : ""}`
    : `<div class="gallery-main"><div style="display:grid;place-items:center;height:100%;font-size:64px;color:#d6d3d1">🍄</div></div>`;

  const poison = poisonHTML(s);
  const looks = lookalikesHTML(s);
  const infoRows = [
    ["Edibility", (EDIBILITY[s.edibility] || EDIBILITY.unknown).label],
    ["Family", s.family], ["Genus", s.genus],
    ["Habitat", s.habitat], ["Substrate", s.substrate],
    ["Cap", s.cap], ["Gills", s.gills], ["Stem", s.stem],
    ["Spore print", s.spore_print], ["Flavor / odor", s.flavor_profile],
  ].filter((r) => r[1]);

  const namesTr = s.also_known_as_tr && s.also_known_as_tr.length
    ? `<div style="margin-top:8px"><div style="font-size:11px;font-weight:600;text-transform:uppercase;color:#a8a29e;margin-bottom:4px">Also known as (Turkish)</div><div class="chips">${s.also_known_as_tr.map((n) => `<span class="chip">${esc(n)}</span>`).join("")}</div></div>`
    : "";

  const occ = OCC_BY_SLUG.get(slug) || [];
  const mapBlock = occ.length
    ? `<div class="map-wrap detail-map" id="detail-map-wrap"><div id="detail-map" style="width:100%;height:100%"></div><button class="map-expand glass" id="detail-expand">⛶ Fullscreen</button></div>`
    : `<div class="detail-map empty-map">No location records for this species yet.</div>`;

  view.innerHTML = `<div class="detail">
    <a class="back glass" href="#">← All mushrooms</a>
    ${gallery}
    <div class="title-row"><h1>${esc(t)}</h1>${badge(s.edibility, "md")}</div>
    <p class="sci">${esc(s.scientific_name)}${s.family ? `<span class="fam">· ${esc(s.family)}</span>` : ""}</p>
    ${poison}
    ${s.description ? `<div class="desc glass"><p>${esc(s.description)}</p></div>` : ""}
    ${looks}
    <div class="panel glass">
      <section><h2>📅 Season</h2><div class="season">${MONTHS.map((m, i) => `<div class="m ${s.season_months.includes(i + 1) ? "on" : ""}" title="${MONTHS_FULL[i]}">${m}</div>`).join("")}</div>${s.season_months.length ? "" : `<p style="margin-top:8px;font-size:14px;color:#a8a29e">Season data not available.</p>`}</section>
      <section><h2>Identification</h2><dl>${infoRows.map((r) => `<div class="info-row"><dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd></div>`).join("")}</dl>
        ${s.common_name ? `<div style="margin-top:16px"><div style="font-size:11px;font-weight:600;text-transform:uppercase;color:#a8a29e;margin-bottom:4px">Common name</div><div class="chips"><span class="chip">${esc(s.common_name)}</span></div></div>` : ""}
        ${namesTr}
      </section>
    </div>
    <section style="margin-top:32px"><h2 style="font-size:20px;font-weight:700;margin:0 0 12px">🗺️ Where it occurs</h2>${mapBlock}</section>
    ${s.wikipedia_url ? `<div style="margin-top:24px"><a class="wiki-btn glass" href="${esc(s.wikipedia_url)}" target="_blank" rel="noopener noreferrer">📖 Read on Wikipedia →</a></div>` : ""}
  </div>`;

  if (imgs.length > 1) setupGallery(imgs, t);
  if (occ.length) setTimeout(() => initDetailMap(occ), 30);
  window.scrollTo(0, 0);
}

function poisonHTML(s) {
  const dangerous = s.edibility === "poisonous" || s.edibility === "deadly" || s.toxicity_level === "severe" || s.toxicity_level === "deadly";
  if (!dangerous) return "";
  const deadly = s.edibility === "deadly" || s.toxicity_level === "deadly";
  const m = EDIBILITY[s.edibility] || EDIBILITY.unknown;
  const toxLabels = { none: "no known toxicity", mild: "mild toxicity", severe: "severe toxicity", deadly: "deadly toxicity" };
  return `<div class="poison glass-danger" role="alert">
    <div class="icon">${deadly ? "💀" : "☠️"}</div>
    <div style="flex:1;min-width:0">
      <h2>${deadly ? "DEADLY — Do not eat!" : "POISONOUS — Do not eat!"}</h2>
      <p>This species is classified as <b>${esc(m.label.toLowerCase())}</b> (${toxLabels[s.toxicity_level] || "toxic"}). It must not be consumed under any circumstances.</p>
      ${s.toxins && s.toxins.length ? `<div class="tox-label">Contains toxins</div><ul class="tox">${s.toxins.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      <div class="cta">☎️ In case of suspected poisoning, contact your local <a href="https://en.wikipedia.org/wiki/List_of_poison_control_centers" target="_blank" rel="noopener noreferrer">poison control center</a> immediately (US: 1-800-222-1222).</div>
    </div></div>`;
}

function lookalikesHTML(s) {
  const looks = (s.lookalikes || []).filter((l) => l.slug);
  if (!looks.length) return "";
  return `<section class="looks glass-danger">
    <h2><span>⚠️</span> Similar species / poisonous look-alikes</h2>
    <p class="sub">The following species can be confused with this mushroom. Always check the distinguishing features before collecting.</p>
    ${looks.map((l) => {
      const lt = l.common_name || l.scientific_name;
      const cover = BY_SLUG.get(l.slug) && BY_SLUG.get(l.slug).cover;
      const im = cover ? `<img src="${esc(cover)}" alt="${esc(lt)}">` : `<div class="ph">🍄</div>`;
      const d = DANGER[l.danger_level] || DANGER.mild;
      return `<div class="look-item">
        <a class="im" href="#s/${encodeURIComponent(l.slug)}">${im}</a>
        <div class="look-body">
          <div class="look-head"><a class="lname" href="#s/${encodeURIComponent(l.slug)}">${esc(lt)}</a>${badge(l.edibility, "sm")}<span class="danger-badge" style="background:${d.color}">${d.label}</span></div>
          <div class="look-sci">${esc(l.scientific_name)}</div>
          ${l.note ? `<div class="look-note"><b>Distinguishing features: </b>${esc(l.note)}</div>` : ""}
        </div></div>`;
    }).join("")}
  </section>`;
}

function setupGallery(imgs, alt) {
  let idx = 0;
  const img = $("#gallery-img"), idxEl = $("#gallery-idx");
  const set = (i) => {
    idx = (i + imgs.length) % imgs.length;
    img.src = imgs[idx].url; idxEl.textContent = idx + 1;
    document.querySelectorAll("#thumbs .thumb").forEach((t, j) => t.classList.toggle("active", j === idx));
  };
  document.querySelectorAll("#thumbs .thumb").forEach((t) => t.addEventListener("click", () => set(Number(t.dataset.i))));
  $("#gallery-main").addEventListener("click", () => openLightbox(imgs, idx, set));
}

function openLightbox(imgs, start, syncMain) {
  let i = start;
  const box = document.createElement("div");
  box.style.cssText = "position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.9);display:flex;align-items:center;justify-content:center;padding:16px";
  const render = () => {
    const im = imgs[i];
    box.innerHTML = `<button id="lb-close" style="position:absolute;right:16px;top:16px;background:rgba(255,255,255,.12);color:#fff;border:0;border-radius:999px;padding:8px 14px;font-size:18px">✕</button>
      ${imgs.length > 1 ? `<button id="lb-prev" style="position:absolute;left:16px;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.12);color:#fff;border:0;border-radius:999px;padding:12px 16px;font-size:20px">‹</button><button id="lb-next" style="position:absolute;right:16px;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.12);color:#fff;border:0;border-radius:999px;padding:12px 16px;font-size:20px">›</button>` : ""}
      <figure style="margin:0;max-width:960px;max-height:100%"><img src="${esc(im.url)}" style="max-height:80vh;width:auto;border-radius:8px;object-fit:contain">${(im.credit || im.license) ? `<figcaption style="margin-top:8px;text-align:center;font-size:12px;color:rgba(255,255,255,.7)">${esc(im.credit || "")}${im.license ? ` (${esc(im.license)})` : ""}</figcaption>` : ""}</figure>`;
    $("#lb-close", box).onclick = close;
    if (imgs.length > 1) { $("#lb-prev", box).onclick = (e) => { e.stopPropagation(); i = (i - 1 + imgs.length) % imgs.length; render(); syncMain(i); }; $("#lb-next", box).onclick = (e) => { e.stopPropagation(); i = (i + 1) % imgs.length; render(); syncMain(i); }; }
  };
  const key = (e) => { if (e.key === "Escape") close(); else if (e.key === "ArrowLeft") { i = (i - 1 + imgs.length) % imgs.length; render(); syncMain(i); } else if (e.key === "ArrowRight") { i = (i + 1) % imgs.length; render(); syncMain(i); } };
  const close = () => { document.removeEventListener("keydown", key); box.remove(); };
  box.addEventListener("click", (e) => { if (e.target === box) close(); });
  document.addEventListener("keydown", key);
  render(); document.body.appendChild(box);
}

let detailMap = null;
function initDetailMap(occ) {
  const first = occ[0].geometry.coordinates;
  detailMap = new mapboxgl.Map({ container: "detail-map", style: MAP_STYLE, center: first, zoom: 5, attributionControl: true });
  detailMap.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
  addClustersWhenReady(detailMap, { type: "FeatureCollection", features: occ }, "docc");
  observeMapSize(detailMap, "detail-map");
  $("#detail-expand").addEventListener("click", () => { toggleFullscreen("#detail-map-wrap", "#detail-expand"); setTimeout(() => detailMap.resize(), 60); });
}

// ---- Fullscreen ------------------------------------------------------------
function toggleFullscreen(wrapSel, btnSel) {
  const wrap = $(wrapSel), btn = $(btnSel);
  const on = wrap.classList.toggle("fullscreen");
  btn.innerHTML = on ? "✕ Close" : "⛶ Fullscreen";
  document.body.style.overflow = on ? "hidden" : "";
  const map = wrapSel.includes("home") ? homeMap : detailMap;
  setTimeout(() => map && map.resize(), 60);
}

// ---- Router ---------------------------------------------------------------
function router() {
  const hash = location.hash.replace(/^#\/?/, "");
  if (hash.startsWith("s/")) {
    renderDetail(decodeURIComponent(hash.slice(2)));
  } else {
    if (!$("#home")) buildHome();
    else { document.querySelector("#view").innerHTML = ""; buildHome(); }
  }
}

// ---- Init -----------------------------------------------------------------
(async function () {
  // Header search wiring (live filter on home; from detail, submitting goes home)
  $("#search-form").addEventListener("submit", (e) => {
    e.preventDefault();
    filters.q = $("#search-input").value.trim(); filters.page = 1;
    if (location.hash.startsWith("#s/")) location.hash = "";
    else if ($("#home")) applyFilters();
    else router();
  });
  $("#search-input").addEventListener("input", (e) => {
    filters.q = e.target.value.trim(); filters.page = 1;
    if ($("#home")) applyFilters();
  });

  try {
    $("#view").innerHTML = `<div style="text-align:center;padding:80px;color:#78716c">Loading mushrooms…</div>`;
    await loadData();
  } catch (err) {
    $("#view").innerHTML = `<div style="text-align:center;padding:80px;color:#b91c1c">Failed to load data.</div>`;
    console.error(err); return;
  }
  window.addEventListener("hashchange", router);
  router();
})();
