// =========================
// CLOCK + DATE
// =========================
function pad2(n){ return String(n).padStart(2, "0"); }

function updateClock(){
  const now = new Date();
  document.getElementById("clock").textContent =
    `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;

  document.getElementById("date").textContent = now.toLocaleDateString(undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
}
setInterval(updateClock, 250);
updateClock();

// =========================
// NY OPEN TIMER (9:30 ET, lightweight DST-ish)
// =========================
function updateNYOpen(){
  const el = document.getElementById("nyOpen");

  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;

  const month = now.getMonth();
  const isDstish = month >= 2 && month <= 10;     // simple
  const etOffsetHours = isDstish ? -4 : -5;

  const etNow = new Date(utc + etOffsetHours * 3600000);

  const open = new Date(etNow);
  open.setHours(9, 30, 0, 0);

  let diffMs = open - etNow;
  if (diffMs <= 0){
    open.setDate(open.getDate() + 1);
    diffMs = open - etNow;
  }

  const totalSec = Math.floor(diffMs / 1000);
  const hh = pad2(Math.floor(totalSec / 3600));
  const mm = pad2(Math.floor((totalSec % 3600) / 60));
  const ss = pad2(totalSec % 60);

  el.textContent = `${hh}:${mm}:${ss}`;
}
setInterval(updateNYOpen, 500);
updateNYOpen();

// =========================
// THEME SCHEDULER (CYAN ↔ PURPLE by time)
// - You said colors change at certain times.
// =========================
function setTheme(mode){
  const root = document.documentElement;
  const themeState = document.getElementById("themeState");

  if (mode === "PURPLE"){
    root.style.setProperty("--accent", "rgba(170,120,255,0.92)");
    root.style.setProperty("--accentSoft", "rgba(170,120,255,0.18)");
    root.style.setProperty("--stroke", "rgba(180,130,255,0.22)");
    themeState.textContent = "PURPLE";
  } else {
    root.style.setProperty("--accent", "rgba(0,255,220,0.90)");
    root.style.setProperty("--accentSoft", "rgba(0,255,220,0.18)");
    root.style.setProperty("--stroke", "rgba(80,255,240,0.20)");
    themeState.textContent = "CYAN";
  }
}

function themeByLocalTime(){
  const h = new Date().getHours();
  // Example schedule:
  // 00:00–06:59 PURPLE (focus/night)
  // 07:00–16:59 CYAN (day/session)
  // 17:00–23:59 PURPLE (wind-down)
  if (h < 7 || h >= 17) setTheme("PURPLE");
  else setTheme("CYAN");
}
setInterval(themeByLocalTime, 30_000);
themeByLocalTime();

// =========================
// CENTER HUD (simple “useful vibe” placeholder)
// =========================
const biasEl = document.getElementById("biasVal");
const vwapEl = document.getElementById("vwapDist");
const emaEl  = document.getElementById("emaAlign");
const arcText = document.getElementById("arcText");
const sysLog  = document.getElementById("sysLog");

function addLog(line){
  const d = document.createElement("div");
  d.className = "log-line";
  d.textContent = line;
  sysLog.appendChild(d);
  while (sysLog.children.length > 10) sysLog.removeChild(sysLog.firstChild);
}

const biasStates = ["BULLISH", "NEUTRAL", "BEARISH"];
let biasIdx = 1;

function updateCenterHud(){
  const t = Date.now();

  if (t % 10000 < 250){
    biasIdx = (biasIdx + 1) % biasStates.length;
    biasEl.textContent = biasStates[biasIdx];
    addLog(`[HUD] Bias: ${biasStates[biasIdx]}`);
  }

  const fake = (Math.sin(t / 3000) * 18).toFixed(1);
  vwapEl.textContent = `${fake > 0 ? "+" : ""}${fake} pts`;

  const align = fake > 6 ? "9>21 UP" : fake < -6 ? "9<21 DOWN" : "MIXED";
  emaEl.textContent = align;

  arcText.textContent = `EXECUTION READY • ${biasStates[biasIdx]}`;
}
setInterval(updateCenterHud, 250);
updateCenterHud();

// =========================
// TRADINGVIEW (FORCE MNQ — NO APPLE)
// =========================
const TV_SYMBOL = "CME_MINI:MNQ1!";  // ✅ hard lock
const TV_TF = ["1", "5", "15"];      // 1m, 5m, 15m

function mountTVChart(containerId, interval){
  const el = document.getElementById(containerId);
  if (!el) return;

  // Hard reset container to avoid ghosts/duplicates
  el.innerHTML = "";
  el.style.pointerEvents = "auto";

  new TradingView.widget({
    autosize: true,
    symbol: TV_SYMBOL,
    interval,
    timezone: "America/Denver",
    theme: "dark",
    style: "1",
    locale: "en",
    toolbar_bg: "#0b1620",
    enable_publishing: false,
    save_image: false,
    hide_top_toolbar: false,
    hide_legend: false,
    allow_symbol_change: false, // ✅ prevents drifting to AAPL
    container_id: containerId
  });
}

function initCharts(){
  mountTVChart("tv_right_1", TV_TF[0]);
  mountTVChart("tv_right_2", TV_TF[1]);
  mountTVChart("tv_right_3", TV_TF[2]);
  addLog(`[TV] Mounted ${TV_SYMBOL} (1m/5m/15m)`);
}

// Wait until tv.js is truly ready, then mount.
// If tv.js fails, you’ll see it in console/log.
function waitForTV(retries = 120){
  if (window.TradingView && typeof window.TradingView.widget === "function"){
    initCharts();
    return;
  }
  if (retries <= 0){
    addLog("[ERR] TradingView failed to load.");
    console.error("TradingView failed to load.");
    return;
  }
  setTimeout(() => waitForTV(retries - 1), 250);
}

window.addEventListener("load", () => {
  // Safety: make sure clicks are enabled (some browsers cache weird)
  document.body.style.pointerEvents = "auto";
  waitForTV();
});

// Optional: fullscreen button
document.addEventListener("click", (e) => {
  const t = e.target;
  if (t && t.id === "btnFull"){
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }
});
