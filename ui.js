export let inProject = false;

const mainMenu = `
<div id="menu" class="text-center" style="width: 90%; max-width: 400px;">
  <h1 class="p-3" style="pointer-events: none; user-select: none;">Three.js MIDI Visualizer</h1>
  <ul class="navbar-nav">
    <li class="p-3"><button id="new-project" class="btn btn-lg btn-dark w-100">New Project</button></li>
    <li class="p-3 pt-0"><button class="btn btn-lg btn-dark w-100">Open Project</button></li>
  </ul>
</div>
`;

const openProjectHTML = `
<div class="card" style="width: 100%;">
  <ul class="navbar-nav d-flex">
    <li class="row"><button id="new-project" class="btn btn-lg btn-dark btn-project w-100">Project 1</button><button id="new-project" class="btn btn-lg btn-dark btn-project w-100">Project 1</button></li>
    <li class="row"><button class="btn btn-dark btn-project">Project 2</button></li>
  </ul>
</div>
`

export function addProject(name) {
  const projectItem = `
<li class="list-group-item d-flex justify-content-between align-items-center p-0 m-0 border-0" style="--bs-list-group-border-width: 0; height: 5rem">
  <a class="flex-grow-1 text-decoration-none p-2">${name}</a>
  <button class="btn btn-danger d-flex align-items-center justify-content-center border-0" style="aspect-ratio:1/1; height:100%;">
    <i class="fa-solid fa-trash"></i>
  </button>
</li>
  `;
  document.getElementById("project-list").innerHTML += projectItem;
}

export function openFade() {
  const fade = document.getElementsByClassName("overlay")[0];
  fade.style.backgroundColor = "rgba(0, 0, 0, 1)";
  fade.style.backdropFilter = "blur(20px)";

  setTimeout(() => { 
    setTimeout(() => {
      fade.style.transition = "background-color 1s, backdrop-filter 1s";
      fade.style.backgroundColor = "rgba(0, 0, 0, 0)";
      fade.style.backdropFilter = "blur(0px)";
    }, 0);
  }, 500);
}

export function newProject() {
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

  inProject = true;
}

export function openProjectDialog() {
  
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