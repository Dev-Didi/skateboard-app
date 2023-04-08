
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

// vibrateButton.style.visibility = 'hidden';
// startDiv.style.visibility = 'hidden';
// timeDiv.style.visibility = 'hidden';
// scoreDiv.style.visibility = 'hidden';
startButton.disabled = true;

var game = null

const Game = class {
  constructor() {
    this.timeLimit = 60;
    this.currentTime = 0;
    this.score = 0;
    this.active = false;
    this.restart = false;
    scoreText.innerHTML =  this.score;
    timeText.innerHTML = this.time;
    this.scoreSound = new Audio('/audio/trick.wav');
    this.startSound = new Audio('/audio/start.wav');
    this.endSound = new Audio('/audio/end.wav');
    this.startServiceID = null
    this.updateServiceID = null
    this.checkStart(); 
    this.incrementTime = 0;
  }

  play() {
    if (this.updateServiceID) {
      clearInterval(this.updateServiceID);
    }
    timeDiv.style.visibility = 'visible';
    this.active = true;
    this.currentTime = 0;
    this.score = 0;
    this.sendStart();
    this.startSound.play()
    setTimeout(() => {
      this.checkStart();
      this.update();
    },this.startSound.duration*1000);
  };

  listenForStart = async () => {
    console.log("listening for start...");
      $.getJSON('/start', (data) => {
        if (data['Start'] === 'True') {;
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
    if(!this.active || this.restart) {
      clearInterval(this.updateServiceID);
    }
    // get the score 
    
    $.getJSON('/count', (data) => {
      var newScore = parseInt(data["Counter"]);
      if (this.score != newScore) {
        this.scoreSound.play();
        this.score = newScore;
      }
    });
    this.incrementTime++
    if (this.incrementTime == 9) {
      this.currentTime++;
      this.incrementTime = 0;
    }
    if(this.currentTime >= this.timeLimit) {
      this.endGame();
      clearInterval(this.updateServiceID);
    }
    timeText.innerHTML = this.timeLimit - this.currentTime;
    scoreText.innerHTML = this.score;
  }

  async update() {
    this.updateServiceID = setInterval(this.updateService,100);
  }
  

  sendStart() {
    $.get('/startGame'),{},(data) => {
      console.log("start message sent: " + data.success);
    }
  }

  endGame() {
    this.active = false;
    timeDiv.style.visibility = 'hidden';
    this.endSound.play();

  }
}

const initialiseGame = () => {
  console.log("initialising game...");
  game = new Game();
  startButton.disabled = false;
  timeDiv.style.visibility = 'visible';
  scoreDiv.style.visibility = 'visible';

  scoreText.innerHTML = '--';
  timeText.innerHTML = '--';
  console.log("game initialised. Start options shown")
};

var joyConnected = false;

const checkForJoy = async function () {
  $.getJSON('/joyConnected', (data) => {
    console.log("Checking if joycon connected...")
    if (data['Connected'] === 'True') {
      joyConnected = true;
      console.log("joy connected")
      if (!game) {
        initialiseGame();
      };
    } else {
      console.log("joy not connected")
      if (game) {
        if (game.active) {
          game.endGame();
          game = null;
        } else game = null;
      };
    };
  });
};

setInterval (checkForJoy,1000);

startButton.addEventListener('click', (event) => {
  console.log("start clicked");
  game.sendStart();
})
