// Setup Map:
var map = L.map("map", { zoomControl: false }).setView([51.163361, 10.447683], 7);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '',
  maxZoom: 18
}).addTo(map);

let marker, accuracyCircle, lat, long, accuracy, circle, featureGroup;
/**
 * Update the map according to the position object.
 */
function displayPosition(event) {
  lat = event.coords.latitude;
  long = event.coords.longitude;
  accuracy = event.coords.accuracy;
  heading = event.coords.heading;

  if (marker) {
    map.removeLayer(marker);
  }

  if (accuracyCircle) {
    map.removeLayer(accuracyCircle);
  }

  marker = L.marker([lat, long]);
  accuracyCircle = L.circle([lat, long], { radius: accuracy });
  featureGroup = L.featureGroup([marker, accuracyCircle]).addTo(map);
  map.fitBounds(featureGroup.getBounds());
}

function error(message) {
  console.error(message);
  document.getElementById("error").innerHTML = message;
}

// Start geolocation watcher
if (!navigator.geolocation) {
  error("Your browser doesn't support geolocation feature!");
} else {
  navigator.geolocation.watchPosition(
    displayPosition,
    (e) => {error(e.message);},
    {maximumAge: 5000, timeout: 5000, enableHighAccuracy: true}
  );
}

addEventListener("resize", (event) => {
    if(!featureGroup) return;
    map.fitBounds(featureGroup.getBounds());
});
