let THREE = require("three");

module.exports = class AudioGuide {
  constructor(
    controls,
    current_audio_position,
    final_audio_position,
    listener,
    ping_audio,
    splash_audio
  ) {
    this.current_audio_position = current_audio_position;
    this.final_audio_position = final_audio_position;
    this.controls = controls;
    this.listener = listener;

    this.flight_dist = 10;
    this.ping_dist = 10;
    this.max_audio_dist = 25;

    this.last_ping = -1;
    this.last_audio_move = -1;

    this.ping_audio = ping_audio;
    this.splash_audio = splash_audio;

    this.step_ping = 0;
    this.step_audio = 0;

    this.distance_vector = new THREE.Vector3();
    this.distElement = document.getElementById("distance");
  }

  reset() {
    this.flight_dist = 10;
    this.ping_dist = 10;
    this.max_audio_dist = 25;

    this.last_ping = -1;
    this.last_audio_move = -1;

    this.ping_audio = ping_audio;
    this.splash_audio = splash_audio;

    this.step_ping = 0;
    this.step_audio = 0;
  }

  /**
   * Updates the virtual position of the user and updates audio and pings.
   * @returns the distance to the target
   */
  position_updated(position) {
    const dist = this.controls.targetPosition.distanceTo(
      this.final_audio_position
    );
    // const clamped_dist = Math.max(0, dist - this.flight_dist);

    this.distElement.innerHTML = dist.toFixed(2) + " m";

    this.step_ping = Math.floor(dist / this.ping_dist);
    this.step_audio = Math.floor(dist / this.max_audio_dist);

    this.distance_vector = new THREE.Vector3();
    this.distance_vector
      .copy(this.controls.targetPosition)
      .sub(this.final_audio_position);
    this.distance_vector.normalize();

    this.#audio_update();
    this.#ping_update();

    return dist; // This is done because utils cannot be loaded here.
  }

  #audio_update() {
    // Move bird to next position
    if (this.last_audio_move == -1 || this.step_audio != this.last_audio_move) {
      this.last_audio_move = this.step_audio;
      this.#update_audio_position();
    }
  }

  #update_audio_position() {
    this.distance_vector
      .normalize()
      .multiplyScalar(this.step_audio * this.max_audio_dist);
    var new_pos = new THREE.Vector3();
    new_pos.copy(this.final_audio_position);
    new_pos.add(this.distance_vector);
    this.current_audio_position.set(new_pos.x, new_pos.y, new_pos.z);
  }

  #ping_update() {
    if (this.last_ping == -1) {
      this.last_ping = this.step_ping;
    }
    // play ping sound when passing forward/backward waypoint
    if (this.step_ping < this.last_ping) {
      // moved forward
      this.last_ping = this.step_ping;
      this.#play_sound(this.ping_audio);
    } else if (this.step_ping > this.last_ping) {
      // moved backward
      this.last_ping = this.step_ping;
      this.#play_sound(this.splash_audio);
    }
  }

  #play_sound(audio) {
    const sound = new THREE.Audio(this.listener);
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load(audio, function (buffer) {
      sound.setBuffer(buffer);
      sound.setVolume(0.05);
      sound.play();
    });
  }
};
