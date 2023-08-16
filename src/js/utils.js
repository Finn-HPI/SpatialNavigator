// import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
let fs = require("@capacitor/filesystem");

let metersPerLat;
let metersPerLon;

let THREE = require("three");
let config = require("./config");

let loggingData = [];
let logValues = {
  time: Date.now(),
  timeString: "initial value",
  lat: 0,
  long: 0,
  dist: 0
}

document.getElementById("debug-btn").addEventListener("click", toggleDebugMode);

function toggleDebugMode() {
  const debug = !config.debugMode;
  config.debugMode = debug;
  document.getElementById("debug-icon").className = `fa fa-${debug ? "eye" : "eye-slash"}`;
  document.getElementById("overlay").style = `opacity: ${debug ? 1 : 0}`;
}

function FindMetersPerLat(lat) {
  // Compute lengths of degrees
  const m1 = 111132.92; // latitude calculation term 1
  const m2 = -559.82; // latitude calculation term 2
  const m3 = 1.175; // latitude calculation term 3
  const m4 = -0.0023; // latitude calculation term 4
  const p1 = 111412.84; // longitude calculation term 1
  const p2 = -93.5; // longitude calculation term 2
  const p3 = 0.118; // longitude calculation term 3

  lat = lat * (Math.PI / 180);
  // Calculate the length of a degree of latitude and longitude in meters
  metersPerLat =
    m1 +
    m2 * Math.cos(2 * lat) +
    m3 * Math.cos(4 * lat) +
    m4 * Math.cos(6 * lat);
  metersPerLon =
    p1 * Math.cos(lat) + p2 * Math.cos(3 * lat) + p3 * Math.cos(5 * lat);
}

/**
 * Convert given lat and long coordinates to local coordinates used in three.js
 * @param {*} lat - Latitude from device
 * @param {*} lng - Longitude from device
 * @returns THREE.Vector3 with `x` and `z` being the coordinates in the local coordinate system and `y = 2`.
 */
const ConvertGPStoUCS = (lat, lng) => {
  FindMetersPerLat(config.target[0]);
  const zPosition = metersPerLat * (lat - config.target[0]); //Calc current lat
  const xPosition = metersPerLon * (lng - config.target[1]); //Calc current lat
  return new THREE.Vector3(xPosition, 2, -zPosition);
};

/**
 * Logs the given data for later download
 * @param {*} data - the data to be logged
 */
const logData = () => {
  const time = new Date();
  logValues.time = Date.now();
  logValues.timeString = time.toISOString();
  const data = {
    ...logValues,
    target: config.target
  };
  loggingData.push(data);
}

async function downloadLog() {
  const dataString = JSON.stringify(loggingData, null, 4)
  const time = Date.now();
  const filename = `SpatialNavigator-${time}.json`;
  // downloadDataString(filename, "json", "data"); // Export for online as download
  await fs.Filesystem.writeFile({
    path: filename,
    data: dataString,
    directory: fs.Directory.Documents,
    encoding: fs.Encoding.UTF8,
  });
}

document.getElementById("download-btn").addEventListener("click", downloadLog);

function downloadDataString(dataString, dataFormat, filename) {
  var dataStr = `data:text/${dataFormat};charset=utf-8,` + encodeURIComponent(dataString);
  var downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href",     dataStr);
  downloadAnchorNode.setAttribute("download", `${filename}.${dataFormat}`);
  document.body.appendChild(downloadAnchorNode); // required for firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

module.exports = {
  ConvertGPStoUCS,
  logData,
  logValues,
};
