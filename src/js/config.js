// Origin (0,0) of local coordinates set in front of Ulf at HPI.
const _LatLngOrigin = [52.39396671415385, 13.132991434383008];
let target = [52.3939660602991, 13.132982200484582];
let debugMode = true;
var use_device_orientation = true;
let calibrate_diff = 0;
let compassCorrection = 0;
let controls;

exports.use_device_orientation = use_device_orientation;
exports._LatLngOrigin = _LatLngOrigin;
exports.controls = controls;
exports.calibrate_diff = calibrate_diff;
exports.compassCorrection = compassCorrection;
exports.target = target;
exports.debugMode = debugMode;
