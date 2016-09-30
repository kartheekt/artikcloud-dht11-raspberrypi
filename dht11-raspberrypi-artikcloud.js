var webSocketUrl = "wss://api.artik.cloud/v1.1/websocket?ack=true";
var device_id = "<Your Device ID>";
var device_token = "<Your Device Token>";

var isWebSocketReady = false;
var ws = null;


var WebSocket = require('ws');
var sensorLib = require('node-dht-sensor');

var dht_sensor = {
    initialize: function () {
        return sensorLib.initialize(11, 4);
    },
    read: function (data) {
        var readout = sensorLib.read();
        var data = readout.temperature;
        console.log('Temperature: ' + readout.temperature.toFixed(2) + 'C, ' +
            'humidity: ' + readout.humidity.toFixed(2) + '%');
        console.log(data);
	setTimeout(function () {
        dht_sensor.read();
        }, 2000);
 		if (!isWebSocketReady){
                console.log("Websocket is not ready. Skip sending data to ARTIK Cloud (data:" + data +")");
                return;
                }
                console.log("Temperature received data:" + data);
                var TemperatureDigitalValue = parseInt(data);
		  var setTemperature = parseInt(data);
                sendData(setTemperature);
        return data;
    }
};

if (dht_sensor.initialize()) {
    dht_sensor.read();
} else {
    console.warn('Failed to initialize sensor');
}


/**
 * Gets the current time in millis
 */
function getTimeMillis(){
    return parseInt(Date.now().toString());
}

/**
 * Create a /websocket device channel connection 
 */
function start() {
    //Create the websocket connection
    isWebSocketReady = false;
    ws = new WebSocket(webSocketUrl);
    ws.on('open', function() {
        console.log("Websocket connection is open ....");
        register();
    });
    ws.on('message', function(data, flags) {
        console.log("Received message: " + data + '\n');
    });
    ws.on('close', function() {
        console.log("Websocket connection is closed ....");
    });
}

/**
 * Sends a register message to the websocket and starts the message flooder
 */
function register(){
    console.log("Registering device on the websocket connection");
    try{
        var registerMessage = '{"type":"register", "sdid":"'+device_id+'", "Authorization":"bearer '+device_token+'", "cid":"'+getTimeMillis()+'"}';
        console.log('Sending register message ' + registerMessage + '\n');
        ws.send(registerMessage, {mask: true});
        isWebSocketReady = true;
    }
    catch (e) {
        console.error('Failed to register messages. Error in registering message: ' + e.toString());
    }   
}

/**
 * Send one message to ARTIK Cloud
 */
function sendData(setTemperature){
    try{
        ts = ', "ts": '+getTimeMillis();
        var data = {
            "setTemperature": setTemperature
        };
        var payload = '{"sdid":"'+device_id+'"'+ts+', "data": '+JSON.stringify(data)+', "cid":"'+getTimeMillis()+'"}';
        console.log('Sending payload ' + payload);
        ws.send(payload, {mask: true});
    } catch (e) {
        console.error('Error in sending a message: ' + e.toString());
    }   
}

/**
 * All start here
 */
start(); // create websocket connection
