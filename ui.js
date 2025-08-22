export function openFade() {
  const fade = document.getElementsByClassName("overlay")[0];
  fade.style.backgroundColor = "rgba(0, 0, 0, 1)";
  fade.style.backdropFilter = "blur(20px)";
  fade.style.pointerEvents = "none";

  setTimeout(() => { 
    setTimeout(() => {
      fade.style.transition = "background-color 1s, backdrop-filter 1s";
      fade.style.backgroundColor = "rgba(0, 0, 0, 0)";
      fade.style.backdropFilter = "blur(0px)";
    }, 0);
  }, 500);
}

export function closeMenu() {
  const fade = document.getElementsByClassName("ui-container")[0];
  fade.style.transition = "opacity 1s";
  fade.style.pointerEvents = "none";
  fade.style.opacity = 1;

  setTimeout(() => {
    fade.style.opacity = 0;
  }, 0);

  setTimeout(() => {
    fade.style.display = "none";
    fade.style.zIndex = -1;
  }, 1000);
}

export function denyMIDI() {
  const h = document.createElement("h1");
  h.innerText = "MIDI Access Denied";
  const p = document.createElement("p");
  p.innerText = "Your browser does not support the Web MIDI API. Please try a different browser or check your browser settings to enable MIDI access.";
  document.getElementById("menu").appendChild(h);
  document.getElementById("menu").appendChild(p);

  const button = document.createElement("button");
  button.innerText = "Continue Anyway";
  button.setAttribute("class", "btn btn-lg btn-primary");
  button.setAttribute("id", "start");
  document.getElementById("menu").appendChild(button);
}