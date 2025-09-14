import { FluidDynamics } from "fluid";
export const canvas = document.createElement("canvas");
canvas.id = "fluid-canvas";
document.body.appendChild(canvas);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Initialize FluidDynamics.
export const fluid = new FluidDynamics(canvas, {
  // Set simulation to cover entire canvas. 
  width: canvas.width,
  height: canvas.height,
  curl: 0,
  // See src/fluid-dynamics.js for all options.
  dyeDissipation: 0.75,
  pressureDissipation: 0.5,
  autoUpdate: true, 
  paused: false,
});

export function addEmitter(x, y, radius, brightness, velocity = {x: 0, y: 0}) {
  const width = radius;
  const height = radius;

  // inject velocity
  fluid.setVelocity(
    x,       // x position
    y,       // y position
    0,       // z (2D sim)
    width,   // width of area
    height,  // height of area
    velocity.x, // vx
    velocity.y  // vy
  );

  // inject dye
  fluid.setDye(
    x,
    y,
    0,       // z
    width,
    height,
    [brightness, brightness, brightness]
  );
}
