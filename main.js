import * as THREE from 'three';
import * as Functions from './functions.js';
import * as Shaders from './shaders.js';
import * as UI from './ui.js';
import * as Fluid from './fluid.js';
import { PostProcessing, WebGPURenderer } from 'three/webgpu';
import WebGL from 'three/addons/capabilities/WebGL.js';
//import WebGPU from 'three/addons/capabilities/WebGPU.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
//import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'three/addons/libs/stats.module.js';
// webgl postprocessing
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
// webgpu postprocessing
import { pass } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';

"use strict";

const projectCount = 0; // TODO: Example project count, replace with actual logic to get project count

if (projectCount === 0) {
  const projectList = document.getElementById("project-list");
  projectList.style.textAlign = "center";
  projectList.style.color = "gray";
  projectList.style.padding = "5rem";
  projectList.innerHTML = `<i>No projects found. Please create a new project.</i>`;
} else {
  for (let i = 0; i < projectCount; i++) {
    UI.addProject(`Project ${i + 1}`)
  }
}

export const globalColor = "rgb( 0, 128, 128 )";

//* =-=-=-=-=| DATA SETUP |=-=-=-=-=-=

const request = indexedDB.open("projects", 1);

request.onupgradeneeded = (event) => {
  const db = event.target.result;
  db.createObjectStore("MyStore", { keyPath: "id", autoIncrement: true });
};

request.onsuccess = (event) => {
  const db = event.target.result;
  console.log("DB opened", db);
};

request.onerror = (event) => {
  console.error("DB error", event.target.error);
};

//* =-=-=-=-=-=| MIDI SETUP |=-=-=-=-=-=

navigator.requestMIDIAccess?.().then((midiAccess) => {
  const inputs = midiAccess.inputs.values();
  for (let input of inputs) {
    input.onmidimessage = (message) => {
      const [status, note, velocity] = message.data;

      if (status === 144 && velocity > 0) { // Note On}
        const event = new CustomEvent("noteon", { detail: { note, velocity } });
        document.dispatchEvent(event);
      } else if (status === 128 || (status === 144 && velocity === 0)) { // Note Off
        const event = new CustomEvent("noteoff", { detail: { note } });
        document.dispatchEvent(event);
      }

    };
  }
}).catch((err) => {
  console.error("Failed to get MIDI access:", err);
});

//* =-=-=-=-=-=| RENDER SETUP |=-=-=-=-=-=
 
if ( WebGL.isWebGL2Available() ) {

  const canvas = document.querySelector('#c');

  let renderer;
  if (navigator.gpu) {
    renderer = new WebGPURenderer({ canvas, antialias: true });
  } else {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  }

  const stats = new Stats();
  document.body.append( stats.dom );
  stats.dom.style.zIndex = 1;

  //* =-=-=-=-=-=| SCENE SETUP |=-=-=-=-=-=

  const camera = new THREE.PerspectiveCamera( 75, 2, 0.001, 999 );
  const controls = new OrbitControls( camera, renderer.domElement );
  camera.position.z = 0.6;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableRotate = false;
  controls.update();

  const scene = new THREE.Scene();
  const AmbientLight = new THREE.AmbientLight( 0xefefef ); // soft white light
  scene.add( AmbientLight );

  scene.background = new THREE.Color(0x000000); // solid color

  //* =-=-=-=-=-=| POSTPROCESS SETUP |=-=-=-=-=-=

  let composer;
  let postProcessing

  if (navigator.gpu) {
    postProcessing = new PostProcessing( renderer );

    const scenePass = pass( scene, camera );
    const scenePassColor = scenePass.getTextureNode( 'output' );
    const bloomPass = bloom( scenePassColor );
    bloomPass.strength.value = 1.5;
    bloomPass.radius.value = 0.1;
    bloomPass.threshold.value = 0.3;

    postProcessing.outputNode = scenePassColor.add( bloomPass );
  } else {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
  
    const bloomParams = {
        strength: 1.5,   // intensity
        radius: 0.1,       // spread
        threshold: 0.3 // brightness cutoff
    };
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), bloomParams.strength, bloomParams.radius, bloomParams.threshold);
    composer.addPass(bloomPass);
  }

  //* =-=-=-=-=-=| RESIZER |=-=-=-=-=-=

  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const pixelRatio = window.devicePixelRatio;
    const width  = Math.floor( canvas.clientWidth  * pixelRatio );
    const height = Math.floor( canvas.clientHeight * pixelRatio );
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
      if (!navigator.gpu) composer.setSize(width, height);
    }
    return needResize;
  }

  //* =-=-=-=-=-=| UI SETUP |=-=-=-=-=-=

  window.addEventListener("DOMContentLoaded", () => {
    UI.openFade();
  });

  document.getElementById("new-project").addEventListener("click", () => {
    UI.newProject();
  });

  document.getElementById("new-project").addEventListener("click", () => {
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.enableRotate = true;
  });

  //* =-=-=-=-=-=| INPUT SETUP |=-=-=-=-=-=

  window.addEventListener('keydown', (e) => {
    if (e.key === "0") {
      controls.reset();
      camera.position.set(0, 0, 0.6); // Reset camera position
      camera.lookAt(0, 0, 0); // Ensure the camera is looking at the origin
      camera.rotation.set(0, 0, 0);
      controls.update(); // Reset OrbitControls to default state
    }
  });
  
  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      if (UI.inProject) {
        const el = document.getElementById('save-project');
        if (!el.classList.contains('show')) {
          new bootstrap.Modal(el).show();
        }
      }
    }
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === " ") {
      if (UI.inProject) {
        Fluid.addEmitter(Fluid.canvas.width / 2, Fluid.canvas.height /2, 20, 0.2, {x: 0, y: 500});
      }
    }
  });

  //* =-=-=-=-=-=| GEOMETRY SETUP |=-=-=-=-=-=

  const activeNotes = [];
  const offNotes = [];
  
  // generate the piano keyboard
  Functions.generatePianoKeyboard(scene);

  // generate the laser
  const geometry = new THREE.BoxGeometry((0.025 * 52) - 0.001, 0.025 / 2, 0.024, 100, 1, 1);
  const laser = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x000000, emissive: globalColor, emissiveIntensity: 2 }));
  laser.position.set(0, (0.15 / 2), 0);
  scene.add(laser);

  const fluidTexture = new THREE.CanvasTexture(document.getElementById("fluid-canvas"));
  const planeGeometry = new THREE.PlaneGeometry(1 * Fluid.fluid._aspectRatio, 1); // adjust size to fit keyboard
  const planeMaterial = new THREE.MeshBasicMaterial({ map: fluidTexture, transparent: true, side: THREE.DoubleSide, alphaMap: fluidTexture, });
  const fluidPlane = new THREE.Mesh(planeGeometry, planeMaterial);

  // position it slightly above the keyboard
  fluidPlane.position.set(0, 0.1, 0); 
  scene.add(fluidPlane);

  //* =-=-=-=-=-=| GAME LOOP |=-=-=-=-=-=

  document.addEventListener("noteon", (e) => {
    const { note, velocity } = e.detail;

    Functions.lightKeyOn(note);
  
    const newnote = Functions.createNote(note);
    activeNotes.push(newnote);
    scene.add(newnote);
  });

  document.addEventListener("noteoff", (e) => {
    const { note } = e.detail;

    Functions.lightKeyOff(note);

    const idx = activeNotes.findIndex(n => n.midi === note);
    if (idx !== -1) {
      const note = activeNotes[idx];
      note.on = false;
      activeNotes.splice(idx, 1);
      offNotes.push(note);
    }
  });

  function tick(time, deltaTime) {
    fluidTexture.needsUpdate = true;
    activeNotes.forEach(n => {
      n.scale.y += deltaTime / 5;
      n.position.y = (n.scale.y / 2) + (0.15 / 3);
      Functions.setNoteRoundness(50, n);
    });
  
    offNotes.forEach((n, i) => {
      n.position.y += deltaTime / 5;
      const bottomY = n.position.y - n.scale.y / 2;
      if (bottomY > (0.15 * 10)) {
        scene.remove(n);
        offNotes.splice(i, 1);
      }
    });
  }

  //* =-=-=-=-=-=| RENDER LOOP |=-=-=-=-=-=

  let prevTime = 0;

  function render(time) {
    time *= 0.001;
    const deltaTime = time - prevTime;
    prevTime = time;
  
    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }
    
    tick(time, deltaTime);

    navigator.gpu ? postProcessing.renderAsync() : renderer.render(scene, camera);

    if (!navigator.gpu) composer.render();
    
    stats.update();
  
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
  
} else {
  const warning = WebGL.getWebGL2ErrorMessage();
  document.body.appendChild( warning );
}
