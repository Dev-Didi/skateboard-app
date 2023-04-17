import {
  connectJoyCon,
  connectedJoyCons,
  JoyConLeft,
  JoyConRight,
  GeneralController,
} from './node_modules/joy-con-webhid/src/index.js';
import "https://code.jquery.com/jquery-3.6.0.min.js"


// get relevant html elements 
const startButton = document.querySelector('#start-button');
const connectButton = document.querySelector('#connect-joy-cons');
const vibrateButton = document.querySelector('#vibrate-joy-cons');
const incrementButton = document.querySelector('#increment-button')

const debugLeft = document.querySelector('#debug-left');
const debugRight = document.querySelector('#debug-right');
const showDebug = document.querySelector('#show-debug');

const startedText = document.querySelector('#start-text');
const scoreText = document.querySelector('#score-text');



// THIS IS THE JOYCON BE CAREFUL
var connected = false;
var userJoyCon = null;
var state = 'STANDING';

// make sure to pass in the joy con you want to rumble
const vibrate = () => {
  userJoyCon.rumble(900,900,0.95);
};

// tell server to increment the score counter 
function incrementCounter() {
  $.get('/increment',{}, function(data) {
    if (data.success) {
      console.log('Counter incremented');
        vibrate();
    };
  });
};


// send startGame signal to server 
const sendStart = () => {
  console.log("start clicked");
  $.get('/startGame'),{},(data) => {
    console.log("start message sent: " + data.success);
  };
};


const checkThreshold = (accelerometer) => {
  const threshold = 0.03;
  if (!accelerometer || !accelerometer.x) {
    return;
  }
  if (Math.abs(accelerometer.z) > threshold) {
    state = 'JUMPING';
    return;
  }
  else {
    state = 'STANDING';
    return;
  }
}

var debounceJump;
const visualize = (joyCon, packet) => {
  if (!packet || !packet.actualOrientation) {
    return;
  }
  const {
    actualAccelerometer: accelerometer,
    actualGyroscope: gyroscope,
    actualOrientation: orientation,
    actualOrientationQuaternion: orientationQuaternion,
  } = packet;

 
  checkThreshold(accelerometer);
  console.log("cur state:" + state)
  if (state == 'JUMPING') {
    clearTimeout(debounceJump)
    debounceJump = setTimeout(() => { // if we are "jumping" for over interval time, increment counter
      incrementCounter();
    },500); 
  }
  

  if (showDebug.checked) {
    const curTime = Date.now()
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

function attachEventListenersToJoyCon(joyCon) {
  console.log("attaching listeners for joy-con")
  if (joyCon.eventListenerAttached) {
    return;
  }
  // vibrateButton.style.visibility = 'visible';
  joyCon.eventListenerAttached = true;
  joyCon.enableVibration().then(() => {
    joyCon.rumble(600,600,0.5)
    joyCon.addEventListener('hidinput', (event) => {
      visualize(joyCon, event.detail);
    });
  });
};


// interval ID's for async functions
var waitForJoyID = null;
var checkForDCID = null;
var updateServiceID = null;

// wait for a joycon to be connected, then do magic
const waitForJoy = async function () {
  if((connectedJoyCons.size) > 0) { // joycon connected
    clearInterval(waitForJoyID);
    connected = true;
    console.log("joycon found. initialising...")
    userJoyCon = connectedJoyCons.values().next()['value']; 
    attachEventListenersToJoyCon(userJoyCon)
    $.get('/connectJoy'),{},(data) => {
      console.log("joy-con connected message sent: " + data.success);
    }
    // start update function
    updateServiceID = setInterval(updateService,1000);
    // we now check for DC 
    checkForDCID = setInterval(checkForDC,1000);
  };
};

// incase joycon gets DC'd, update server and wait again
const checkForDC = async function () {
  if((connectedJoyCons.size) == 0) {
    clearInterval(checkForDCID);
    console.log("Joycon diconnected. Sending signals.")
    $.get('/disconnectJoy'),{},(data) => {
      console.log("joy-con disconnected message sent: " + data.success);
    }
    // we now check for new connection 
    waitForJoyID = setInterval(waitForJoy,1000);
  };
};

// this makes us periodically look for joycons to connect to
waitForJoyID = setInterval(waitForJoy, 2000);

// assign buttons to functions
connectButton.addEventListener('click', connectJoyCon);
incrementButton.addEventListener('click', incrementCounter);
startButton.addEventListener('click', sendStart);
vibrateButton.addEventListener('click',vibrate);

var score = 0;
var gameStarted = false;


// listener for updating oz interface
const updateService = async () => {
    if(!connected) {
        clearInterval(updateServiceID);
    } else {
        $.getJSON('/count', (data) => {
            score = parseInt(data["Counter"]);
            scoreText.innerHTML = score;
        });
        $.getJSON('/start', (data) => {
            if(data['Start'] === 'False') {
                gameStarted = false;
            } else {
                gameStarted = true;
            }
            startedText.innerHTML = 'Started: ' + gameStarted;
        })
    }
}

showDebug.addEventListener('input', (e) => {
  document.querySelector('#debug').style.display = e.target.checked
    ? 'flex'
    : 'none';
});