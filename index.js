// import * as JoyCon from './node_modules/dist/index.js';

import {
  connectJoyCon,
  connectedJoyCons,
} from './node_modules/joy-con-webhid/dist/index.js'

const connectButton = document.querySelector('#connect-button');

connectButton.addEventListener('click',connectJoyCon);


// Joy-Cons may sleep until touched and fall asleep again if idle, so attach
// the listener dynamically, but only once.
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

    connectButtonRingCon.onclick = async () => await joyCon.enableRingCon();
  }
}, 2000);
