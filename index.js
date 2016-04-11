/* Export the following environment variables on local:
 *
 * export AWS_ACCESS_KEY_ID='AKID'
 * export AWS_SECRET_ACCESS_KEY='SECRET'
 */

const pad = require('node-string-pad');
const awsIot = require('aws-iot-device-sdk');
const uuid = require('uuid');
const AWS = require('aws-sdk');
const Promise = require('bluebird');
var fs = require('fs');

var s3 = Promise.promisifyAll(new AWS.S3());


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

    var params = {
        Bucket: 'sigfox-bridge', /* required */
        Key: event.device + '.json', /* required */
    };

    var deviceConnexionData = {};

    s3.getObjectAsync(params).then(function (data) {
        console.log("S3 Body", data.Body.toString());

        deviceConnexionData = JSON.parse(data.Body.toString());

        params = {
            Bucket: 'sigfox-bridge', /* required */
            Key: deviceConnexionData.keyPath, /* required */
        };

        return s3.getObjectAsync(params)
    }).then(function (data) {
        var keyPathFile = "/tmp/" + event.device + "-private.pem.key";
        deviceConnexionData.keyPath = keyPathFile;

        var fd = fs.openSync(keyPathFile, 'w+');
        fs.writeSync(fd, data.Body, 0, data.Body.length, 0);
        fs.closeSync(fd);

        params = {
            Bucket: 'sigfox-bridge', /* required */
            Key: deviceConnexionData.certPath, /* required */
        };

        return s3.getObjectAsync(params)
    }).then(function (data) {
        var certPathFile = "/tmp/" + event.device + "-certificate.pem.crt";
        deviceConnexionData.certPath = certPathFile;

        var fd = fs.openSync(certPathFile, 'w+');
        fs.writeSync(fd, data.Body, 0, data.Body.length, 0);
        fs.closeSync(fd);

        var thingShadows = awsIot.thingShadow(deviceConnexionData);


        // Sigfox response`
        console.log("[processTest]", "Message received", JSON.stringify(event, undefined, 2));
        var response = {};
        response[event.device] = {"noData": true};

        var getShadow = function () {
            console.log("[getShadow]");
            var clientToken = thingShadows.get(deviceConnexionData.clientId);

            thingShadows
                .on('status', function (thingName, stat, clientTokenLocal, stateObject) {
                    if (clientToken == clientTokenLocal) {
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
                        thingShadows.end(function (err) {
                            if (err) {
                                context.fail("[status][end][error]", err.message, " - Stack: ", err.stack);
                            } else {
                                console.log("[status][end][success]");
                                thingShadows.unregister(deviceConnexionData.clientId);
                                context.succeed(response);
                            }
                        });
                    }
                });

        };

        thingShadows
            .on('connect', function () {
                console.log('[thingShadows][connect] Connected to things instance, registering thing name');
                // Only for downlink events
                if (event.ack) {
                    thingShadows.register(deviceConnexionData.clientId, {ignoreDeltas: true, persistentSubscribe: true});
                }

                event.idEvent = uuid.v4();

                console.log("[thingShadows][connect] Publish data to IoT", JSON.stringify(event, undefined, 2));
                thingShadows.publish('data', JSON.stringify(event, undefined, 2)); // TODO: Gérer callback

                if (event.ack) {
                    setTimeout(function () {
                        getShadow();
                    }, 2000);
                } else {
                    thingShadows.end(function (err, data) {
                        if (err) {
                            context.fail("[thingShadows][connect] Error: ", err.message, " - Stack: ", err.stack);
                        } else {
                            context.succeed(response);
                        }
                    });
                }
            });


        /*thingShadows
         .on('close', function () {
         console.log('close');
         });*/
        thingShadows
            .on('reconnect', function () {
                console.log('[thingShadows][reconnect] Reconnecting');
                thingShadows.register(deviceConnexionData.clientId);
            });
        /*thingShadows
         .on('offline', function () {
         console.log('offline');
         });*/
        thingShadows
            .on('error', function (error) {
                console.log('[thingShadows][error]', error);
                context.fail("Error: ", err.message, " - Stack: ", err.stack);
            });
        /*thingShadows
         .on('message', function (topic, payload) {
         console.log('message', topic, payload.toString());
         });

         thingShadows
         .on('delta', function (thingName, stateObject) {
         console.log('delta on ' + thingName + ': ' +
         JSON.stringify(stateObject));
         rgbValues = stateObject.state;
         });*/

        thingShadows
            .on('timeout', function (thingName, clientToken) {
                //TODO
            });

    })
}