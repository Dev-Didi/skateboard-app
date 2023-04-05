import {
  connectJoyCon,
  connectedJoyCons,
} from './node_modules/joy-con-webhid/src/index.js';
import "https://code.jquery.com/jquery-3.6.0.min.js"


// get relevant html elements 
const startButton = document.querySelector('#start-button');
const connectButton = document.querySelector('#connect-joy-cons');
const vibrateButton = document.querySelector('#vibrate-joy-cons');
const incrementButton = document.querySelector('#increment-button')

const startedText = document.querySelector('#start-text');
const scoreText = document.querySelector('#score-text');


// THIS IS THE JOYCON BE CAREFUL
var connected = false;
var userJoyCon = null;


// tell server to increment the score counter 
function incrementCounter() {
  $.get('/increment',{}, function(data) {
    if (data.success) {
      console.log('Counter incremented');
        vibrate();
    };
  });
};

// make sure to pass in the joy con you want to rumble
const vibrate = () => {
  userJoyCon.rumble(600,600,0.5);
};

// send startGame signal to server 
const sendStart = () => {
  console.log("start clicked");
  $.get('/startGame'),{},(data) => {
    console.log("start message sent: " + data.success);
  };
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