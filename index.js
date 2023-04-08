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

showDebug.addEventListener('input', (e) => {
  document.querySelector('#debug').style.display = e.target.checked
    ? 'flex'
    : 'none';
});
