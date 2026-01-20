let CARS = [];

/* ---------- Elements ---------- */
const elQ = document.getElementById("q");
const elBtn = document.getElementById("btn");
const elAll = document.getElementById("all");
const elCount = document.getElementById("count");
const elChips = document.getElementById("chips");

const elMakeFilter = document.getElementById("makeFilter");
const elYearFilter = document.getElementById("yearFilter");
const elCollectFilter = document.getElementById("collectFilter");
const elSortBy = document.getElementById("sortBy");
const elFavOnly = document.getElementById("favOnly");
const elClearFilters = document.getElementById("clearFilters");

/* ---------- Favorites ---------- */
const FAV_KEY = "fh5_favs";
function loadFavs() {
  try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || "[]")); }
  catch { return new Set(); }
}
function saveFavs(set) {
  localStorage.setItem(FAV_KEY, JSON.stringify([...set]));
}
let favs = loadFavs();

/* ---------- Helpers ---------- */
function norm(s) {
  return (s || "")
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function debounce(fn, delay = 180) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}
function carLabel(c) {
  return `${c.year || ""} ${c.make || ""} ${c.model || ""}`.replace(/\s+/g, " ").trim();
}
function carSearchText(c) {
  return norm([c.make, c.model, c.year, c.collect, c.added, ...(c.alias || [])].join(" "));
}

/* ---------- Smart shorthand codes ---------- */
const CODE_ALIASES = {
  // Skyline generations
  r32: ["nissan", "skyline", "gtr", "gt", "r"],
  r33: ["nissan", "skyline", "gtr", "gt", "r"],
  r34: ["nissan", "skyline", "gtr", "gt", "r"],

  // Supra generations
  mk4: ["toyota", "supra"],
  mkiv: ["toyota", "supra"],
  mk3: ["toyota", "supra"],
  mkiii: ["toyota", "supra"],

  // RX-7
  fd: ["mazda", "rx", "7", "rx7", "rx-7"],
  fc: ["mazda", "rx", "7", "rx7", "rx-7"],
  fb: ["mazda", "rx", "7", "rx7", "rx-7"],

  // MX-5 / Miata
  na: ["mazda", "mx", "5", "mx5", "mx-5", "miata"],
  nb: ["mazda", "mx", "5", "mx5", "mx-5", "miata"],
  nc: ["mazda", "mx", "5", "mx5", "mx-5", "miata"],
  nd: ["mazda", "mx", "5", "mx5", "mx-5", "miata"],

  // BMW chassis
  e46: ["bmw", "m3"],
  e92: ["bmw", "m3"],
  f82: ["bmw", "m4"],
};

function queryToTokens(raw) {
  const q = norm(raw);
  if (!q) return [];

  const words = q.split(" ").filter(Boolean);

  // If the query is exactly a code like "r34", replace it
  if (words.length === 1 && CODE_ALIASES[words[0]]) {
    return [...new Set(CODE_ALIASES[words[0]].map(norm).filter(Boolean))];
  }

  // Otherwise expand any codes inside the query
  const out = [];
  for (const w of words) {
    if (CODE_ALIASES[w]) out.push(...CODE_ALIASES[w]);
    else out.push(w);
  }

  // Normalize + unique
  const cleaned = out
    .map(norm)
    .join(" ")
    .split(" ")
    .filter(Boolean);

  return [...new Set(cleaned)];
}

function matchesAllTokens(text, tokens) {
  // ALL tokens must exist somewhere in the car text
  for (const t of tokens) {
    if (!text.includes(t)) return false;
  }
  return true;
}

/* ---------- Filters ---------- */
function getFilteredCars() {
  const makeVal = elMakeFilter?.value || "";
  const yearVal = elYearFilter?.value || "";
  const collectVal = elCollectFilter?.value || "";
  const favOnly = !!elFavOnly?.checked;

  return CARS.filter(c => {
    if (makeVal && c.make !== makeVal) return false;
    if (yearVal && String(c.year) !== String(yearVal)) return false;
    if (collectVal && String(c.collect || "") !== String(collectVal)) return false;
    if (favOnly && !favs.has(String(c.sourceId))) return false;
    return true;
  });
}

/* ---------- Sorting ---------- */
function applySort(list) {
  const s = elSortBy?.value || "relevance";
  const arr = list.slice();

  if (s === "az") arr.sort((a,b)=>carLabel(a).localeCompare(carLabel(b)));
  if (s === "za") arr.sort((a,b)=>carLabel(b).localeCompare(carLabel(a)));
  if (s === "newest") arr.sort((a,b)=>(Number(b.year)||0)-(Number(a.year)||0) || carLabel(a).localeCompare(carLabel(b)));
  if (s === "oldest") arr.sort((a,b)=>(Number(a.year)||0)-(Number(b.year)||0) || carLabel(a).localeCompare(carLabel(b)));

  return arr;
}

/* ---------- Search ---------- */
function searchCars(raw, dataset) {
  const tokens = queryToTokens(raw);
  if (tokens.length === 0) return dataset;

  return dataset.filter(c => {
    const text = carSearchText(c);
    return matchesAllTokens(text, tokens);
  });
}

/* ---------- Render ---------- */
function renderCars(list) {
  const sorted = applySort(list);
  if (elCount) elCount.textContent = String(sorted.length);

  elAll.innerHTML = sorted.map(c => `
    <a class="item cardLink" href="car.html?id=${encodeURIComponent(c.sourceId)}">
      <div class="cardTop">
        <strong>${carLabel(c)}</strong>
        <button class="favBtn" type="button" data-fav="${c.sourceId}" aria-label="Favorite">
          ${favs.has(String(c.sourceId)) ? "★" : "☆"}
        </button>
      </div>
      <small>${(c.collect || "—")} · ${(c.added || "—")}</small>
    </a>
  `).join("");
}

function doSearch() {
  const q = elQ.value.trim();
  const base = getFilteredCars();
  const results = q ? searchCars(q, base) : base;
  renderCars(results);
}

/* ---------- Chips ---------- */
function renderChips() {
  if (!elChips) return;

  // top makes by count so they always work
  const makeCounts = new Map();
  for (const c of CARS) {
    if (!c.make) continue;
    makeCounts.set(c.make, (makeCounts.get(c.make) || 0) + 1);
  }
  const topMakes = [...makeCounts.entries()]
    .sort((a,b)=>b[1]-a[1])
    .slice(0, 8)
    .map(([m]) => m);

  // include a couple of fun/known ones
  const chips = [...topMakes, "1997", "2020", "R34", "MK4", "FD", "E46"];

  elChips.innerHTML = chips
    .map(t => `<button class="chip" data-q="${t}" type="button">${t}</button>`)
    .join("");
}

/* ---------- Populate filter dropdowns ---------- */
function fillFilters() {
  if (!elMakeFilter || !elYearFilter || !elCollectFilter) return;

  const makes = [...new Set(CARS.map(c => c.make).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  const years = [...new Set(CARS.map(c => String(c.year)).filter(Boolean))].sort((a,b)=>Number(a)-Number(b));
  const collects = [...new Set(CARS.map(c => (c.collect || "").trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));

  elMakeFilter.innerHTML = `<option value="">All makes</option>` + makes.map(m => `<option value="${m}">${m}</option>`).join("");
  elYearFilter.innerHTML = `<option value="">All years</option>` + years.map(y => `<option value="${y}">${y}</option>`).join("");
  elCollectFilter.innerHTML = `<option value="">All sources</option>` + collects.map(s => `<option value="${s}">${s}</option>`).join("");
}

/* ---------- Init ---------- */
async function init() {
  try {
    const res = await fetch("./cars.json");
    CARS = await res.json();

    fillFilters();
    renderChips();
    renderCars(CARS);
  } catch (err) {
    console.error("Failed to load cars.json", err);
  }
}

/* ---------- Events ---------- */
const liveSearch = debounce(doSearch, 150);

elQ.addEventListener("input", liveSearch);
elBtn.addEventListener("click", doSearch);

elAll.addEventListener("click", (e) => {
  const favBtn = e.target.closest(".favBtn");
  if (!favBtn) return;

  e.preventDefault();
  e.stopPropagation();

  const id = String(favBtn.dataset.fav);
  if (favs.has(id)) favs.delete(id);
  else favs.add(id);

  saveFavs(favs);
  doSearch();
});

elChips?.addEventListener("click", (e) => {
  const chip = e.target.closest("[data-q]");
  if (!chip) return;
  elQ.value = chip.dataset.q;
  doSearch();
});

[elMakeFilter, elYearFilter, elCollectFilter, elSortBy, elFavOnly].forEach(el => {
  el?.addEventListener("change", doSearch);
});

elClearFilters?.addEventListener("click", () => {
  elMakeFilter.value = "";
  elYearFilter.value = "";
  elCollectFilter.value = "";
  elSortBy.value = "relevance";
  elFavOnly.checked = false;
  elQ.value = "";
  renderCars(CARS);
});

init();
