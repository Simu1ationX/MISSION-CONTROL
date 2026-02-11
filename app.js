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

const btnCyan = document.getElementById("btnCyan");
const btnPurple = document.getElementById("btnPurple");
const btnMamba = document.getElementById("btnMamba");
const themeState = document.getElementById("themeState");

function setActive(btn){
  [btnCyan, btnPurple, btnMamba].forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

function setTheme(mode){
  const r = document.documentElement;
  if(mode === "PURPLE"){
    r.style.setProperty("--accent","rgba(170,120,255,0.92)");
    r.style.setProperty("--accentSoft","rgba(170,120,255,0.18)");
    r.style.setProperty("--stroke","rgba(180,130,255,0.22)");
    themeState.textContent = "PURPLE";
  }else if(mode === "MAMBA"){
    r.style.setProperty("--accent","rgba(200,120,255,0.95)");
    r.style.setProperty("--accentSoft","rgba(200,120,255,0.22)");
    r.style.setProperty("--stroke","rgba(220,150,255,0.26)");
    themeState.textContent = "MAMBA";
  }else{
    r.style.setProperty("--accent","rgba(0,255,220,0.92)");
    r.style.setProperty("--accentSoft","rgba(0,255,220,0.18)");
    r.style.setProperty("--stroke","rgba(80,255,240,0.20)");
    themeState.textContent = "CYAN";
  }
}

// buttons
btnCyan.addEventListener("click", () => { setTheme("CYAN"); setActive(btnCyan); });
btnPurple.addEventListener("click", () => { setTheme("PURPLE"); setActive(btnPurple); });
btnMamba.addEventListener("click", () => { setTheme("MAMBA"); setActive(btnMamba); });

// fullscreen
document.getElementById("btnFull").addEventListener("click", () => {
  if(!document.fullscreenElement) document.documentElement.requestFullscreen?.();
  else document.exitFullscreen?.();
});

// initial theme schedule (optional)
(function themeByTime(){
  const h = new Date().getHours();
  if(h < 7 || h >= 17){ setTheme("PURPLE"); setActive(btnPurple); }
  else{ setTheme("CYAN"); setActive(btnCyan); }
})();
