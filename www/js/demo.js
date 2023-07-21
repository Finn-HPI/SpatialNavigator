let camera, scene, renderer, light, line, listener, waypoint, sound;

let material1;
let compass = 0;

let analyser1;

const clock = new THREE.Clock();
const YAW_CORRECTION = +90

const _LatLngOrigin = [52.3926785717412, 13.129885611884978]; // Origin (0,0) of local coordinates set in front of Ulf at HPI.

let metersPerLat;
let metersPerLon;

const waypoints = [[52.39265036231587, 13.12909942009715]];
let current_waypoint = 0
let current_waypoint_pos

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
    // console.log(metersPerLat, metersPerLon)
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
    return new THREE.Vector3(xPosition, 2, -zPosition);
}

/**
 * Triggered when the device rotation changes.
 */
function deviceRotationHandler(event) {
    const absolute = event.absolute;
    const alpha = event.alpha;
    const beta = event.beta;
    const gamma = event.gamma;
    compass = -(alpha + beta * gamma / 90);
    compass -= Math.floor(compass / 360) * 360; // Map value to [0, 360]

    // document.getElementById("compass").style.transform = `rotate(${-compass}deg)`;
    // document.getElementById("compassCorrected").style.transform = `rotate(${-(compass + compassCorrection)}deg)`;

    // const debugElement = document.getElementById("deviceRotation");
    // debugElement.innerHTML = `Compass: ${compass.toFixed(2)}, Alpha: ${alpha.toFixed(2)}, corrected: ${(compass + compassCorrection).toFixed(2)}`;
    let q = new Quaternion();
    // console.log(compass - compassCorrection, waypoint.position);
    q.setFromEuler(0, -(compass - compassCorrection) * (Math.PI / 180), 0, "XYZ");
    q.normalize();
    // console.log(e.alpha);
    controls.onRotationChanged(q);
}

document.getElementById("calibrate-btn").addEventListener("click", function () {
    compassCorrection = compass;
});


var last_ping = -1;
var last_bird = -1
var flight_dist = 10
const ping_interval = 10;
const bird_interval = 50;

var waypoint_target_pos = ConvertGPStoUCS(waypoints[0][0], waypoints[0][1]);

/**
 * Triggered when the geolocation updates.
 */
function geolocationUpdated(event) {
    const crd = event.coords;
    const localPos = ConvertGPStoUCS(crd.latitude, crd.longitude);
    controls.onPositionChanged(localPos);

    const dist = controls.targetPosition.distanceTo(current_waypoint_pos);
    const altered_dist = Math.max(0, dist - flight_dist);
    document.getElementById("debug-coordinates").innerHTML = `x: ${controls.targetPosition.x}, y: ${controls.targetPosition.z}, dist: ${dist}`;

    var step_ping = Math.floor(altered_dist / ping_interval);
    var step_bird = Math.floor(altered_dist / bird_interval);

    var distance_vector = new THREE.Vector3();
    distance_vector.copy(controls.targetPosition).sub(current_waypoint_pos);
    console.log("dist", distance_vector);
    distance_vector.normalize();

    // Bird sound movement
    if (last_bird == -1) {
        console.log("initial set");
        last_bird = step_bird;

        distance_vector.multiplyScalar(step_bird * bird_interval);
        var new_pos = new THREE.Vector3(0, 0, 0);
        new_pos.copy(current_waypoint_pos);
        new_pos.add(distance_vector);
        waypoint_target_pos.set(new_pos.x, new_pos.y, new_pos.z);

        console.log("set", distance_vector);
    }
    if (step_bird != last_bird) {
        last_bird = step_bird;

        distance_vector.multiplyScalar(step_bird * bird_interval);
        var new_pos = new THREE.Vector3(0, 0, 0);
        new_pos.copy(current_waypoint_pos);
        new_pos.add(distance_vector);
        waypoint_target_pos.set(new_pos.x, new_pos.y, new_pos.z);
        console.log("set", distance_vector);
    }

    // Ping sound when passing waypoint
    if (last_ping == -1) {
        last_ping = step_ping;
    }
    if (step_ping != last_ping) {
        last_ping = step_ping;
        const sound = new THREE.Audio(listener);
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load('sounds/ping.mp3', function (buffer) {
            sound.setBuffer(buffer);
            sound.setVolume(0.01);
            sound.detune = -step_ping * 1200;
            sound.play();
        });
    }
};

function update(delta) {
    if (waypoint_target_pos) {
        waypoint.position.lerp(waypoint_target_pos, 0.05);
    }
}

/**
 * Handles any error with GPS
 */
function onError(err) {
    console.error(`GPS_ERROR(${err.code}): ${err.message}`);
};

function initThreeScene() {
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);
    let zero_pos = ConvertGPStoUCS(_LatLngOrigin[0], _LatLngOrigin[1]);
    camera.position.set(zero_pos.x, zero_pos.y, zero_pos.z); // Initial position of user (camera) is 0, 0
    listener = new THREE.AudioListener();
    camera.add(listener);

    scene = new THREE.Scene();
    scene.background = new THREE.CubeTextureLoader()
        .setPath('textures/')
        .load([
            'west.png', // +x
            'east.png', // -x
            'up.png', // +y
            'down.png', // -y
            'south.png', // +z
            'north.png' // -z
        ]);
    const light = new THREE.HemisphereLight(0xffffbb, 0x41980a, 1.5);
    scene.add(light);
    const sphere = new THREE.SphereGeometry(2, 32, 16);

    material1 = new THREE.MeshPhongMaterial({ color: 0xffaa00, flatShading: true, shininess: 0 });

    // waypoint sphere sound source
    current_waypoint_pos = ConvertGPStoUCS(waypoints[0][0], waypoints[0][1]);
    // current_waypoint_pos = ConvertGPStoUCS(52.39421780602752, 13.133049949018309);

    waypoint = new THREE.Mesh(sphere, material1);
    waypoint.position.set(current_waypoint_pos.x, current_waypoint_pos.y, current_waypoint_pos.z);
    waypoint.material.depthTest = false;
    waypoint.renderOrder = 2;
    scene.add(waypoint);

    sound = new THREE.PositionalAudio(listener);
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load('sounds/' + main_sound_src, function (buffer) {
        sound.panner.panningModel = "HRTF";
        sound.setBuffer(buffer);
        sound.setRefDistance(10);
        sound.setRolloffFactor(1);
        sound.setLoop(true);
        sound.setVolume(1.0);
        sound.play();
    });
    waypoint.add(sound);

    analyser1 = new THREE.AudioAnalyser(sound, 32);

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
    controls.targetPosition = new THREE.Vector3(0, 2, 0)
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

// var sound_button = document.getElementById("sound-btn");
// sound_button.addEventListener("click", function () {
//     if (sound_button.innerText == "Bird") {
//         sound_button.innerText = "Water"
//         main_sound_src = "water.ogg";
//     } else {
//         sound_button.innerText == "Bird"
//         main_sound_src = "bird.ogg";
//     }
//     waypoint.remove(sound);
//     sound.stop();
//     sound = new THREE.PositionalAudio(listener);
//     const audioLoader = new THREE.AudioLoader();
//     audioLoader.load('sounds/' + main_sound_src, function (buffer) {
//         sound.panner.panningModel = "HRTF";
//         sound.setBuffer(buffer);
//         sound.setRefDistance(10);
//         sound.setRolloffFactor(1);
//         sound.setLoop(true);
//         sound.setVolume(1.0);
//         sound.play();
//     });
//     waypoint.add(sound);
//     console.log(main_sound_src)
// });


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
    update(delta);
    material1.emissive.b = analyser1.getAverageFrequency() / 256;
    renderer.render(scene, camera);
}

document.addEventListener('deviceready', init, false);
