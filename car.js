const elTitle = document.getElementById("carTitle");
const elSub = document.getElementById("carSubtitle");
const elBody = document.getElementById("carBody");
const elFavBtn = document.getElementById("favBtn");

const FAV_KEY = "fh5_favs";

function loadFavs() {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(arr);
  } catch {
    return new Set();
  }
}
function saveFavs(set) {
  localStorage.setItem(FAV_KEY, JSON.stringify([...set]));
}

function qs(name){
  return new URLSearchParams(location.search).get(name);
}

function esc(s){
  return String(s ?? "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}

async function init(){
  const id = qs("id");
  if (!id){
    elTitle.textContent = "Car not found";
    elBody.innerHTML = `<p class="muted">Missing id.</p>`;
    return;
  }

  const res = await fetch("./cars.json");
  const cars = await res.json();

  const car = cars.find(c => String(c.sourceId) === String(id));
  if (!car){
    elTitle.textContent = "Car not found";
    elBody.innerHTML = `<p class="muted">No car with id ${esc(id)}.</p>`;
    return;
  }

  elTitle.textContent = `${car.year} ${car.make} ${car.model}`;
  elSub.textContent = `${(car.collect||"—")} · ${(car.added||"—")}`;

  const favs = loadFavs();
  const inFav = favs.has(String(car.sourceId));
  elFavBtn.textContent = inFav ? "★ Favorited" : "⭐ Favorite";

  elFavBtn.addEventListener("click", () => {
    const favs2 = loadFavs();
    const key = String(car.sourceId);
    if (favs2.has(key)) favs2.delete(key);
    else favs2.add(key);
    saveFavs(favs2);
    elFavBtn.textContent = favs2.has(key) ? "★ Favorited" : "⭐ Favorite";
  });

  elBody.innerHTML = `
    <div class="detailRow"><span class="muted">Year</span><span>${esc(car.year)}</span></div>
    <div class="detailRow"><span class="muted">Make</span><span>${esc(car.make)}</span></div>
    <div class="detailRow"><span class="muted">Model</span><span>${esc(car.model)}</span></div>
    <div class="detailRow"><span class="muted">Source</span><span>${esc(car.collect || "—")}</span></div>
    <div class="detailRow"><span class="muted">Added</span><span>${esc(car.added || "—")}</span></div>
    <div class="detailRow"><span class="muted">Nickname</span><span>${esc(car.nickname || "—")}</span></div>
    <div class="detailRow"><span class="muted">Car Type</span><span>${esc(car.carType || "—")}</span></div>
    <div class="detailRow"><span class="muted">Official ID</span><span>${esc(car.sourceId)}</span></div>
  `;
}

init().catch(console.error);
