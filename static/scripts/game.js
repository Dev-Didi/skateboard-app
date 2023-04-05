import {
  connectJoyCon,
  connectedJoyCons,
  JoyConLeft,
  JoyConRight,
  GeneralController,
} from './node_modules/joy-con-webhid/src/index.js';
import "https://code.jquery.com/jquery-3.6.0.min.js"

const connectButton = document.querySelector('#connect-joy-cons');
const vibrateButton = document.querySelector('#vibrate-joy-cons');
const startDiv = document.querySelector('#start-div');
const startButton = document.querySelector('#start-button');
const scoreDiv = document.querySelector('#score-div');
const scoreText = document.querySelector('#score-text');
const timeDiv = document.querySelector('#time-div');
const timeText = document.querySelector('#time-text');
const debugLeft = document.querySelector('#debug-left');
const debugRight = document.querySelector('#debug-right');
const showDebug = document.querySelector('#show-debug');
const rootStyle = document.documentElement.style;

// document.querySelector('#joycon-l').style.visibility = 'hidden';
// document.querySelector('#joycon-r').style.visibility = 'hidden';
connectButton.addEventListener('click', connectJoyCon);
// vibrateButton.style.visibility = 'hidden';
// startDiv.style.visibility = 'hidden';
// timeDiv.style.visibility = 'hidden';
// scoreDiv.style.visibility = 'hidden';
startButton.disabled = true;

var game = null

const Game = class {
  constructor(joyCon) {
    this.timeLimit = 60;
    this.currentTime = 0;
    this.score = 0;
    this.leg = joyCon['value'];
    this.active = false;
    this.restart = false;
    scoreText.innerHTML =  this.score;
    timeText.innerHTML = this.time;
    this.scoreSound = new Audio('/audio/score.mp3');
    this.startServiceID = null
    this.updateServiceID = null
    this.checkStart(); 
  }

  play() {
    if (this.updateServiceID) {
      clearInterval(this.updateServiceID);
    }
    this.active = true;
    this.currentTime = 0;
    this.score = 0;
    this.sendStart();
    scoreDiv.style.visibility = 'visible';
    timeDiv.style.visibility = 'visible';
    this.checkStart();
    this.update();
  };

  listenForStart = async () => {
    console.log("listening for start...");
      // if(this.active) return;
      $.getJSON('/start', (data) => {
        console.log(data);
        console.log(typeof data['Start']);
        if (data['Start'] === 'False') {
          console.log("not starting.");
        } else{
          console.log("start received");
          clearInterval(this.startServiceID);
          this.play();
        }
      });
    }

  async checkStart() {
    this.startServiceID = setInterval (this.listenForStart,1000);
  };

  updateService = async () => {
    console.log("updating... active: " + this.active)
    console.log("score: " + this.score)
    if(!this.active || this.restart) {
      clearInterval(this.updateServiceID);
    }
    // get the score 
    
    $.getJSON('/count', (data) => {
      var newScore = parseInt(data["Counter"]);
      if (this.score != newScore) {
        this.leg.rumble(600*(this.score - newScore),600*(this.score - newScore),0.5);
        this.scoreSound.play();
        this.score = newScore;
      }
    });

    this.currentTime++;
    if(this.currentTime >= this.timeLimit) {
      this.endGame();
      clearInterval(this.updateServiceID);
    }
    timeText.innerHTML = this.timeLimit - this.currentTime;
    scoreText.innerHTML = this.score;
  }

  async update() {
    this.updateServiceID = setInterval(this.updateService,1000);
  }
  

  sendStart() {
    $.get('/startGame'),{},(data) => {
      console.log("start message sent: " + data.success);
    }
  }

  endGame() {
    this.active = false;
    timeDiv.style.visibility = 'hidden';

  }
}

const initialiseGame = (cons) => {
  console.log("initialising game...");
  console.log(cons.values().next())
  game = new Game(cons.values().next());
  startButton.disabled = false;
  timeDiv.style.visibility = 'visible';
  scoreDiv.style.visibility = 'visible';

  scoreText.innerHTML = '--';
  timeText.innerHTML = '--';
  console.log("game initialised. Start options shown")
};

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

  // if (joyCon instanceof JoyConLeft || joyCon instanceof GeneralController) {
  //   document.querySelector('#joycon-l').style.visibility = 'visible';
  // }
  // if (joyCon instanceof JoyConRight || joyCon instanceof GeneralController) {
  //   document.querySelector('#joycon-r').style.visibility = 'visible';
  // }

  // test led and rumble
  // if (buttons.a || buttons.up) {
  //   joyCon.blinkLED(0);
  // }
  // if (buttons.b || buttons.down) {
  //   joyCon.setLED(0);
  // }
  // if (buttons.x || buttons.right) {
  //   joyCon.resetLED(0);
  //   joyCon.rumble(600, 600, 0);
  // }
  // if (buttons.y || buttons.left) {
  //   joyCon.rumble(600, 600, 0.5);
  // }

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
};

// vibrateButton.addEventListener('click', (event) => {
//   console.log("vibrate clicked");
//   for (const joyCon of connectedJoyCons.values())  {
//     vibrate(joyCon);
//   }
// });

startButton.addEventListener('click', (event) => {
  console.log("start clicked");
  game.sendStart();
})

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
}

var intervalID = null

const waitForJoy = async function () {
  for (const joyCon of connectedJoyCons.values()) {
    attachEventListenersToJoyCon(joyCon);
  }
  console.log(connectedJoyCons.size);
  if((connectedJoyCons.size) > 0) {
    clearInterval(intervalID);
    console.log("joycon found. initialising...")
    initialiseGame(connectedJoyCons);
  }
};

// Joy-Cons may sleep until touched, so attach the listener dynamically.
intervalID = setInterval(waitForJoy, 2000);

showDebug.addEventListener('input', (e) => {
  document.querySelector('#debug').style.display = e.target.checked
    ? 'flex'
    : 'none';
});
