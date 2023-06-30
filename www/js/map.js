var pos = [52.39382298426837, 13.131691252274432];
var map = L.map('map').setView(pos, 13);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    minZoom: 10,
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var marker = L.marker(pos).addTo(map);
map.setZoom(19);

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