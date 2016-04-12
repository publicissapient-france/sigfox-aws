const awsIot = require('aws-iot-device-sdk');
const uuid = require('uuid');
var fs = require('fs');

var thingId = "SmartStudio-Raspi";

exports.handler = function (event, context) {
    console.log("[exports.handler] Starting handler");

    processTest(event, context);
};

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
    console.log("[processTest]", "Message received", JSON.stringify(event, undefined, 2));
    var response = {};
    response[event.device] = {"noData": true};

    thing
        .on('connect', function () {
            console.log('[thing][connect] Connected to things instance');

            event.idEvent = uuid.v4();

            console.log("[thing][connect] Publish data to IoT", JSON.stringify(event, undefined, 2));
            thing.publish('data', JSON.stringify(event, undefined, 2));


            thing.end(function (err) {
                if (err) {
                    context.fail("[thing][connect] Error: ", err.message, " - Stack: ", err.stack);
                } else {
                    context.succeed(response);
                }
            });

        });

    thing
        .on('reconnect', function () {
            console.log('[thing][reconnect] Reconnecting');
            thing.register(thingId);
        });

    thing
        .on('error', function (error) {
            console.log('[thing][error]', error);
            context.fail("Error: ", error.message, " - Stack: ", error.stack);
        });
}
