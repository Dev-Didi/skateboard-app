import * as JoyCon from './node_modules/joy-con-webhid/dist/index.js';

let device_list = []
// For the initial pairing of the Joy-Cons. They need to be paired one by one.
// Once paired, Joy-Cons will be reconnected to on future page loads.
window.onload=function(){
  document.querySelector('#connect-button').addEventListener('click', async () => {
    // `JoyCon.connectJoyCon()` handles the initial HID pairing.
    // It keeps track of connected Joy-Cons in the `JoyCon.connectedJoyCons` Map.
    await JoyCon.connectJoyCon();
    devices = JoyCon.connectedJoyCons.values();
    updateDeviceList()
  });
};
// Joy-Cons may sleep until touched and fall asleep again if idle, so attach
// the listener dynamically, but only once.
setInterval(async () => {
  for (const joyCon of JoyCon.connectedJoyCons.values()) {
    if (joyCon.eventListenerAttached) {
      continue;
    }
    // Open the device and enable standard full mode and inertial measurement
    // unit mode, so the Joy-Con activates the gyroscope and accelerometers.
    await joyCon.open();
    await joyCon.enableStandardFullMode();
    await joyCon.enableIMUMode();
    await joyCon.enableVibration();
    // Get information about the connected Joy-Con.
    console.log(await joyCon.getRequestDeviceInfo());
    // Rumble.
    await joyCon.rumble(600, 600, 0.5);
    // Listen for HID input reports.
    joyCon.addEventListener('hidinput', ({ detail }) => {
      // Careful, this fires at ~60fps.
      console.log(`Input report from ${joyCon.device.productName}:`, detail);
    });
    joyCon.eventListenerAttached = true;
  }
}, 2000);

const updateDeviceList = () => {
  document.querySelector('#connected-devices').innerHTML = device_list.map(device=> {
    return `<li>${device.productName}${device.opened ? " (ready)" : ""}</li>`;
  })
  .join("");
};
