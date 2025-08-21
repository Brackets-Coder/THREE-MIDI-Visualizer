import * as THREE from 'three';
import * as Functions from './functions.js';
//import * as Shaders from './shaders.js';
import { PostProcessing, WebGPURenderer } from 'three/webgpu';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
//import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'three/addons/libs/stats.module.js';
// webgl postprocessing
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js"
// webgpu postprocessing
import { pass } from 'three/tsl'
import { bloom } from 'three/addons/tsl/display/BloomNode.js';

"use strict";

//* =-=-=-=-=-=| MIDI SETUP |=-=-=-=-=-=

if (!navigator.requestMIDIAccess) {

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

} else {

  const h = document.createElement("h1");
  h.innerText = "Hello";
  document.getElementById("menu").appendChild(h);

  const button = document.createElement("button");
  button.innerText = "Start";
  button.setAttribute("class", "btn btn-lg btn-primary");
  button.setAttribute("id", "start");
  document.getElementById("menu").appendChild(button);

  document.getElementById("start").addEventListener("click", () => {
    navigator.requestMIDIAccess().then((midiAccess) => {
      const inputs = midiAccess.inputs.values();
      for (let input of inputs) {
        console.log("hello")
        input.onmidimessage = (message) => {
          const [status, note, velocity] = message.data;

          if (status === 144 && velocity > 0) { // Note On
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
  });
}

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
  camera.position.z = 0.6;
  const controls = new OrbitControls( camera, renderer.domElement );
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableRotate = false;
  controls.update();

  // * start button
  document.getElementById("start").addEventListener("click", () => {
    document.getElementsByClassName("ui-container")[0].style.display = "none";
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.enableRotate = true;
  });
  
  const scene = new THREE.Scene();
  const AmbientLight = new THREE.AmbientLight( 0xefefef ); // soft white light
  scene.add( AmbientLight );

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

  //* =-=-=-=-=-=| INPUT SETUP |=-=-=-=-=-=

  window.addEventListener('keydown', (e) => {
    if (e.key === "0") {
      camera.position.set(0, 0, 5); // Reset camera position
      camera.lookAt(0, 0, 0); // Ensure the camera is looking at the origin
      controls.reset(); // Reset OrbitControls to default state
    }
  });

  //* =-=-=-=-=-=| GEOMETRY SETUP |=-=-=-=-=-=

  const activeNotes = [];
  const offNotes = [];
  
  // generate the piano keyboard
  Functions.generatePianoKeyboard(scene);

  // generate the laser
  const geometry = new THREE.BoxGeometry((0.025 * 52) - 0.001, 0.025 / 2, 0.024, 100, 1, 1);
  const laser = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x000000, emissive: "rgb(0, 128, 128)", emissiveIntensity: 2 }));
  laser.position.set(0, (0.15 / 2), 0);
  scene.add(laser);

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
