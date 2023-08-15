import * as THREE from "three";

import north from "@assets/textures/north.png";
import east from "@assets/textures/east.png";
import south from "@assets/textures/south.png";
import west from "@assets/textures/west.png";
import up from "@assets/textures/up.png";
import down from "@assets/textures/down.png";

import water_audio from "@assets/sounds/water.ogg";
import ping_audio from "@assets/sounds/ping.mp3";
import splash_audio from "@assets/sounds/water_splash.mp3";

import FirstPersonControls from "./person-controller";
import AudioGuide from "./audio-guide";

import {ConvertGPStoUCS, logValues, logData} from "./utils";
import config from "./config";

let camera, scene, renderer, listener, audio_object, sound;

let material;
let compass = 0;

let analyser;

const clock = new THREE.Clock();

let final_audio_position;
var current_audio_position;

let audio_guide;

/**
 * Triggered when the device rotation changes.
 */
function deviceRotationHandler(event) {
  const absolute = event.absolute;
  const alpha = event.alpha;
  const beta = event.beta;
  const gamma = event.gamma;
  compass = -(alpha + (beta * gamma) / 90);
  compass -= Math.floor(compass / 360) * 360; // Map value to [0, 360]
  let q = new THREE.Quaternion();
  let euler = new THREE.Euler(
    0,
    -(compass - config.compassCorrection) * (Math.PI / 180),
    0
  );
  q.setFromEuler(euler, true);
  q.normalize();
  if (config.use_device_orientation) {
    config.controls.onRotationChanged(q);
  }
}

document.getElementById("calibrate-btn").addEventListener("click", function () {
  config.compassCorrection = compass;
});

// Setup button to load coordinates from clipboard.
document
  .getElementById("loadCoordinates")
  .addEventListener("click", loadCoordinatesFromClipboard);

/**
 * Checks the clipboard for coordinates and takes them as the new target location if they exist
 */
function loadCoordinatesFromClipboard() {
  navigator.clipboard
    .readText()
    .then((clipboardText) => {
      const match = clipboardText.match(
        /^([1-8]?\d(\.\d+)?|90(\.0+)?),\s*(((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/
      );
      if (match) {
        // If clipboard contains coordinates
        const lat = match[1];
        const long = match[4];
        console.log("Successfully loaded from clipboard:", [lat, long]);
        window.alert("Location updated");
        changeTargetPosition(lat, long);
      } else {
        // Warn in console if it doesn't contain coordinates
        console.warn(`Clipboard doesn't contain regex: "${clipboardText}"`);
      }
    })
    .catch((e) => console.warn("Error reading from clipboard:", e));
}

/**
 * Changes the position of the target based on GPS coordinates
 */
function changeTargetPosition(latitude, longitude) {
  config.target = [latitude, longitude];
  const local_coordinates = ConvertGPStoUCS(latitude, longitude);
  final_audio_position = local_coordinates;
}

/**
 * Triggered when the geolocation updates.
 */
function geolocationUpdated(event) {
  const crd = event.coords;
  logValues.lat = crd.latitude;
  logValues.long = crd.longitude;
  const world_position = ConvertGPStoUCS(crd.latitude, crd.longitude);
  logValues.worldPosition = world_position;
  config.controls.onPositionChanged(world_position);
  const dist = audio_guide.position_updated(world_position); // Hacky way to get the distance here
  logValues.dist = dist;
  logData();
}

function update(delta) {
  if (current_audio_position) {
    audio_object.position.lerp(current_audio_position, 0.05);
  }
}

/**
 * Handles any error with GPS
 */
function onError(err) {
  console.error(`GPS_ERROR(${err.code}): ${err.message}`);
}

function initThreeScene() {
  camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    1,
    10000
  );
  let zero_pos = ConvertGPStoUCS(
    config._LatLngOrigin[0],
    config._LatLngOrigin[1]
  );
  camera.position.set(zero_pos.x, zero_pos.y, zero_pos.z); // Initial position of user (camera) is 0, 0
  listener = new THREE.AudioListener();
  camera.add(listener);

  scene = new THREE.Scene();
  scene.background = new THREE.CubeTextureLoader().load([
    west, // +x
    east, // -x
    up, // +y
    down, // -y
    south, // +z
    north, // -z
  ]);
  const light = new THREE.HemisphereLight(0xffffbb, 0x41980a, 1.5);
  scene.add(light);
  const sphere = new THREE.SphereGeometry(2, 32, 16);

  material = new THREE.MeshPhongMaterial({
    color: 0xffaa00,
    flatShading: true,
    shininess: 0,
  });

  final_audio_position = ConvertGPStoUCS(config.target[0], config.target[1]);
  current_audio_position = ConvertGPStoUCS(config.target[0], config.target[1]);

  audio_object = new THREE.Mesh(sphere, material);
  audio_object.position.set(
    final_audio_position.x,
    final_audio_position.y,
    final_audio_position.z
  );
  audio_object.material.depthTest = false;
  audio_object.renderOrder = 2;
  scene.add(audio_object);

  sound = new THREE.PositionalAudio(listener);
  const audioLoader = new THREE.AudioLoader();
  audioLoader.load(water_audio, function (buffer) {
    sound.panner.panningModel = "HRTF";
    sound.setBuffer(buffer);
    sound.setRefDistance(10);
    sound.setRolloffFactor(1);
    sound.setLoop(true);
    sound.setVolume(1.0);
    sound.play();
  });
  audio_object.add(sound);

  analyser = new THREE.AudioAnalyser(sound, 32);

  // ground
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(2000, 2000, 10, 10),
    new THREE.MeshStandardMaterial({
      color: 0x41980a,
    })
  );

  plane.castShadow = false;
  plane.receiveShadow = true;
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = 0.1;
  scene.add(plane);

  const helper = new THREE.GridHelper(1000, 1000, 0xffffff, 0xffffff);
  helper.position.y = 0.1;
  helper.material.depthTest = false;
  helper.renderOrder = 1;
  scene.add(helper);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  document.getElementById("main").appendChild(renderer.domElement);

  config.controls = new FirstPersonControls(camera, renderer.domElement);
  config.controls.targetPosition = new THREE.Vector3(0, 2, 0);
  config.controls.movementSpeed = 70;
  config.controls.lookSpeed = 0.15;

  audio_guide = new AudioGuide(
    config.controls,
    current_audio_position,
    final_audio_position,
    listener,
    ping_audio,
    splash_audio
  );
}
/**
 * Initializes the code and listeners.
 */
function init() {
  initThreeScene();
  window.addEventListener("resize", onWindowResize);
  animate();

  // Setup GPS and Rotation handlers
  window.addEventListener(
    "deviceorientationabsolute",
    deviceRotationHandler,
    true
  );
  const options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0,
  };
  navigator.geolocation.watchPosition(geolocationUpdated, onError, options);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {
  const delta = clock.getDelta();
  config.controls.update(delta);
  update(delta);
  material.emissive.b = analyser.getAverageFrequency() / 256;
  renderer.render(scene, camera);
}

init();
