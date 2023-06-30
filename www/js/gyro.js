/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

Crc16Tab = [0, 4129, 8258, 12387, 16516, 20645, 24774, 28903, 33032, 37161, 41290,
    45419, 49548, 53677, 57806, 61935, 4657, 528, 12915, 8786, 21173, 17044, 29431, 25302,
    37689, 33560, 45947, 41818, 54205, 50076, 62463, 58334, 9314, 13379, 1056, 5121, 25830,
    29895, 17572, 21637, 42346, 46411, 34088, 38153, 58862, 62927, 50604, 54669, 13907,
    9842, 5649, 1584, 30423, 26358, 22165, 18100, 46939, 42874, 38681, 34616, 63455, 59390,
    55197, 51132, 18628, 22757, 26758, 30887, 2112, 6241, 10242, 14371, 51660, 55789,
    59790, 63919, 35144, 39273, 43274, 47403, 23285, 19156, 31415, 27286, 6769, 2640,
    14899, 10770, 56317, 52188, 64447, 60318, 39801, 35672, 47931, 43802, 27814, 31879,
    19684, 23749, 11298, 15363, 3168, 7233, 60846, 64911, 52716, 56781, 44330, 48395,
    36200, 40265, 32407, 28342, 24277, 20212, 15891, 11826, 7761, 3696, 65439, 61374,
    57309, 53244, 48923, 44858, 40793, 36728, 37256, 33193, 45514, 41451, 53516, 49453,
    61774, 57711, 4224, 161, 12482, 8419, 20484, 16421, 28742, 24679, 33721, 37784, 41979,
    46042, 49981, 54044, 58239, 62302, 689, 4752, 8947, 13010, 16949, 21012, 25207, 29270,
    46570, 42443, 38312, 34185, 62830, 58703, 54572, 50445, 13538, 9411, 5280, 1153, 29798,
    25671, 21540, 17413, 42971, 47098, 34713, 38840, 59231, 63358, 50973, 55100, 9939,
    14066, 1681, 5808, 26199, 30326, 17941, 22068, 55628, 51565, 63758, 59695, 39368,
    35305, 47498, 43435, 22596, 18533, 30726, 26663, 6336, 2273, 14466, 10403, 52093,
    56156, 60223, 64286, 35833, 39896, 43963, 48026, 19061, 23124, 27191, 31254, 2801,
    6864, 10931, 14994, 64814, 60687, 56684, 52557, 48554, 44427, 40424, 36297, 31782,
    27655, 23652, 19525, 15522, 11395, 7392, 3265, 61215, 65342, 53085, 57212, 44955,
    49082, 36825, 40952, 28183, 32310, 20053, 24180, 11923, 16050, 3793, 7920]

function crc16_ccitt(data) {
    let i2 = 0;
    for (let i3 = 0; i3 < data.length; i3++) {
        let out = Crc16Tab[((i2 >> 8) ^ data[i3]) & 255]
        i2 = out ^ (i2 << 8)
    }
    return 65535 & i2
}


class BluetoothService {
    constructor(socket_id, message_callback = NamedNodeMap) {
        // Constants
        this.MSG_SIZE_CRC = 2;
        this.MSG_SIZE_ID = 1;
        this.MSG_SIZE_MARKER = 1;
        this.MSG_SIZE_TYPE = 1;
        this.MSG_SIZE_BYTES = 1;
        this.MSG_SOM_MARKER = 0xFD;
        this.MSG_EOM_MARKER = 0xDD;

        // Member variables
        this.message_cb = message_callback;
        this.socket_id = socket_id;
        this.isDisposing = false;
    }

    receive_data(data) {
        let view_data = new Uint8Array(data);
        if (view_data.length == 0) return;

        if (view_data[0] != this.MSG_SOM_MARKER) {
            console.log("Warning: Invalid SOM received, corrupted message")
            return;
        }

        if (this.message_cb != null)
            this.message_cb(view_data)
    }

    _size(payload_length) {
        return this.MSG_SIZE_ID + payload_length + this.MSG_SIZE_CRC;
    }

    _total_packet_size(payload_length) {
        return this._size(payload_length) + (this.MSG_SIZE_MARKER * 2) + this.MSG_SIZE_TYPE + this.MSG_SIZE_BYTES;
    }

    close() {
        this.isDisposing = true;
        networking.bluetooth.close(this.socket_id);
    }

    send_packet(msg_id, payload, is_response = false, is_fragment = false) {
        let arry_buffer = new ArrayBuffer(this._total_packet_size(payload.length))
        let b = new Uint8Array(arry_buffer);
        b[0] = this.MSG_SOM_MARKER;

        let header_b = 0;
        if (is_fragment)
            header_b = (header_b | 32);

        if (is_response)
            header_b = (header_b | 16);

        b[1] = this._size(payload.length);
        b[2] = header_b;
        b[3] = msg_id;

        for (let i = 0; i < payload.length; ++i) {
            b[4 + i] = payload[i];
        }
        // b[4:4 + payload.length] = payload

        // crc_data = bytearray(this._size(payload.length) - this.MSG_SIZE_CRC);
        let crc_data = new Uint8Array(this._size(payload.length) - this.MSG_SIZE_CRC);
        crc_data[0] = msg_id;
        for (let i = 0; i < payload.length; ++i) {
            crc_data[1 + i] = payload[i];
        }
        // crc_data[1:1 + payload.length] = payload

        let crc16 = crc16_ccitt(crc_data);
        b[payload.length + 4] = crc16 & 255;
        b[payload.length + 5] = (crc16 >> 8) & 255;
        b[payload.length + 6] = this.MSG_EOM_MARKER;
        networking.bluetooth.send(this.socket_id, arry_buffer, function (bytes_sent) {
        }, function (errorMessage) {
            console.log('Send failed: ' + errorMessage);
        });
    }
}

bias = null

class SpatialSensorManager {
    constructor(socket_id, data_callback) {
        this.CID_ATTACH = 0;
        this.CID_DETACH = 1;
        this.CID_ATTACH_ACK = 2;
        this.CID_DETACH_ACK = 3;
        this.CID_KEEP_ALIVE = 4;
        this.CID_WEAR_ON_OFF = 5;

        this.CID_START_GYRO_CAL = 10;
        this.CID_STOP_GYRO_CAL = 11;

        this.DID_BUDGRV = 32;
        this.DID_GYROCAL = 35;
        this.DID_SENSOR_STUCK = 36;
        this.DID_WEAR_OFF = 34;
        this.DID_WEAR_ON = 33;

        this.verbose = true;

        this.MSG_SPATIAL_AUDIO_ENABLE = 124;
        this.MSG_SPATIAL_AUDIO_DATA = 194;
        this.MSG_SPATIAL_AUDIO_CONTROL = 195;

        this.data_cb = data_callback;
        this.timer = null;
        this.service = new BluetoothService(socket_id, this._on_message_received.bind(this));
    }

    attach() {
        this.service.send_packet(this.MSG_SPATIAL_AUDIO_ENABLE, new Uint8Array(1));
        this.service.send_packet(this.MSG_SPATIAL_AUDIO_CONTROL, new Uint8Array(this.CID_ATTACH));
        this.timer = setInterval(this._keep_alive.bind(this), 2000);
    }

    detach() {
        this.service.send_packet(this.MSG_SPATIAL_AUDIO_CONTROL, new Uint8Array(this.CID_DETACH));
        this.service.send_packet(this.MSG_SPATIAL_AUDIO_ENABLE, new Uint8Array(0));
        clearInterval(this.timer);
    }

    start_gyro_cal() {
        console.log("send start gyro cal");
        this.service.send_packet(this.MSG_SPATIAL_AUDIO_CONTROL, new Uint8Array(this.CID_START_GYRO_CAL));
    }

    stop_gyro_cal() {
        console.log("send stop gyro cal");
        this.service.send_packet(this.MSG_SPATIAL_AUDIO_CONTROL, new Uint8Array(this.CID_STOP_GYRO_CAL));
    }

    _keep_alive() {
        this.service.send_packet(this.MSG_SPATIAL_AUDIO_CONTROL, new Uint8Array(this.CID_KEEP_ALIVE));
    }

    _on_message_received(data) {
        if (data[3] == this.MSG_SPATIAL_AUDIO_CONTROL) {
            cid = data[4]
            if (cid == this.CID_ATTACH_ACK)
                console.log("Attach successful (ACK)")
            else if (this.verbose && cid == this.CID_DETACH_ACK)
                console.log("Detach successful (ACK)")
        }
        else if (data[3] == this.MSG_SPATIAL_AUDIO_DATA) {
            let event = data[4]
            if (event == this.DID_SENSOR_STUCK && this.verbose)
                console.log("Warning: Sensor stuck")
            else if (event == this.DID_GYROCAL && this.verbose) {
                // For more information refer to https://github.com/ThePBone/GalaxyBudsClient/blob/master/GalaxyBudsClient/Message/Decoder/SpatialAudioDataParser.cs#L56
                console.log("Received gyro bias info from device");
                console.log(data);
                if (data.length < 6) {
                    console.log("SpatialAudioDataParser.Gyrocal: Invalid gyro bias info received");
                    return;
                }
                console.log("x", data.length);
                const view = new Int16Array(data.slice(0, 6).buffer);
                const iArr = [
                    view[0] / 10000, view[1] / 10000, view[2] / 10000
                ];
                let list = []
                list = list.concat(iArr);
                if (data.length >= 9) {
                    list.push(data[6]);
                    const view2 = new Int16Array(data.slice(7, 9).buffer);
                    list.push(view2[0]);
                    bias = iArr.concat(view2[0] / 10000);
                    console.log(Math.degrees(iArr[0]), Math.degrees(iArr[1]), Math.degrees(iArr[2]));
                    console.log("SpatialAudioDataParser.Gyrocal: Bias:", list);
                } else {
                    console.log("2SpatialAudioDataParser.Gyrocal: Bias:", iArr);
                }

                // GyrocalBias = list.ToArray();
            }
            else if (event == this.DID_BUDGRV) {
                let payload = data.slice(5, data.length - 3);
                let input = payload.slice(0, -1);
                if (input.length == 8) {
                    // console.log(payload);
                    const view = new Int16Array(input.buffer);
                    const quaternion = [
                        view[0] / 10000,
                        view[1] / 10000,
                        view[2] / 10000,
                        view[3] / 10000
                    ];
                    // console.log(quaternion);
                    if (this.data_cb != null) {
                        this.data_cb(quaternion, this);
                    }
                }
            }
        }
    }
}

// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
document.addEventListener('deviceready', onDeviceReady, false);

sensor = null
last_rotations = null
base_rotations = null


last_quarternion = null;
inverted = null

up = null
down = null

yaw_correction = null

Math.degrees = function (radians) {
    return radians * 180 / Math.PI;
}

function euler_from_quaternion(x, y, z, w) {
    const t0 = +2.0 * (w * x + y * z);
    const t1 = +1.0 - 2.0 * (x * x + y * y);
    const roll_x = Math.atan2(t0, t1);

    let t2 = +2.0 * (w * y - z * x);
    t2 = t2 > +1.0 ? +1.0 : t2;
    t2 = t2 < -1.0 ? -1.0 : t2;
    const pitch_y = Math.asin(t2)

    const t3 = +2.0 * (w * z + x * y)
    const t4 = +1.0 - 2.0 * (y * y + z * z)
    const yaw_z = Math.atan2(t3, t4)
    // roll data seems to be switched with yaw of head 
    return { "roll": roll_x, "pitch": pitch_y, "yaw": yaw_z }
}

let last = null

function euler_from_quat(q) {
    let n = Math.hypot(...q);
    let x = Math.atan2(q[3], q[0]) + Math.atan2(-q[1], q[2]);
    let y = 2 * Math.acos(Math.sqrt((q[0] * q[0] + q[3] * q[3])) / n);
    let z = Math.atan2(q[3], q[0]) - Math.atan2(-q[1], q[2]);
    return [x, y, z];
}

function _spatial_sensor_callback(quaternion, sensor_manager) {
    let x = quaternion[0];
    let y = quaternion[1];
    let z = quaternion[2];
    let w = quaternion[3];

    let rot = euler_from_quat([w, x, y, z])
    // if (bias) {
    //     rot[0] -= bias[0];
    //     rot[1] -= bias[1];
    //     rot[2] -= bias[2];
    // }
    const head = document.querySelector("model-viewer#head");
    head.orientation = `${rot[1]}rad ${rot[2]}rad ${rot[0]}rad`;
    // // head.orientation = `${rotations.yaw}rad ${rotations.pitch}rad ${rotations.roll}rad`; //almost correct
    head.updateFraming();

    // // console.log(head.orientation.split(' ').map(x => parseFloat(Math.degrees(x.substring(0, x.length -3)))));
    document.getElementById("roll").innerHTML = (Math.degrees(rot[0]) | 0) + "°";
    document.getElementById("pitch").innerHTML = (Math.degrees(rot[1]) | 0) + "°";
    document.getElementById("yaw").innerHTML = (Math.degrees(rot[2]) | 0) + "°";
}

document.getElementById("calibrate-btn").addEventListener("click", function () {
    console.log("start");
    sensor.start_gyro_cal();
});

document.getElementById("stop-btn").addEventListener("click", function () {
    console.log("stop");
    sensor.stop_gyro_cal();
});

function onDeviceReady() {
    // Cordova is now initialized. Have fun!
    const uuid = '00001101-0000-1000-8000-00805F9B34FB';
    const buds = "Galaxy Buds Pro";

    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);

    networking.bluetooth.getDevices(function (devices) {
        console.log(devices);
        for (var i = 0; i < devices.length; i++) {
            if (!devices[i].name.includes(buds)) {
                continue;
            }
            networking.bluetooth.connect(devices[i].address, uuid, function (socket_id) {
                sensor = new SpatialSensorManager(socket_id, _spatial_sensor_callback);
                sensor.attach();
                networking.bluetooth.onReceive.addListener(function (receiveInfo) {
                    if (receiveInfo.socketId !== socket_id) {
                        return;
                    }
                    sensor.service.receive_data(receiveInfo.data);
                });

                networking.bluetooth.onReceiveError.addListener(function (errorInfo) {
                    if (errorInfo.socketId !== socket_id) {
                        return;
                    }
                    console.log(errorInfo.errorMessage);
                });
            }, function (errorMessage) {
                console.log('Connection failed: ' + errorMessage);
            });
        }
    });
}
