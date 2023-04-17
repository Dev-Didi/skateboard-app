# skateboard-app

This vanilla js project is designed with the use of joy-con-webhid. 

The purpose of this project is to develop a web application that lets you connect two joy-cons and play a game that tracks "tricks" performed on a skateboard. 

Currently, since webhid is only available on Chromium desktop browsers and electron applications, this application can only be used properly on a desktop/laptop. Currently, you can connect the joycons on your desktop instance, and then connect to the server from a mobile device to control the game through API calls. 

## To-do:
1. Integrate second joy-con and seperate haptic feedback/motion detection between the joy-cons.
2. Clean up api calls e.g. start-game and game-state. 
3. Unhide the connection page (the "oz" page). 
4. Implement and improve further trick detections.
