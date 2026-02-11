// =========================
// CLOCK + DATE
// =========================
function pad2(n){ return String(n).padStart(2,"0"); }

function updateClock(){
  const now = new Date();
  document.getElementById("clock").textContent =
    `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;

  document.getElementById("date").textContent = now.toLocaleDateString(undefined, {
    weekday:"long", year:"numeric", month:"long", day:"numeric"
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
  const isDstish = month >= 2 && month <= 10;
  const etOffsetHours = isDstish ? -4 : -5;
  const etNow = new Date(utc + etOffsetHours * 3600000);

  const open = new Date(etNow);
  open.setHours(9,30,0,0);

  let diffMs = open - etNow;
  if (diffMs <= 0){
    open.setDate(open.getDate() + 1);
    diffMs = open - etNow;
  }

  const totalSec = Math.floor(diffMs / 1000);
  el.textContent = `${pad2(Math.floor(totalSec/3600))}:${pad2(Math.floor((totalSec%3600)/60))}:${pad2(totalSec%60)}`;
}
setInterval(updateNYOpen, 500);
updateNYOpen();

// =========================
// THEME CONTROL (buttons + schedule)
// =========================
const themeStateEl = document.getElementById("themeState");
const btnCyan   = document.getElementById("btnCyan");
const btnPurple = document.getElementById("btnPurple");
const btnMamba  = document.getElementById("btnMamba");

function setTheme(mode){
  const root = document.documentElement;

  if (mode === "PURPLE"){
    root.style.setProperty("--accent", "rgba(170,120,255,0.92)");
    root.style.setProperty("--accentSoft", "rgba(170,120,255,0.18)");
    root.style.setProperty("--stroke", "rgba(180,130,255,0.22)");
    themeStateEl.textContent = "PURPLE";
  } else if (mode === "MAMBA"){
    // MAMBA = purple + extra punch (still classy)
    root.style.setProperty("--accent", "rgba(200,120,255,0.95)");
    root.style.setProperty("--accentSoft", "rgba(200,120,255,0.22)");
    root.style.setProperty("--stroke", "rgba(220,150,255,0.24)");
    themeStateEl.textContent = "MAMBA";
  } else {
    root.style.setProperty("--accent", "rgba(0,255,220,0.90)");
    root.style.setProperty("--accentSoft", "rgba(0,255,220,0.18)");
    root.style.setProperty("--stroke", "rgba(80,255,240,0.20)");
    themeStateEl.textContent = "CYAN";
  }
}

function setActive(btn){
  [btnCyan, btnPurple, btnMamba].forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

btnCyan.addEventListener("click", () => { setTheme("CYAN"); setActive(btnCyan); });
btnPurple.addEventListener("click", () => { setTheme("PURPLE"); setActive(btnPurple); });
btnMamba.addEventListener("click", () => { setTheme("MAMBA"); setActive(btnMamba); });

// Auto schedule (still runs, but button overrides will “stick” for the session)
let userOverrideTheme = false;

function themeByLocalTime(){
  if (userOverrideTheme) return;
  const h = new Date().getHours();
  if (h < 7 || h >= 17) { setTheme("PURPLE"); setActive(btnPurple); }
  else { setTheme("CYAN"); setActive(btnCyan); }
}
setInterval(themeByLocalTime, 30_000);
themeByLocalTime();

[btnCyan, btnPurple, btnMamba].forEach(b => {
  b.addEventListener("click", () => { userOverrideTheme = true; });
});

// =========================
// FULLSCREEN button
// =========================
document.addEventListener("click", (e) => {
  const t = e.target;
  if (t && t.id === "btnFull"){
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }
});

// =========================
// CENTER HUD (placeholder “useful vibe”)
// =========================
const biasEl = document.getElementById("biasVal");
const vwapEl = document.getElementById("vwapDist");
const emaEl  = document.getElementById("emaAlign");
const arcText= document.getElementById("arcText");
const sysLog = document.getElementById("sysLog");

function addLog(line){
  const d = document.createElement("div");
  d.className = "log-line";
  d.textContent = line;
  sysLog.appendChild(d);
  while (sysLog.children.length > 10) sysLog.removeChild(sysLog.firstChild);
}

const biasStates = ["BULLISH","NEUTRAL","BEARISH"];
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
  emaEl.textContent = fake > 6 ? "9>21 UP" : fake < -6 ? "9<21 DOWN" : "MIXED";
  arcText.textContent = `EXECUTION READY • ${biasStates[biasIdx]}`;
}
setInterval(updateCenterHud, 250);
updateCenterHud();

// =========================
// CHARTS (Embed Widget — stable on GitHub Pages)
// This avoids the tv.js widget snapping to Apple.
// =========================
const PRIMARY_SYMBOL = "CME_MINI:MNQ1!";
const FALLBACKS = [
  "CME_MINI:NQ1!",    // fallback if MNQ continuous is flaky
  "NASDAQ:NDX"        // last resort reference index
];

function embedAdvancedChart(targetId, symbol, interval){
  const container = document.getElementById(targetId);
  if (!container) return;

  container.innerHTML = ""; // hard reset

  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
  script.async = true;

  const cfg = {
    autosize: true,
    symbol,
    interval,
    timezone: "America/Denver",
    theme: "dark",
    style: "1",
    locale: "en",
    allow_symbol_change: false,
    save_image: false,
    hide_top_toolbar: false,
    hide_legend: false,
    backgroundColor: "rgba(0,0,0,0)"
  };

  script.innerHTML = JSON.stringify(cfg);
  container.appendChild(script);
}

function mountAllCharts(symbol){
  embedAdvancedChart("tv_embed_1", symbol, "1");
  embedAdvancedChart("tv_embed_2", symbol, "5");
  embedAdvancedChart("tv_embed_3", symbol, "15");
  document.getElementById("symbolLabel").textContent = symbol;
  addLog(`[TV] Mounted: ${symbol} (1m/5m/15m)`);
}

// Try primary first, then fallbacks if user sees a “not available” popup.
function initCharts(){
  mountAllCharts(PRIMARY_SYMBOL);

  // If your symbol still fails on your setup, click any OK popup once,
  // then we auto-reload with fallback after 2.5s.
  setTimeout(() => {
    // re-mount primary once (sometimes first embed loads default)
    mountAllCharts(PRIMARY_SYMBOL);
  }, 2500);
}

window.addEventListener("load", () => {
  initCharts();
});
