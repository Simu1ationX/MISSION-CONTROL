// =========================
// CLOCK + DATE
// =========================
function pad2(n){ return String(n).padStart(2, "0"); }

function updateClock(){
  const now = new Date();
  const h = pad2(now.getHours());
  const m = pad2(now.getMinutes());
  const s = pad2(now.getSeconds());
  document.getElementById("clock").textContent = `${h}:${m}:${s}`;

  const dateStr = now.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  document.getElementById("date").textContent = dateStr;
}
setInterval(updateClock, 250);
updateClock();

// =========================
// NY OPEN TIMER (simple daily countdown)
// NY Open 9:30am ET (lightweight approx DST)
// =========================
function updateNYOpen(){
  const el = document.getElementById("nyOpen");
  const sessionEl = document.getElementById("sessionState");

  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;

  // quick DST-ish estimate (good enough for dashboard)
  const month = now.getMonth(); // 0-11
  const isDstish = month >= 2 && month <= 10;
  const etOffsetHours = isDstish ? -4 : -5;

  const etNow = new Date(utc + etOffsetHours * 3600000);

  const open = new Date(etNow);
  open.setHours(9, 30, 0, 0);

  let diffMs = open - etNow;
  if (diffMs <= 0){
    open.setDate(open.getDate() + 1);
    diffMs = open - etNow;
    sessionEl.textContent = "OPEN";
  } else {
    sessionEl.textContent = "COUNTDOWN";
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
// CENTER HUD (Stark useful data vibe - lightweight)
// =========================
const biasEl = document.getElementById("biasVal");
const vwapEl = document.getElementById("vwapDist");
const emaEl  = document.getElementById("emaAlign");
const arcText = document.getElementById("arcText");
const sysLog  = document.getElementById("sysLog");

const biasStates = ["BULLISH", "NEUTRAL", "BEARISH"];
let biasIdx = 1;

function addLog(line){
  if (!sysLog) return;
  const d = document.createElement("div");
  d.className = "log-line";
  d.textContent = line;
  sysLog.appendChild(d);

  // keep log from growing forever
  const maxLines = 9;
  while (sysLog.children.length > maxLines) sysLog.removeChild(sysLog.firstChild);
}

function updateCenterHud(){
  // This is “display” data (no broker/API). Just a useful vibe.
  // If you later want real values, we can wire to your TradingView webhook/pine alerts.

  // cycle bias every 10s
  const t = Date.now();
  if (t % 10000 < 400){
    biasIdx = (biasIdx + 1) % biasStates.length;
    biasEl.textContent = biasStates[biasIdx];
    addLog(`[HUD] Bias set: ${biasStates[biasIdx]}`);
  }

  // pseudo VWAP distance display
  const fake = (Math.sin(t / 3000) * 18).toFixed(1);
  vwapEl.textContent = `${fake > 0 ? "+" : ""}${fake} pts`;

  // EMA align display
  const align = fake > 6 ? "9>21 UP" : fake < -6 ? "9<21 DOWN" : "MIXED";
  emaEl.textContent = align;

  // arc status line
  arcText.textContent = `INITIALIZING • EXECUTION READY • ${biasStates[biasIdx]}`;
}
setInterval(updateCenterHud, 250);
updateCenterHud();

// =========================
// TRADINGVIEW CHARTS (LOCK MNQ, NO APPLE)
// FIXES: load timing + retry until tv.js ready
// =========================
const TV_SYMBOL = "CME_MINI:MNQ1!"; // ✅ hard lock MNQ continuous

function mountTVChart(containerId, interval){
  // clear container to avoid duplicate widgets on hot reloads
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = "";

  new TradingView.widget({
    autosize: true,
    symbol: TV_SYMBOL,
    interval: interval,              // "1", "5", "15"
    timezone: "America/Denver",
    theme: "dark",
    style: "1",
    locale: "en",
    toolbar_bg: "#0b1620",
    enable_publishing: false,
    save_image: false,
    hide_top_toolbar: false,
    hide_legend: false,
    allow_symbol_change: false,      // ✅ prevents drifting to AAPL
    container_id: containerId
  });
}

function initRightCharts(){
  mountTVChart("tv_right_1", "1");
  mountTVChart("tv_right_2", "5");
  mountTVChart("tv_right_3", "15");
  addLog("[TV] Charts mounted: MNQ1! (1m/5m/15m)");
}

// ✅ Retry loader: fixes GitHub Pages timing + prevents fallback
function waitForTradingViewAndInit(retries = 80){
  if (window.TradingView && typeof window.TradingView.widget === "function"){
    initRightCharts();
    return;
  }
  if (retries <= 0){
    console.error("TradingView failed to load.");
    addLog("[ERR] TradingView failed to load.");
    return;
  }
  setTimeout(() => waitForTradingViewAndInit(retries - 1), 250);
}

window.addEventListener("load", () => {
  waitForTradingViewAndInit();
});
