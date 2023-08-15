import person from "@assets/icons/person.png";
import person_error from "@assets/icons/person_error.png";
import config from "./config";
import * as THREE from "three";

let last_yaw = 0;

function receive_data(data) {
  let input = data.slice(0, 8);
  const view = new Uint16Array(input);
  /** [data]
   * roll = view[0]
   * pitch = view[1]
   * yaw = view[2]
   */
  last_yaw = -view[2];
  let calibrated_yaw = last_yaw - config.calibrate_diff;
  let euler = new THREE.Euler(0, calibrated_yaw * (Math.PI / 180), 0);
  let q = new THREE.Quaternion();
  q.setFromEuler(euler, true);
  q.normalize();

  config.controls.onRotationChanged(q);
}

document.getElementById("calibrate-btn").addEventListener("click", function () {
  config.calibrate_diff = last_yaw;
});

function onDeviceReady() {
  const uuid = "00001101-0000-1000-8000-00805F9B34FB";
  const device_name = "ESP32-Headtracking";

  let icon = new Image();
  icon.src = person_error;
  document.getElementById("img-container").append(icon);

  networking.bluetooth.getDevices(function (devices) {
    console.log(devices);
    for (var i = 0; i < devices.length; i++) {
      if (!devices[i].name.includes(device_name)) {
        continue;
      }
      console.log(devices[i], devices[i].address, uuid);
      networking.bluetooth.connect(
        devices[i].address,
        uuid,
        function (socket_id) {
          networking.bluetooth.onReceive.addListener(function (receiveInfo) {
            if (receiveInfo.socketId !== socket_id) {
              return;
            }
            if (icon.src.includes(person_error)) {
              icon.src = person;
              config.use_device_orientation = false;
            }
            receive_data(receiveInfo.data);
          });

          networking.bluetooth.onReceiveError.addListener(function (errorInfo) {
            if (errorInfo.socketId !== socket_id) {
              return;
            }
            if (icon.src.includes(person)) {
              icon.src = person_error;
            }
            config.use_device_orientation = true;
            console.error(errorInfo.errorMessage);
          });
        },
        function (errorMessage) {
          console.error("Connection failed: " + errorMessage);
        }
      );
    }
  });
}

onDeviceReady();
