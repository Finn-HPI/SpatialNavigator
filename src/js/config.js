// Origin (0,0) of local coordinates
const _LatLngOrigin = [52.40684161604002, 13.095645035711499];
let target = [52.408448955333064, 13.095483711103318];
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
