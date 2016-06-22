var Botkit = require('botkit');
var request = require("request");

var controller = Botkit.slackbot();

var options = require("./config");

var bot = controller.spawn(options);
bot.startRTM(function(err, bot, payload) {
	if (err){
		throw new Error("Could not connect to slack! " + err);
	}
});

var channels     = {};
var channels_ids = {}
bot.api.channels.list({},function(err,response) {
	for (var i=0;i < response.channels.length;i++) {
	
		channels[response.channels[i].name] = response.channels[i];
		channels_ids[response.channels[i].id] = response.channels[i];
		
	}
});

var commands = {
	
	"help": {
		"description": "Displays help for specific commands or all of them.",
		"function"   : function(bot,message,args) {
			if (args[0]) {
				if (commands[args[0]]) {
					bot.reply(message,"Sorry, but that command you need help with doesn't exist! (cAsE sEnSiTiVe) For a list of commands, type \"help\".");
				} else {
					if (commands[args[0]].help) {
						bot.reply(message,"Command:\n" + args[0] + "\n\nExtra help:\n\n" + commands[args[0]].help);
					} else {
						bot.reply(message,"Command:\n" + args[0] + "\n\nDescription:\n" + commands[args[0]].description);
					}
				}
			} else {
				var gen = [];
				for (cmd in commands) {
					if (commands.hasOwnProperty(cmd)) {
						gen.push(cmd + " : " + commands[cmd].description);
					}
				}
				bot.reply(message,gen.join("\n") + "\n\nSend me a direct message to use these commands.");
			}
		},
	},

	 
	"cat": {
		"description": "Displays a random cat.",
		"function"   : function(bot,message,args) {
			request("http://random.cat/meow", function(error, response, body) {
    		  if (!error && response.statusCode == 200) {
    		    var result = JSON.parse(body);
    		    bot.api.files.upload(message, result.file);
    		  }
    		});
		},
	},

	"logincode": {
		"description": "Used for logging into the site.",
		"function"   : function() {
			console.log("login code");
		},
	},
	
};

controller.hears(".*",["ambient"],function(bot,message) {
	if (channels_ids[message.channel].name != "qwertea") {return;}
	var args = message.text.split(" ");
	if (args[0] != "help") {
		
	}
	if (commands[args[0]]) {
		commands[args[0]].function(bot,message,args.splice(1));
	} else {
		bot.reply(message,"Sorry, but that command doesn't exist! (cAsE sEnSiTiVe) For a list of commands, type \"help\".\nRemember, if you're sending me commands, pleaase do it in a direct message! This channel is for announcements, alerts and the help command.");
	}
});