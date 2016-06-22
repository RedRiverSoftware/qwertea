var Botkit = require("botkit");
var request = require("request");
var fs = require("fs");
var MySQL = require("mysql");
var md5 = require("md5");
var controller = Botkit.slackbot();

function populate_users_table(mysql,bot) {
	bot.api.users.list({},function(err,response) {
		if (err) {throw(err);}
		response = response["members"];
		for(var i=0;i < response.length;i++) {
			if (response[i].deleted != true) {
				mysql.query("INSERT INTO `users` (`slackname`,`is_admin`,`is_owner`) VALUES(" + mysql.escape(response[i].name) + "," + mysql.escape(response[i].is_admin || false) + "," + mysql.escape(response[i].is_owner || false) + ") ON DUPLICATE KEY UPDATE `is_admin`=" + mysql.escape(response[i].is_admin || false) + ", `is_owner`=" + mysql.escape(response[i].is_owner || false));
			} else {
				//mysql.query("DELETE FROM `users` ");
			}
		}
	});
}

fs.readFile("config.json",function(err,Config) {
	if (err) {
		throw new Error("Error with opening the config file. Error:\n" + err);
		return;
	}
	
	try {
		Config = JSON.parse(Config);
	} catch(err) {
		throw new Error("Error with parsing JSON. Is your config file corrupted? Error: " + err.toString());
		return;
	}
	
	var bot = controller.spawn(Config);
	bot.startRTM(function(err,bot,payload) {
		if (err) {
			throw new Error("Could not connect to slack! " + err);
		}
		
		var channels     = {};
		var channels_ids = {}
		bot.api.channels.list({},function(err,response) {
			for (var i=0;i < response.channels.length;i++) {
			
				channels[response.channels[i].name] = response.channels[i];
				channels_ids[response.channels[i].id] = response.channels[i];
				
			}
		
			var MySQL_Connection = MySQL.createConnection({
				host     : Config.mysql.host,
				user     : Config.mysql.username,
				password : Config.mysql.password,
				database : Config.mysql.database,
			});
			MySQL_Connection.connect(function(err) {
				if (err) {
					bot.say({
						text: "Error with connecting to the MySQL database!! Have you installed me correctly? Error:\n" + err,
						channel: channels["qwertea"].id,
					});
					return;
				}
				
				MySQL_Connection.query("SHOW TABLES",function(err,rows) {
					if (err) {throw(err);}
					var found = false;
					for(var i=0;i < rows.length;i++) {
						if (rows[i]["Tables_in_" + Config.mysql.database] == "stringvars") {
							found = true;
						}
					}
					
					if (!found) {
						bot.say({
							text: "Bot not installed correctly. Please use the online installer to set up the MySQL tables.",
							channel: channels["qwertea"].id,
						});
						return;
					}
				
					MySQL_Connection.query("SELECT `value` FROM `stringvars` WHERE `key_`='installed' AND `value`='yes'",function(err,rows) {
						
						if (err) {throw(err);}
						if (rows.length == 0) {
							bot.say({
								text: "Bot not installed correctly. Please use the online installer to set up the MySQL tables.",
								channel: channels["qwertea"].id,
							});
							return;
						}
						
						populate_users_table(MySQL_Connection,bot);
					
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
										bot.reply(message, result.file);
									  }
									});
								},
							},

							"messageme": {
								"description": "Feeling lonely?",
								"function"   : function(bot,message,args) {
										bot.startPrivateConversation(message,function(err,dm) {
											dm.say('Hi, you asked for me?');
										});
									  }
							},

							"mypoints": {
								"description": "Shows how many points you have in your balance",
								"function"   : function(bot,message,args) {
										MySQL_Connection.query('SELECT * FROM employees',function(err,rows){
										  if(err) throw err;
										
										  console.log('Data received from Db:\n');
										  console.log(rows);
										});
									  }
							},

							"avatar": {
								"description": "Displays your profile picture",
								"function"   : function(bot,message,args) {
									bot.api.users.list({},function(err,response) {
										if (err) {
											bot.reply(message,"Error with getting your details from the Slack API!");
											return;
										}
										response = response["members"];
										for(var i=0;i < response.length;i++) {
											if (response[i].id == message.user) {
												bot.reply(message,"http://gravatar.com/avatar/" + md5(response[i].profile.email) + "?s=500");
											}
										}
									});
								}
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
						
						bot.say({
							text   : "Hello world! I'm alive!",
							channel: channels["qwertea"].id,
						});
						
					});
					
				});
				
			});
			
		});
	
	});
	
});