var express = require("express");
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

var extend = require('extend'); // port of jquery's extend for deep copy
var request = require('request');

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

    if(strikeReg.test(msg)) {
        // someone said strike
        // var nameReg = /.*@
        
        // query for members of group 
        var options = extend(true, {}, optionsTemplate);
        // options.form.bot_id = botKey;
        options.method = 'GET';
        options.url = "https://api.groupme.com/v3/groups/" + req.body.group_id + "?token=" + process.env.ACCESS_TOKEN;
        
        request(options, function(error, response, body) {
            var members = JSON.parse(body).response.members;
            if(!members) {
                // error handling here
            }
            for(var i = 0; i < members.length; i++) {
                if(msg.includes(members[i].nickname)) {
                    // update database accordingly
                    var name = members[i].nickname;
                    var userid = members[i].user_id;
                    var id = members[i].id; // for booting
                    
                    pg.connect(process.env.DATABASE_URL, function(err, client) {
                        if(err) throw err;

                        client.query("INSERT INTO strikes (userid, strikes) values ('" + 
                                userid +
                                "', 1) ON CONFLICT (userid) DO UPDATE SET strikes=strikes.strikes+1 WHERE strikes.userid='" +
                                userid + 
                                "' RETURNING strikes.strikes",
                        function(err, res) {
                            var strikes = res.rows[0].strikes;
                            var strikesReal = strikes % 3 == 0 ? 3 : strikes % 3;

                            sendMessage("STEERIKE " + strikesReal + " for " + name + "! " + (strikesReal == 3 ? "YER OUT!!" : ""));
                            if(strikesReal == 3) {
                                // this means 3 because mod
                                // boot user from group
                                bootMember(req.body.group_id, id);
                            }
                        });
                    });
                    
                }
            }
        });
    }
    
    res.send('Message received');
});

function bootMember(groupid, id) {
    var options = extend(true, {}, optionsTemplate);
    options.url = "https://api.groupme.com/v3/groups/" + groupid + "/members/" + id + "/remove?token=" + process.env.ACCESS_TOKEN;
    request(options);
}

function sendMessage(msg) {
    var options = extend(true, {}, optionsTemplate);
    options.form.bot_id = botKey;
    options.form.text = msg;
    request(options);
}

var headersTemplate = {
	'Content-Type' : 'application/json'	
};

var optionsTemplate = {
	url		: 'https://api.groupme.com/v3/bots/post',
	method	: 'POST',
	headers : headersTemplate,
	form : {}
};



app.listen(app.get('port'), function() {
	console.log("Example app listening on port " + app.get('port') + "!");
});

// how are you going to do multi-word names?
// this is only for kicking out so you can probably chug ahead and see what happens
// use groups/:group-id/members?
