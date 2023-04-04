import {
  connectJoyCon,
  connectedJoyCons,
  JoyConLeft,
  JoyConRight,
  GeneralController,
} from './node_modules/joy-con-webhid/src/index.js';

const connectButton = document.querySelector('#connect-joy-cons');
const vibrateButton = document.querySelector('#vibrate-joy-cons');
const startButton = document.querySelector('#start-button');
const debugLeft = document.querySelector('#debug-left');
const debugRight = document.querySelector('#debug-right');
const showDebug = document.querySelector('#show-debug');
const rootStyle = document.documentElement.style;

document.querySelector('#joycon-l').style.visibility = 'hidden';
document.querySelector('#joycon-r').style.visibility = 'hidden';
connectButton.addEventListener('click', connectJoyCon);
vibrateButton.style.visibility = 'hidden';
startButton.style.visibility = 'hidden';



const Game = class {
  constructor() {
    this.timeLimit = 60;
    this.currentTime = 0;
    this.score = 0;
    this.leg = null;
    this.active = false;
    this.restart = false;
    this.incSource = new EventSource('/increment');
    this.incSource.onmessage = function (e) {
      if(!this.active) return;
      this.score = parseInt(e.data); 
      scoreChanged();
    }

    this.startSource = new EventSource('/start');
    this.startSource.onmessage = function (e) {
      if(this.active) {
        this.restart = true;
      }
      else {
        this.play();
      }
    }

  }

  async update() {
    // here update the timer and then the HTML. Check if the game is over.  
  }

  scoreChanged = function() {
    if(!this.active) {
      return
    }
    this.leg.rumble(600,600,0.5);
    // play sound
    var audio = new Audio('media/audio/score.mp3');
    audio.play();
  }

  play() {
    this.active = true;
    this.currentTime = 0;
    this.update();
    }
  }
}


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
    'Orientation: \n' +
      JSON.stringify(orientation, null, 2) +
      '\n' +
    'Orientation Quaternion: \n' + 
      JSON.stringify(orientationQuaternion, null, 2) +
      '\n' +
    'Gyroscope: \n' +
      JSON.stringify(gyroscope, null, 2) +
      '\n' +
    'Accelerometer: \n' +
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

const vibrate = (joyCon) => {
  console.log("in vibrate function")
  joyCon.rumble(600,600,0.5);
}

function attachEventListenersToJoyCon(joyCon) {
  if (joyCon.eventListenerAttached) {
    return;
  }
  vibrateButton.style.visibility = 'visible';
  joyCon.eventListenerAttached = true;
  joyCon.enableVibration().then(() => {
    joyCon.rumble(600,600,0.5)
    joyCon.addEventListener('hidinput', (event) => {
      visualize(joyCon, event.detail);
    });
  });
}

// Joy-Cons may sleep until touched, so attach the listener dynamically.
setInterval(async () => {
  for (const joyCon of connectedJoyCons.values()) {
    attachEventListenersToJoyCon(joyCon);
  }
}, 2000);


vibrateButton.addEventListener('click', (event) => {
  console.log("vibrate clicked");
  for (const joyCon of connectedJoyCons.values())  {
    vibrate(joyCon);
  }
});

showDebug.addEventListener('input', (e) => {
  document.querySelector('#debug').style.display = e.target.checked
    ? 'flex'
    : 'none';
});
