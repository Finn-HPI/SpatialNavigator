var pos = [52.39382298426837, 13.131691252274432];
var map = L.map('map').setView(pos, 13);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    minZoom: 10,
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var marker = L.marker(pos).addTo(map);
map.setZoom(19);

// create an AudioListener and add it to the camera
let camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);
camera.position.set(0, 25, 0);
const listener = new THREE.AudioListener();
camera.add(listener);

// create the PositionalAudio object (passing in the listener)
const sound = new THREE.PositionalAudio(listener);

// load a sound and set it as the PositionalAudio object's buffer
const audioLoader = new THREE.AudioLoader();
audioLoader.load('sounds/demo.ogg', function (buffer) {
    sound.setBuffer(buffer);
    sound.setRefDistance(20);
    sound.play();
});

// create an object for the sound to play from
const sphere = new THREE.SphereGeometry(20, 32, 16);
const material = new THREE.MeshPhongMaterial({ color: 0xff2200 });
const mesh = new THREE.Mesh(sphere, material);
scene.add(mesh);

// finally add the sound to the mesh
mesh.add(sound);

function onSuccess(position) {
    console.log("pos changed");
    var element = document.getElementById('geolocation');
    pos = [position.coords.latitude, position.coords.longitude];
    console.log('Latitude:', position.coords.latitude, 'Longitude:', position.coords.longitude);
    marker.setLatLng(pos);
    map.setView(pos);
}

function onError(error) {
    console.log('code:', error.code, 'message:', error.message);
}

function changedPos() {
    var watchID = navigator.geolocation.watchPosition(onSuccess, onError, { timeout: 30000 });
}

document.addEventListener('deviceready', changedPos, false);