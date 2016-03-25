const awsLambdaHandler = require("./simpleUplink.js").handler;

awsLambdaHandler({
    "device": "1C69C",
    "temperature": "25.5",
    "humidity": "40",
    "luminance": "1",
    "time": 1454520570,
    "ack": true
}, {
    succeed: function(){ console.log("succeed")}
});
