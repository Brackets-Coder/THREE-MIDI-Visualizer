import * as THREE from 'three';
import { globalColor } from './main.js';

let WhiteKeyWidth  = 0.025;
let WhiteKeyDepth  = 0.15;
let WhiteKeyHeight = 0.025;
let BlackKeyWidth  = 0.0137;
let BlackKeyDepth  = 0.09;
let BlackKeyHeight = 0.01;

export function isBlackKey(MIDINote) {
  const NoteMod = MIDINote % 12;
  return (NoteMod === 1 || NoteMod === 3 || NoteMod === 6 || NoteMod === 8 || NoteMod === 10);
}

export function noteTransform(MIDINote) {
  // TODO: Adjust the black key positioning to be more accurate: 
  // TODO: make the leftmost side of F#s and C#s align with the center of their adjacent white keys
  // TODO: make the rightmost side of Bb's and Eb's align with the center of their adjacent white keys
  // TODO: A flats should be centered between g and a
  const TotalWhiteKeys = 52;
  const TotalWhiteKeyWidth = WhiteKeyWidth * TotalWhiteKeys;
  const StartX = (-TotalWhiteKeyWidth / 2) + (WhiteKeyWidth / 2);
  const BaseY = 0;
  const BaseZ = 0;

  const NoteMod = MIDINote % 12;
  const isBlackKey = (NoteMod === 1 || NoteMod === 3 || NoteMod === 6 || NoteMod === 8 || NoteMod === 10);

  let WhiteKeyCount = 0;
  for (let i = 21; i < MIDINote; i++) {
    const Mod = i % 12;
    if (!(Mod === 1 || Mod === 3 || Mod === 6 || Mod === 8 || Mod === 10)) {
      WhiteKeyCount++;
    }
  }

  if (!isBlackKey) {
    const X = StartX + WhiteKeyCount * WhiteKeyWidth;
    return {
      position: new THREE.Vector3(X, BaseY, BaseZ),
      scale: new THREE.Vector3(WhiteKeyWidth, WhiteKeyDepth, WhiteKeyHeight),
      quaternion: new THREE.Quaternion() // identity
    };
  } else {
    let OffsetWeight = 0;
    switch (NoteMod) {
      case 1:  OffsetWeight = -0.175; break; // C#
      case 3:  OffsetWeight =  0.175; break; // D#
      case 6:  OffsetWeight = -0.175; break; // F#
      case 8:  OffsetWeight =  0.0;   break; // G#
      case 10: OffsetWeight =  0.175; break; // A#
    }

    const X = StartX + (WhiteKeyCount - 1) * WhiteKeyWidth + (WhiteKeyWidth * 0.5) + (OffsetWeight * BlackKeyWidth);
    const Y = (BaseY + (WhiteKeyDepth - BlackKeyDepth) / 2);
    const Z = BaseZ + ((WhiteKeyHeight - BlackKeyHeight) / 2) + BlackKeyHeight;

    return {
      position: new THREE.Vector3(X, Y, Z),
      scale: new THREE.Vector3(BlackKeyWidth, BlackKeyDepth, BlackKeyHeight),
    };
  }
}

let keys = [];
export function generatePianoKeyboard(scene) {
  for (let midiNote = 21; midiNote <= 108; midiNote++) {
    const { position, scale } = noteTransform(midiNote);
    const isBlackKey = [1, 3, 6, 8, 10].includes(midiNote % 12);
    const color = isBlackKey ? 0x000000 : 0xffffff;

    const geometry = new THREE.BoxGeometry(scale.x, scale.y, scale.z);
    const material = new THREE.MeshStandardMaterial({ color, emissive: globalColor, emissiveIntensity: 0 });
    const key = new THREE.Mesh(geometry, material);

    key.position.copy(position);
    scene.add(key);
    keys.push(key);
  }
}

export function setKeyDimensions(scene, whiteWidth, whiteDepth, whiteHeight, blackWidth, blackDepth, blackHeight) {
  WhiteKeyWidth  = whiteWidth;
  WhiteKeyDepth  = whiteDepth;
  WhiteKeyHeight = whiteHeight;
  BlackKeyWidth  = blackWidth;
  BlackKeyDepth  = blackDepth;
  BlackKeyHeight = blackHeight;
  
  generatePianoKeyboard(scene)
}


export function lightKeyOn(midiNote) {
  const key = keys[midiNote - 21];
  if (key) {
    key.material.color.set(0x0000);
    key.material.emissiveIntensity = 2;
  }
}

export function lightKeyOff(midiNote) {
  const key = keys[midiNote - 21];
  if (key) {
    key.material.color.set(isBlackKey(midiNote) ? 0x000000 : 0xffffff);
    key.material.emissiveIntensity = 0;
  }
}

export function createNote(MIDI) {
  const { position, scale } = noteTransform(MIDI);
  const geometry = new THREE.PlaneGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: globalColor, side: THREE.DoubleSide, transparent: true, emissiveIntensity: 2 });
  const note = new THREE.Mesh(geometry, material);
  note.position.x = position.x;
  note.scale.x = scale.x;
  note.scale.y = 0;
  note.scale.z = 1;
  setNoteRoundness(0, note);
  note.on = true;
  note.midi = MIDI;
  return note;
}

// TODO: This needs to be improved for performance
export function setNoteRoundness(roundness, note) {
  const c = document.createElement("canvas");
  c.width = 1024 * note.scale.x;
  c.height = 1024 * note.scale.y;
  const ctx = c.getContext("2d");

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, c.width, c.height);

  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.roundRect(0, 0, c.width, c.height, (roundness / 100) * (Math.min(c.width, c.height) / 2));
  ctx.fill();

  note.material.alphaMap = new THREE.CanvasTexture(c);

  note.material.needsUpdate = true;
}



export { WhiteKeyDepth, WhiteKeyWidth, WhiteKeyHeight, BlackKeyDepth, BlackKeyWidth, BlackKeyHeight };