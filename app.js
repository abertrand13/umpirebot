var express = require("express");
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

var extend = require('extend'); // port of jquery's extend for deep copy

var pg = require('pg');
pg.defaults.ssl = true;

app.set('port', (process.env.PORT || 3000));

var botKey = "";

app.get("/", function(req, res) {
	res.send("Hello World!");
});

app.post("/groupme", function(req, res) {
    if(req.body.group_id == "28104278") {
        botKey = process.env.TEST_BOT_KEY;
    } else if(req.body.group_id == "insertprodhere") {
        botKey = process.env.PROD_BOT_KEY;
    }

    var msg = req.body.text;
    var strikeReg = /.*strike.*/gi;

    if(strikeReg.regex.test(msg)) {
        // someone said strike
        // var nameReg = /.*@
    }
}

// how are you going to do multi-word names?
// this is only for kicking out so you can probably chug ahead and see what happens
// use groups/:group-id/members?
