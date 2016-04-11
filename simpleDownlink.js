const awsIot = require('aws-iot-device-sdk');
const uuid = require('uuid');
var fs = require('fs');
const pad = require('node-string-pad');

var thingId = "SmartStudio-Raspi";

exports.handler = function (event, context) {
    console.log("[exports.handler] Starting handler");

    processTest(event, context);
};

function ledStateUsingHex(litLeds) {
    var numRepr = 0 | 0;
    for (var i = 0; i < litLeds.length; i++) {
        numRepr |= (1 << litLeds[i] - 1)
    }
    return ("00" + numRepr.toString(16)).slice(-2);
}

function processTest(event, context) {
    console.log("[processTest] Starting");


    var thing = awsIot.thingShadow({
        "keyPath": "./secrets/765a59255d-private.pem.key",
        "certPath": "./secrets/765a59255d-certificate.pem.crt",
        "caPath": "./root-CA.crt",
        "clientId": "SmartStudio-Raspi",
        "region": "eu-west-1"
    });


    // Sigfox response`
    console.log("[processTest]", "Message received", JSON.stringify(event, null, 2));
    var response = {};
    response[event.device] = {"noData": true};

    var getShadow = function () {
        console.log("[getShadow]");
        var clientToken = thing.get(thingId);

        thing
            .on('status', function (thingName, stat, clientTokenLocal, stateObject) {
                if (clientToken == clientTokenLocal) {
                    setTimeout(function () {
                        console.log('[status][state.desired]', JSON.stringify(stateObject.state.desired));
                        var state = [];
                        if (stateObject.state.desired.redLed == 1) {
                            state.push(1);
                        }
                        if (stateObject.state.desired.greenLed == 1) {
                            state.push(2);
                        }
                        if (stateObject.state.desired.blueLed == 1) {
                            state.push(3);
                        }
                        var hex = ledStateUsingHex(state);
                        response[event.device] = {"downlinkData": pad(hex, 16, '0')};
                        console.log('[status] response', response);
                        thing.end(function (err) {
                            if (err) {
                                context.fail("[status][end][error]", err.message, " - Stack: ", err.stack);
                            } else {
                                console.log("[status][end][success]");
                                thing.unregister(thingId);
                                context.succeed(response);
                            }
                        });
                    }, 2000);
                }
            });

    };

    thing
        .on('connect', function () {
            console.log('[thing][connect] Connected to things instance');

            // Only for downlink events
            if (event.ack) {
                thing.register(thingId, {ignoreDeltas: true, persistentSubscribe: true});
            }

            event.idEvent = uuid.v4();

            console.log("[thing][connect] Publish data to IoT", JSON.stringify(event, null, 2));
            thing.publish('data', JSON.stringify(event, undefined, 2));

            if (event.ack) {
                setTimeout(function () {
                    getShadow();
                }, 2000);
            } else {
                thing.end(function (err, data) {
                    if (err) {
                        context.fail("[thingShadows][connect] Error: ", err.message, " - Stack: ", err.stack);
                    } else {
                        context.succeed(response);
                    }
                });
            }

        });

    thing
        .on('reconnect', function () {
            console.log('[thing][reconnect] Reconnecting');
            thing.register(thingId);
        });

    thing
        .on('error', function (error) {
            console.log('[thing][error]', error);
            context.fail("Error: ", err.message, " - Stack: ", err.stack);
        });
}
