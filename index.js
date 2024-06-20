import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";
import { EffectComposer } from "jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "jsm/postprocessing/UnrealBloomPass.js";
import spline from "./spline.js";

const w = window.innerWidth;
const h = window.innerHeight;
const fov = 75;
const aspect = w / h;
const near = 0.1;
const far = 1000;
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.3);
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer();
renderer.setSize(w, h);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.03;

const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 1.5, 0.4, 100);
bloomPass.threshold = 0.002;
bloomPass.strength = 3.5;
bloomPass.radius = 0;
const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

const points = spline.getPoints(100);
const geometry = new THREE.BufferGeometry().setFromPoints(points);
const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
const line = new THREE.Line(geometry, material);
// scene.add(line);

// tube geometry from spline
const tubeGeo = new THREE.TubeGeometry(spline, 222, 0.65, 16, true);

// edge geometry

const edges = new THREE.EdgesGeometry(tubeGeo, 0.2);
const lineMat = new THREE.LineBasicMaterial({ color: 0xff0000 });
const tubeLines = new THREE.LineSegments(edges, lineMat);
scene.add(tubeLines);

// boxes through tube
const numOfBoxes = 55;
const size = 0.075;
const boxGeo = new THREE.BoxGeometry(size, size, size);

for (let i = 0; i < numOfBoxes; i++) {
  const boxMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
  });
  const box = new THREE.Mesh(boxGeo, boxMat);
  const p = (i / numOfBoxes + Math.random() * 0.01) % 1;
  const pos = tubeGeo.parameters.path.getPointAt(p);
  pos.x += Math.random() - 0.4;
  pos.y += Math.random() - 0.4;
  box.position.copy(pos);
  const rote = new THREE.Vector3(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI
  );
  box.rotation.set(rote.x, rote.y, rote.z);

  const edges = new THREE.EdgesGeometry(boxGeo, 0.2);
  const color = new THREE.Color().setHSL(1.0 - p, 1, 0.5);
  const lineMat = new THREE.LineBasicMaterial({ color });
  const boxLines = new THREE.LineSegments(edges, lineMat);
  boxLines.position.copy(pos);
  boxLines.rotation.set(rote.x, rote.y, rote.z);

  scene.add(boxLines);
}

function updateCamera(t) {
  const time = t * 0.1;
  const loopTime = 4 * 1000;
  const p = (time % loopTime) / loopTime;
  const pos = tubeGeo.parameters.path.getPointAt(p);
  const loopAt = tubeGeo.parameters.path.getPointAt((p + 0.03) % 1);
  camera.position.copy(pos);
  camera.lookAt(loopAt);
}

function animate(t = 0) {
  requestAnimationFrame(animate);
  updateCamera(t);
  composer.render(scene, camera);
  controls.update();
}

animate();

function handleWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth / window.innerHeight);
}

window.addEventListener("resize", handleWindowResize, false);
