let camera, scene, renderer, light;

let material1;

let analyser1;

const clock = new THREE.Clock();
const YAW_CORRECTION = 0

const _LatLngOrigin = [52.39351850009692, 13.131236542297362]; // Origin (0,0) of local coordinates set in front of Ulf at HPI.

let metersPerLat;
let metersPerLon;

function FindMetersPerLat(lat) // Compute lengths of degrees
{
    const m1 = 111132.92;    // latitude calculation term 1
    const m2 = -559.82;        // latitude calculation term 2
    const m3 = 1.175;      // latitude calculation term 3
    const m4 = -0.0023;        // latitude calculation term 4
    const p1 = 111412.84;    // longitude calculation term 1
    const p2 = -93.5;      // longitude calculation term 2
    const p3 = 0.118;      // longitude calculation term 3

    lat = lat * (Math.PI / 180);
    // Calculate the length of a degree of latitude and longitude in meters
    metersPerLat = m1 + (m2 * Math.cos(2 * lat)) + (m3 * Math.cos(4 * lat)) + (m4 * Math.cos(6 * lat));
    metersPerLon = (p1 * Math.cos(lat)) + (p2 * Math.cos(3 * lat)) + (p3 * Math.cos(5 * lat));
    console.log(metersPerLat, metersPerLon)
}

/**
 * Convert given lat and long coordinates to local coordinates used in three.js
 * @param {*} lat - Latitude from device
 * @param {*} lng - Longitude from device
 * @returns THREE.Vector3 with `x` and `z` being the coordinates in the local coordinate system and `y = 2`.
 */
function ConvertGPStoUCS(lat, lng) {
    FindMetersPerLat(_LatLngOrigin[0]);
    const zPosition = metersPerLat * (lat - _LatLngOrigin[0]); //Calc current lat
    const xPosition = metersPerLon * (lng - _LatLngOrigin[1]); //Calc current lat
    return new THREE.Vector3(xPosition, 2, zPosition);
}

/**
 * Triggered when the device rotation changes.
 */
function deviceRotationHandler(e) {
    device_yaw = e.webkitCompassHeading || Math.abs(e.alpha) + YAW_CORRECTION
    device_yaw %= 360;
    let yaw_radians = device_yaw * (Math.PI / 180);
    let q = new Quaternion();
    q.setFromEuler(0, yaw_radians, 0, "XYZ");
    q.normalize();
    // controls.onRotationChanged(q);
}

/**
 * Triggered when the geolocation updates.
 */
function geolocationUpdated(event) {
    const crd = event.coords;
    const localPos = ConvertGPStoUCS(crd.latitude, crd.longitude);
    document.getElementById("debug-coordinates").innerHTML = `x: ${localPos.x}, y: ${localPos.z}`;
    controls.onPositionChanged(localPos);
};

/**
 * Handles any error with GPS
 */
function onError(err) {
    console.error(`GPS_ERROR(${err.code}): ${err.message}`);
};

function initThreeScene() {
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set(0, 2, 0); // Initial position of user (camera) is 0, 0
    const listener = new THREE.AudioListener();
    camera.add(listener);

    scene = new THREE.Scene();
    scene.background = new THREE.CubeTextureLoader()
        .setPath('textures/')
        .load([
            'east.png',
            'west.png',
            'down.png',
            'up.png',
            'north.png',
            'south.png'
        ]);

    // const hemiLight = new THREE.HemisphereLight(0x0000ff, 0x00ff00, 10);
    // scene.add(hemiLight);
    const light = new THREE.HemisphereLight(0xffffbb, 0x41980a, 1.5);
    scene.add(light);
    const sphere = new THREE.SphereGeometry(2, 32, 16);

    material1 = new THREE.MeshPhongMaterial({ color: 0xffaa00, flatShading: true, shininess: 0 });

    // sound spheres
    const mesh1 = new THREE.Mesh(sphere, material1);
    mesh1.position.set = new THREE.Vector3(0, 2, 0);
    mesh1.material.depthTest = false;
    mesh1.renderOrder = 2;
    scene.add(mesh1);

    const sound1 = new THREE.PositionalAudio(listener);
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load('sounds/bird.ogg', function (buffer) {
        sound1.panner.panningModel = "HRTF";
        sound1.setBuffer(buffer);
        sound1.rolloffFactor = 0.5;
        sound1.setRefDistance(1);
        sound1.setLoop(true);
        sound1.play();
    });
    console.log("Panner ", sound1.panner);
    mesh1.add(sound1);

    // analysers

    analyser1 = new THREE.AudioAnalyser(sound1, 32);

    // ground
    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(2000, 2000, 10, 10),
        new THREE.MeshStandardMaterial({
            color: 0x41980a,
        }));
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
    renderer.useLegacyLights = false;

    document.getElementById("home").appendChild(renderer.domElement);

    controls = new FirstPersonControls(camera, renderer.domElement);
    controls.targetPosition = new THREE.Vector3(50, 2, 10)
    controls.movementSpeed = 70;
    controls.lookSpeed = 0.15;
}

/**
 * Initializes the code and listeners.
 */
function init() {
    initThreeScene();
    window.addEventListener('resize', onWindowResize);
    animate();

    // Setup GPS and Rotation handlers
    window.addEventListener("deviceorientationabsolute", deviceRotationHandler, true);
    const options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
    };
    navigator.geolocation.watchPosition(geolocationUpdated, onError, options)
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    controls.handleResize();
}

function animate() {
    requestAnimationFrame(animate);
    render();
}


function render() {
    const delta = clock.getDelta();
    controls.update(delta);
    material1.emissive.b = analyser1.getAverageFrequency() / 256;
    renderer.render(scene, camera);
}

document.addEventListener('deviceready', init, false);
