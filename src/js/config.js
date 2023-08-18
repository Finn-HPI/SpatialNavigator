// Origin (0,0) of local coordinates
let targets = [
  [52.40684161604002, 13.095645035711499],
  [52.407354336361635, 13.091548386798125],
  [52.408565058828025, 13.092493502311465],
  [52.408448955333064, 13.095483711103318]
];
let targetId = 0;
let debugMode = true;
var use_device_orientation = true;
let calibrate_diff = 0;
let compassCorrection = 0;
let controls;

exports.use_device_orientation = use_device_orientation;
exports.controls = controls;
exports.calibrate_diff = calibrate_diff;
exports.compassCorrection = compassCorrection;
exports.targetId = targetId;
exports.targets = targets;
exports.debugMode = debugMode;
