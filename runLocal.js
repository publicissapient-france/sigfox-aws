const simpleUplink = require("./simpleUplink.js").handler;
const simpleDownlink = require("./simpleDownlink.js").handler;
const sigfoxBridge = require("./sigfoxBridge.js").handler;

simpleUplink({
    "device": "1C69C",
    "temperature": "25.5",
    "humidity": "40",
    "luminance": "10",
    "time": 1454520570,
    "ack": true
}, {
    succeed: function(){ console.log("succeed")}
});

simpleDownlink({
    "device": "1C69C",
    "temperature": "26.5",
    "humidity": "41",
    "luminance": "20",
    "time": 1454520580,
    "ack": true
}, {
    succeed: function(data){ console.log("succeed :" + JSON.stringify(data, null, 2))}
});

sigfoxBridge({
    "device": "1C69C",
    "temperature": "27.5",
    "humidity": "42",
    "luminance": "30",
    "time": 1454520590,
    "ack": true
}, {
    succeed: function(data){ console.log("succeed :" + JSON.stringify(data, null, 2))}
});
