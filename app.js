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
// Assumes NY open 9:30am ET.
// =========================
function updateNYOpen(){
  const el = document.getElementById("nyOpen");
  const sessionEl = document.getElementById("sessionState");

  const now = new Date();

  // Create a "today at 9:30 ET" time, then convert by using UTC math.
  // This avoids needing a full timezone lib.
  // Approx method: treat ET as UTC-5/UTC-4 depending on DST. We'll keep it simple:
  // If you want perfect DST handling, we can add luxon, but this works fine most of the year.
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;

  // naive ET offset guess:
  // - If month is Mar-Nov, assume DST (UTC-4). Else (UTC-5). This is not perfect but close.
  const month = now.getMonth(); // 0-11
  const isDstish = month >= 2 && month <= 10;
  const etOffsetHours = isDstish ? -4 : -5;

  const etNow = new Date(utc + etOffsetHours * 3600000);

  const open = new Date(etNow);
  open.setHours(9, 30, 0, 0);

  let diffMs = open - etNow;

  // If already past open, count to next day's open
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
// TRADINGVIEW CHARTS (LOCK MNQ, NO APPLE)
// =========================

const TV_SYMBOL = "CME_MINI:MNQ1!"; // ✅ hard lock to continuous MNQ

function mountTVChart(containerId, interval){
  // TradingView widget requires tv.js loaded before this runs.
  // We call it on window load below.

  new TradingView.widget({
    autosize: true,
    symbol: TV_SYMBOL,
    interval: interval,              // "1", "5", "15", "60"
    timezone: "America/Denver",
    theme: "dark",
    style: "1",
    locale: "en",
    toolbar_bg: "#0b1620",
    enable_publishing: false,
    save_image: false,
    hide_top_toolbar: false,
    hide_legend: false,
    allow_symbol_change: false,      // keep it locked so it never flips to Apple
    container_id: containerId
  });
}

function initRightCharts(){
  // 3 stacked charts on the right
  mountTVChart("tv_right_1", "1");   // 1m
  mountTVChart("tv_right_2", "5");   // 5m
  mountTVChart("tv_right_3", "15");  // 15m
}

window.addEventListener("load", () => {
  initRightCharts();
});
