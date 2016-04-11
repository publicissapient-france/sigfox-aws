const simpleUplink = require("./simpleUplink.js").handler;
const simpleDownlink = require("./simpleDownlink.js").handler;

simpleUplink({
    "device": "1C69C",
    "temperature": "25.5",
    "humidity": "40",
    "luminance": "1",
    "time": 1454520570,
    "ack": true
}, {
    succeed: function(){ console.log("succeed")}
});

simpleDownlink({
    "device": "1C69C",
    "temperature": "25.5",
    "humidity": "40",
    "luminance": "1",
    "time": 1454520570,
    "ack": true
}, {
    succeed: function(data){ console.log("succeed :" + JSON.stringify(data, null, 2))}
});
