import {
  connectJoyCon,
  connectedJoyCons,
  JoyConLeft,
  JoyConRight,
  GeneralController,
} from './node_modules/joy-con-webhid/src/index.js';

const connectButton = document.querySelector('#connect-joy-cons');
const debugLeft = document.querySelector('#debug-left');
const debugRight = document.querySelector('#debug-right');
const showDebug = document.querySelector('#show-debug');
const rootStyle = document.documentElement.style;

document.querySelector('#joycon-l').style.visibility = 'hidden';
document.querySelector('#joycon-r').style.visibility = 'hidden';
connectButton.addEventListener('click', connectJoyCon);

const visualize = (joyCon, packet) => {
  if (!packet || !packet.actualOrientation) {
    return;
  }
  const {
    actualAccelerometer: accelerometer,
    buttonStatus: buttons,
    actualGyroscope: gyroscope,
    actualOrientation: orientation,
    actualOrientationQuaternion: orientationQuaternion,
  } = packet;

  if (joyCon instanceof JoyConLeft || joyCon instanceof GeneralController) {
    document.querySelector('#joycon-l').style.visibility = 'visible';
  }
  if (joyCon instanceof JoyConRight || joyCon instanceof GeneralController) {
    document.querySelector('#joycon-r').style.visibility = 'visible';
  }

  // test led and rumble
  if (buttons.a || buttons.up) {
    joyCon.blinkLED(0);
  }
  if (buttons.b || buttons.down) {
    joyCon.setLED(0);
  }
  if (buttons.x || buttons.right) {
    joyCon.resetLED(0);
    joyCon.rumble(600, 600, 0);
  }
  if (buttons.y || buttons.left) {
    joyCon.rumble(600, 600, 0.5);
  }

  if (showDebug.checked) {
    const controller = joyCon instanceof JoyConLeft ? debugLeft : debugRight;
    controller.querySelector('pre').textContent =
      JSON.stringify(orientation, null, 2) +
      '\n' +
      JSON.stringify(orientationQuaternion, null, 2) +
      '\n' +
      JSON.stringify(gyroscope, null, 2) +
      '\n' +
      JSON.stringify(accelerometer, null, 2) +
      '\n';
    const meterMultiplier = 300;
    controller.querySelector('#acc-x').value =
      accelerometer.x * meterMultiplier;
    controller.querySelector('#acc-y').value =
      accelerometer.y * meterMultiplier;
    controller.querySelector('#acc-z').value =
      accelerometer.z * meterMultiplier;

    const gyroscopeMultiplier = 300;
    controller.querySelector('#gyr-x').value =
      gyroscope.rps.x * gyroscopeMultiplier;
    controller.querySelector('#gyr-y').value =
      gyroscope.rps.y * gyroscopeMultiplier;
    controller.querySelector('#gyr-z').value =
      gyroscope.rps.z * gyroscopeMultiplier;
  }
};


(function () {
  'use strict';
  var currentScore = 0;

  function Runner() {
    if (Runner.instance_) {
      return Runner.instance_;
    }
    
    Runner.instance_ = this;
    that = this;
    this.time = 0;
    this.runningTime = 0;
  }

  Runner.events = {
    KEYDOWN: 'keydown'
  };
  const shouldJump = (accelerometer) => {
    if (!accelerometer || !accelerometer.x) {
      return;
    }
    if (Math.abs(accelerometer.x) > threshold) {
      clearTimeout(debounceKeyDown);
      debounceKeyDown = setTimeout(() => {
        console.log('Jump');
        const event = new Event('keydown');
        document.dispatchEvent(event);
      }, 50);
    }
  };
  Runner.prototype = {
    update: function () {
    },
    init: function () {
      this.startListening();
      this.update();
    },
    startListening: function () {
      document.addEventListener(Runner.events.KEYDOWN, this);
      document.addEventListener(Runner.events.KEYUP, this);
    },
    stopListening: function () {
      document.removeEventListener(Runner.events.KEYDOWN, this);
      document.removeEventListener(Runner.events.KEYUP, this);
    },
    onKeyDown: function (e) {
      if (!this.crashed && Runner.keycodes.JUMP[e.keyCode]) {
        if (!this.Player.jumping) {
          this.Player.startJump(this.currentSpeed);
        }
      }
      if (
        this.crashed) {
          this.restart();
      }
      if (this.activated && !this.crashed && Runner.keycodes.DUCK[e.keyCode]) {
        e.preventDefault();
        if (this.tRex.jumping) {
          this.tRex.setSpeedDrop();
        } else if (!this.tRex.jumping && !this.tRex.ducking) {
          this.tRex.setDuck(true);
        }
      }
    },
    onKeyUp: function (e) {
      var keyCode = String(e.keyCode);
      var isjumpKey =
        Runner.keycodes.JUMP[keyCode] ||
        e.type == Runner.events.TOUCHEND ||
        e.type == Runner.events.MOUSEDOWN;
      if (this.isRunning() && isjumpKey) {
        this.tRex.endJump();
      } else if (Runner.keycodes.DUCK[keyCode]) {
        this.tRex.speedDrop = false;
        this.tRex.setDuck(false);
      } else if (this.crashed) {
        var deltaTime = getTimeStamp() - this.time;
        if (
          Runner.keycodes.RESTART[keyCode] ||
          this.isLeftClickOnCanvas(e) ||
          (deltaTime >= this.config.GAMEOVER_CLEAR_TIME &&
            Runner.keycodes.JUMP[keyCode])
        ) {
          this.restart();
        }
      } else if (this.paused && isjumpKey) {
        this.tRex.reset();
        this.play();
      }
    },
  };
  


  function Player() {
    this.status = Player.status.WAITING;
    this.config = Player.config;
    this.jumping = false;
    this.jumpVelocity = 0;
    this.reachedMinHeight = false;
    this.jumpCount = 0;
    this.init();
  }
  Player.status = {
    CRASHED: 'CRASHED',
    JUMPING: 'JUMPING',
    WAITING: 'WAITING',
  };

  Player.prototype = {
    init: function () {
      this.update(0, Trex.status.WAITING);
    },
    setJumpVelocity: function (setting) {
      this.config.INIITAL_JUMP_VELOCITY = -setting;
      this.config.DROP_VELOCITY = -setting / 2;
    },
    update: function (deltaTime, opt_status) {
      this.timer += deltaTime;
      if (opt_status) {
        this.status = opt_status;
        this.currentFrame = 0;
        this.msPerFrame = Trex.animFrames[opt_status].msPerFrame;
        this.currentAnimFrames = Trex.animFrames[opt_status].frames;
        if (opt_status == Trex.status.WAITING) {
          this.animStartTime = getTimeStamp();
          this.setBlinkDelay();
        }
      }
      if (this.playingIntro && this.xPos < this.config.START_X_POS) {
        this.xPos += Math.round(
          (this.config.START_X_POS / this.config.INTRO_DURATION) * deltaTime,
        );
      }
      if (this.status == Trex.status.WAITING) {
        this.blink(getTimeStamp());
      } else {
        this.draw(this.currentAnimFrames[this.currentFrame], 0);
      }
      if (this.timer >= this.msPerFrame) {
        this.currentFrame =
          this.currentFrame == this.currentAnimFrames.length - 1
            ? 0
            : this.currentFrame + 1;
        this.timer = 0;
      }
      if (this.speedDrop && this.yPos == this.groundYPos) {
        this.speedDrop = false;
        this.setDuck(true);
      }
    },

    startJump: function (speed) {
      if (!this.jumping) {
        this.update(0, Trex.status.JUMPING);
        this.jumpVelocity = this.config.INIITAL_JUMP_VELOCITY - speed / 10;
        this.jumping = true;
        this.reachedMinHeight = false;
        this.speedDrop = false;
      }
    },
    endJump: function () {
      if (
        this.reachedMinHeight &&
        this.jumpVelocity < this.config.DROP_VELOCITY
      ) {
        this.jumpVelocity = this.config.DROP_VELOCITY;
      }
    },
    updateJump: function (deltaTime, speed) {
      var msPerFrame = Trex.animFrames[this.status].msPerFrame;
      var framesElapsed = deltaTime / msPerFrame;
      if (this.speedDrop) {
        this.yPos += Math.round(
          this.jumpVelocity *
            this.config.SPEED_DROP_COEFFICIENT *
            framesElapsed,
        );
      } else {
        this.yPos += Math.round(this.jumpVelocity * framesElapsed);
      }
      this.jumpVelocity += this.config.GRAVITY * framesElapsed;
      if (this.yPos < this.minJumpHeight || this.speedDrop) {
        this.reachedMinHeight = true;
      }
      if (this.yPos < this.config.MAX_JUMP_HEIGHT || this.speedDrop) {
        this.endJump();
      }
      if (this.yPos > this.groundYPos) {
        this.reset();
        this.jumpCount++;
      }
      this.update(deltaTime);
    },
    setSpeedDrop: function () {
      this.speedDrop = true;
      this.jumpVelocity = 1;
    },
    setDuck: function (isDucking) {
      if (isDucking && this.status != Trex.status.DUCKING) {
        this.update(0, Trex.status.DUCKING);
        this.ducking = true;
      } else if (this.status == Trex.status.DUCKING) {
        this.update(0, Trex.status.RUNNING);
        this.ducking = false;
      }
    },
    reset: function () {
      this.yPos = this.groundYPos;
      this.jumpVelocity = 0;
      this.jumping = false;
      this.ducking = false;
      this.update(0, Trex.status.RUNNING);
      this.midair = false;
      this.speedDrop = false;
      this.jumpCount = 0;
    },
  };
  // Joy-Cons may sleep until touched, so attach the listener dynamically.
  setInterval(async () => {
    for (const joyCon of connectedJoyCons.values()) {
      if (joyCon.eventListenerAttached) {
        continue;
      }
      joyCon.eventListenerAttached = true;
      await joyCon.enableVibration();
      joyCon.addEventListener('hidinput', (event) => {
        visualize(joyCon, event.detail);
      });
    }
  }, 2000);
});


showDebug.addEventListener('input', (e) => {
  document.querySelector('#debug').style.display = e.target.checked
    ? 'flex'
    : 'none';
});
