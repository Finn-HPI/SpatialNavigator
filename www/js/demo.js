let camera, scene, renderer, light, line, listener, waypoint;

let material1;

let analyser1;

const clock = new THREE.Clock();
const YAW_CORRECTION = +90

const _LatLngOrigin = [52.39351850009692, 13.131236542297362]; // Origin (0,0) of local coordinates set in front of Ulf at HPI.

let metersPerLat;
let metersPerLon;

const waypoints = [[0, 200]];
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
    const absolute = event.absolute;
    const alpha = event.alpha;
    const beta = event.beta;
    const gamma = event.gamma;
    let compass = -(alpha + beta * gamma / 90);
    compass -= Math.floor(compass / 360) * 360;

    device_yaw = compass;
    let yaw_radians = device_yaw * (Math.PI / 180);
    let q = new Quaternion();
    q.setFromEuler(0, yaw_radians, 0, "XYZ");
    q.normalize();
    // console.log(e.alpha);
    // controls.onRotationChanged(q);
}

/**
 * Triggered when the geolocation updates.
 */
function geolocationUpdated(event) {
    // const crd = event.coords;
    // const localPos = ConvertGPStoUCS(crd.latitude, crd.longitude);
    // document.getElementById("debug-coordinates").innerHTML = `x: ${localPos.x.toFixed(2)}, y: ${localPos.z.toFixed(2)}, dist: ${localPos.distanceTo(current_waypoint_pos.toFixed(2))}`;
    // controls.onPositionChanged(localPos);

    // if (localPos.distanceTo(current_waypoint_pos) < 5) { // 5 meter radius
    //     if (current_waypoint_pos < waypoints.length - 1) {
    //         current_waypoint++;
    //         current_waypoint_pos = ConvertGPStoUCS(waypoints[current_waypoint][0], waypoints[current_waypoint][1]);
    //         waypoint.position.set(current_waypoint_pos.x, current_waypoint.y, current_waypoint.z);

    //         // play ping sound
    //         const sound = new THREE.Audio(listener);
    //         const audioLoader = new THREE.AudioLoader();
    //         audioLoader.load('sounds/ping.mp3', function (buffer) {
    //             sound.setBuffer(buffer);
    //             sound.setLoop(true);
    //             sound.setVolume(0.5);
    //             sound.play();
    //         });
    //     } else if (current_waypoint == waypoint.length - 1) {
    //         // play finished sound
    //         const sound = new THREE.Audio(listener);
    //         const audioLoader = new THREE.AudioLoader();
    //         audioLoader.load('sounds/headtracking.mp3', function (buffer) {
    //             sound.setBuffer(buffer);
    //             sound.setLoop(true);
    //             sound.setVolume(0.5);
    //             sound.play();
    //         });
    //     }
    // }
};

var last = -1;
var last_bird = -1
const ping_interval = 10;
const bird_interval = 50;

(function loop() {
    setTimeout(function () {
        controls.targetPosition.x += 1;
        const dist = controls.targetPosition.distanceTo(current_waypoint_pos);
        const altered_dist = Math.max(0, dist - 2);
        document.getElementById("debug-coordinates").innerHTML = `x: ${controls.targetPosition.x}, y: ${controls.targetPosition.z}, dist: ${dist}`;
        var step = Math.floor(altered_dist / ping_interval);
        var step_bird = Math.floor(altered_dist / bird_interval);

        var wtf = new THREE.Vector3();
        wtf.copy(controls.targetPosition).sub(current_waypoint_pos).normalize();
        // console.log(vec);
        if (last_bird == -1) {
            console.log("initial set");
            last_bird = step_bird;

            wtf.multiplyScalar(step_bird * bird_interval);
            var new_pos = new THREE.Vector3(0, 0, 0);
            new_pos.copy(current_waypoint_pos);
            new_pos.add(wtf);
            waypoint.position.set(new_pos.x, new_pos.y, new_pos.z);
            console.log("set", wtf);
        }
        if (step_bird != last_bird) {
            last_bird = step_bird;

            wtf.multiplyScalar(step_bird * bird_interval);
            var new_pos = new THREE.Vector3(0, 0, 0);
            new_pos.copy(current_waypoint_pos);
            new_pos.add(wtf);
            waypoint.position.set(new_pos.x, new_pos.y, new_pos.z);
            console.log("set", wtf);
        }

        if (last == -1) {
            last = step;
        }
        if (step != last) {
            last = step;
            // console.log("ping");
            const sound = new THREE.Audio(listener);
            const audioLoader = new THREE.AudioLoader();
            audioLoader.load('sounds/ping.mp3', function (buffer) {
                sound.setBuffer(buffer);
                // sound.setLoop(true);
                sound.setVolume(0.01);
                sound.detune = -step * 1200;
                sound.play();
            });
        }
        loop()
    }, 200);
}());

/**
 * Handles any error with GPS
 */
function onError(err) {
    console.error(`GPS_ERROR(${err.code}): ${err.message}`);
};

function initThreeScene() {
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set(0, 2, 0); // Initial position of user (camera) is 0, 0
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
    current_waypoint_pos = new THREE.Vector3(200, 2, 0);

    waypoint = new THREE.Mesh(sphere, material1);
    console.log(current_waypoint_pos.x, current_waypoint.y, current_waypoint.z);
    waypoint.position.set(current_waypoint_pos.x, current_waypoint_pos.y, current_waypoint_pos.z);
    waypoint.material.depthTest = false;
    waypoint.renderOrder = 2;
    scene.add(waypoint);

    const sound1 = new THREE.PositionalAudio(listener);
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load('sounds/bird.ogg', function (buffer) {
        sound1.panner.panningModel = "HRTF";
        sound1.setBuffer(buffer);
        sound1.setRefDistance(10);
        sound1.setRolloffFactor(1);
        sound1.setLoop(true);
        sound1.setVolume(1.0);
        sound1.play();
    });
    console.log(sound1.panner.distanceModel, sound1.panner.refDistance, sound1.panner.rolloffFactor);
    waypoint.add(sound1);

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
