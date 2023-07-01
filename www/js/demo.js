let camera, controls, scene, renderer, light;

let material1, material2, material3;

let analyser1, analyser2, analyser3;

const clock = new THREE.Clock();

let target = new THREE.Vector3(0, 0, 0)

function rotationHandler(e) {
    let yaw = (e.webkitCompassHeading || Math.abs(e.alpha - 360)) * (Math.PI / 180);
    let q = new Quaternion();
    q.setFromEuler(0, -yaw, 0, "XYZ");
    q.normalize();
    controls.onRotationChanged(q);
}

function onSuccess(pos) {
    const crd = pos.coords;
    console.log(crd.latitude, " ", crd.longitude);
};

function onError(err) {
    console.error(`GPS_ERROR(${err.code}): ${err.message}`);
};


function init() {
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set(0, 50, 0);

    const listener = new THREE.AudioListener();
    camera.add(listener);

    scene = new THREE.Scene();
    scene.background = new THREE.CubeTextureLoader()
        .setPath('textures/')
        .load([
            'front.png',
            'back.png',
            'up.png',
            'down.png',
            'left.png',
            'right.png'
        ]);

    // const hemiLight = new THREE.HemisphereLight(0x0000ff, 0x00ff00, 10);
    // scene.add(hemiLight);
    const light = new THREE.HemisphereLight(0xffffbb, 0x41980a, 1.5);
    scene.add(light);
    const sphere = new THREE.SphereGeometry(20, 32, 16);

    material1 = new THREE.MeshPhongMaterial({ color: 0xffaa00, flatShading: true, shininess: 0 });

    // sound spheres

    const mesh1 = new THREE.Mesh(sphere, material1);
    mesh1.position.set(- 250, 30, 0);
    mesh1.material.depthTest = false;
    mesh1.renderOrder = 2;
    scene.add(mesh1);

    const sound1 = new THREE.PositionalAudio(listener);
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load('sounds/demo.ogg', function (buffer) {
        sound1.setBuffer(buffer);
        sound1.setRefDistance(20);
        sound1.play();
    });

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

    const helper = new THREE.GridHelper(1000, 10, 0xffffff, 0xffffff);
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

    controls.movementSpeed = 70;
    controls.lookSpeed = 0.05;

    window.addEventListener('resize', onWindowResize);

    animate();

    window.addEventListener("deviceorientationabsolute", rotationHandler, true);

    const options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
    };
    navigator.geolocation.watchPosition(onSuccess, onError, options)
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
