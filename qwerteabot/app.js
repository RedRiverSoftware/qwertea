function populate_users_table(mysql,bot) {
	bot.api.users.list({},function(err,response) {
		if (err) {throw(err);}
		response = response["members"];
		for(var i=0;i < response.length;i++) {
			if (response[i].deleted != true) {
				mysql.query(

					"INSERT INTO `users` (`slackname`,`firstname`,`lastname`,`is_admin`,`is_owner`,`email`)\
					VALUES(\
					" + mysql.escape(response[i].name) + ",\
					" + mysql.escape(response[i].profile.first_name || null) + ",\
					" + mysql.escape(response[i].profile.last_name || null) + ",\
					" + mysql.escape(response[i].is_admin || false) + ",\
					" + mysql.escape(response[i].is_owner || false) + ",\
					" + mysql.escape(response[i].profile.email) + ")\
					ON DUPLICATE KEY UPDATE\
					`email`=" + mysql.escape(response[i].profile.email) + ",\
					`is_admin`=" + mysql.escape(response[i].is_admin || false) + ",\
					`is_owner`=" + mysql.escape(response[i].is_owner || false) + ",\
					`firstname`=" + mysql.escape(response[i].profile.first_name || null) + ",\
					`lastname`=" + mysql.escape(response[i].profile.last_name || null)

				);
			} else {
				mysql.query("DELETE FROM `users` WHERE `slackname`=" + mysql.escape(response[i].name));
			}
		}
	});
}

function get_name_db(obj) {
	var name = "";
	if (obj.firstname && obj.lastname) {
		name = obj.firstname + " " + obj.lastname + " (@" + obj.slackname + ")";
	} else {
		name = "@" + obj.slackname;
	}
	return name;
}

function time() {
	return Math.round(+new Date() / 1000);
}

try {

var Botkit = require("botkit");
var request = require("request");
var fs = require("fs");
var MySQL = require("mysql");
var md5 = require("md5");
var controller = Botkit.slackbot();

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

		var channels;
		var channels_ids;

		function updateChannelsArrays(cb) {
			channels     = {};
			channels_ids = {};
			bot.api.channels.list({},function(err,response) {
				if (err) {throw err;}
				for (var i=0;i < response.channels.length;i++) {

					channels[response.channels[i].name] = response.channels[i];
					channels_ids[response.channels[i].id] = response.channels[i];

				}
				if (cb) {
					cb();
				}
			});
		}

		updateChannelsArrays(function() {

			var users;
			var users_ids;

			function updateUsersArrays(cb) {
				users     = {};
				users_ids = {};
				bot.api.users.list({},function(err,response) {
					if (err) {throw err;}
					for (var i=0;i < response.members.length;i++) {

						users[response.members[i].name] = response.members[i];
						users_ids[response.members[i].id] = response.members[i];

					}
					if (cb) {
						cb();
					}
				});
			}

			updateUsersArrays(function() {

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
									"function"   : function(mysql,bot,message,args) {
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
											var lengths = [];
											var say = [];
											for (var cmd in commands) {
												lengths.push([cmd,cmd.length]);
											}
											lengths.sort(function(a,b) {
												return a[1] - b[1];
											});
											lengths = lengths.reverse();
											for(var i=0;i < lengths.length;i++) {
												say.push(lengths[i][0] + (" ").repeat(lengths[0][0].length - lengths[i][0].length) + ": " + commands[lengths[i][0]].description);
											}
											bot.reply(message,"```\n" + say.join("\n") + "\n```");
										}
									},
								},

								"tea": {
									"description": "Start a tea round!.",
									"function"   : function(mysql,bot,message,args) {
										bot.reply(message, "Starting a tea round!")
									},
								},

								"logincode": {
									"description": "Used for logging into the site.",
									"function"   : function(mysql,bot,message,args) {
										updateUsersArrays(function() {
											var logincode = md5(users_ids[message.user].name + users_ids[message.user].profile.email + message.user + time());
											mysql.query("INSERT INTO `logincodes` (`logincode`,`expires`,`forwhom`) VALUES(" + mysql.escape(logincode) + "," + mysql.escape(time() + 600) + "," + mysql.escape(users_ids[message.user].name) + ") ON DUPLICATE KEY UPDATE `logincode`=" + mysql.escape(logincode) + ", `expires`=" + mysql.escape(time() + 600),function(err,rows) {
												if (err) {throw err;}
												bot.reply(message,"Your login code is: " + logincode + "\nTo log in, go to \n" + Config.url + " and paste your login code in the box. This code will expire after ten minutes.");
											});
										});
									},
								},

								"mypoints": {
									"description": "Shows how many points you have in your balance",
									"function"   : function(mysql,bot,message,args) {
										bot.api.users.list({},function(err,response) {
											if (err) {
												bot.reply(message,"Error with getting your details from the Slack API!");
												return;
											}
											response = response["members"];
											for(var i=0;i < response.length;i++) {
												if (response[i].id == message.user) {
													updateUsersArrays(function() {
														MySQL_Connection.query("SELECT `points` FROM `users` WHERE `slackname`=" + MySQL_Connection.escape(users_ids[message.user].name),function(err,rows){
															if (err) {throw(err);}
															if (rows[0].points == 1) {
																bot.reply(message,"You have: 1 point");
															} else {
																bot.reply(message,"You have: " + rows[0].points + " points");
															}
														});
													});
												}
											}
										});
									}
								},

								"messageme": {
									"description": "Feeling lonely?",
									"function"   : function(mysql,bot,message,args) {
										bot.reply(message,(users_ids[message.user].profile.first_name || users_ids[message.user].name) + ", I've started a direct message conversation with you.");
										bot.startPrivateConversation(message,function(err,dm) {
											if (err) {throw err;}
											dm.say("Hi, you asked for me?");
										});
									}
								},

								"leaderboard": {
									"description": "Displays a leaderboard so that you can name and shame your colleagues.",
									"function"   : function(mysql,bot,message,args) {
										bot.api.users.list({},function(err,response) {
											if (err) {
												bot.reply(message,"Error with getting your details from the Slack API!");
												return;
											}
											response = response["members"];
											for(var i=0;i < response.length;i++) {
												if (response[i].id == message.user) {
													updateUsersArrays(function() {
														MySQL_Connection.query("SELECT * FROM `users` ORDER BY `points` DESC",function(err,rows) {
															if (err) {throw(err);}

															var gen           = "| Name";
															var rowsn         = 10;

															var longestname   = 0;
															var longestpoints = 0;

															for(var i=0;i < rowsn;i++) {
																if (get_name_db(rows[i]).length > longestname) {
																	longestname = get_name_db(rows[i]).length;
																}
																if (rows[i].points.toString().length > longestpoints) {
																	longestpoints = rows[i].points.toString().length;
																}
															}

															var n3 = longestname - 4;
															if (n3 < 0) {
																n3 = 0;
															}

															var n4 = longestpoints - 6;
															if (n4 < 0) {
																n4 = 0;
															}

															gen = ("=").repeat(2 + 4 + n3 + 3 + 6 + n4 + 2) + "\n" + gen;

															gen += (" ").repeat(longestname - 4) + " |";

															if ((longestpoints - 4) < 1) {
																gen += " Points |";
															} else {
																gen += " Points" + (" ").repeat(longestpoints - 6) + " |";
															}

															gen += "\n" + ("=").repeat(2 + 4 + n3 + 3 + 6 + n4 + 2);

															gen = "```\n" + gen;

															for(var i=0;i < rowsn;i++) {
																var m = get_name_db(rows[i]);

																var n1 = longestname - m.length;
																if (n1 < (4 - m.length)) {
																	n1 = 4 - m.length + 2;
																}

																var n2 = longestpoints - rows[i].points.toString().length;
																if (n2 < (6 - rows[i].points.toString().length)) {
																	n2 = 6 - longestpoints - rows[i].points.toString().length + 2;
																}

																gen += "\n| " + m + (" ").repeat(n1) + " | " + rows[i].points + (" ").repeat(n2) + " |";
															}

															gen += "\n" + ("=").repeat(2 + 4 + n3 + 3 + 6 + n4 + 2);

															bot.reply(message,gen.replace(/\n$/,"") + "\n```");
														});
													});
												}
											}
										});
									}
								},

								"avatar": {
									"description": "Displays your profile picture",
									"function"   : function(mysql,bot,message,args) {
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

								"cat": {
									"description": "Displays a random cat.",
									"function"   : function(mysql,bot,message,args) {
										  var reply_with_attachments = {
										    'text': request("http://random.cat/meow", function(error, response, body) {
													  if (!error && response.statusCode == 200) {
														var result = JSON.parse(body);
													  }
													}),
											    'icon_url': 'http://icons.iconarchive.com/icons/paomedia/small-n-flat/1024/sign-check-icon.png'
										    }
											bot.reply(message, reply_with_attachments);
									},
								},

								"insult": {
									"description": "Displays a random insult.",
									"function"   : function(mysql,bot,message,args) {
										request("http://quandyfactory.com/insult/json", function(error, response, body) {
										  if (!error && response.statusCode == 200) {
											var result = JSON.parse(body);
											bot.reply(message, result.insult);
										  }
										});
									},
								},

								"test": {
									"description": "Test",
									"function"   : function(mysql,bot,message,args) {
										  var reply_with_attachments = {
										    'username': 'Qwertea_Bot' ,
										    'text': 'This is a pre-text',
										    'attachments': [
										      {
										        'fallback': 'To be useful, I need your to invite me in a channel.',
										        'title': 'How can I help you?',
										        'text': 'To be useful, I need your to invite me in a channel ',
										        'color': '#7CD197'
										      }
										    ],
										    'icon_url': 'http://icons.iconarchive.com/icons/paomedia/small-n-flat/1024/sign-check-icon.png'
										    }

										  bot.reply(message, reply_with_attachments);
									}
								},

								"joke": {
									"description": "Displays a random joke.",
									"function"   : function(mysql,bot,message,args) {
										request("http://tambal.azurewebsites.net/joke/random", function(error, response, body) {
										  if (!error && response.statusCode == 200) {
											var result = JSON.parse(body);
											bot.reply(message, result.joke);
										  }
										});
									},
								},

							};

							var events = {

								"team_join": {
									"functions": [
										function() {
											populate_users_table();
										}
									],
								}

							};
							for (event in events) {
								for(var i=0;i < events[event].functions.length;i++) {
									controller.on(event,events[event].functions[i]);
								}
							}

							controller.hears(".*",["direct_message"],function(bot,message) {
								var args = message.text.split(" ");
								if (commands[args[0]]) {
									commands[args[0]].function(MySQL_Connection,bot,message,args.splice(1));
								} else {
									bot.reply(message,"Sorry, but that command doesn't exist! (cAsE sEnSiTiVe) For a list of commands, type \"help\".");
								}
							});
							controller.hears(".*",["ambient"],function(bot,message) {
								if (channels_ids[message.channel].name != "qwertea") {return;}
								var args = message.text.split(" ");
								if (args[0] == "messageme") {
									commands[args[0]].function(MySQL_Connection,bot,message,args.splice(1));
								} else {
									bot.reply(message,"Please *don't* use this channel to message the bot. This channel is for announcements, notifications and the `messageme` command.");
								}
							});

							bot.say({
								channel: channels["qwertea"].id,
								text   : "Hello world! I'm alive!",
							});

						});

					});
				});

			});

		});

	});

});

} catch(err) {

	process.kill(process.pid,"SIGTERM");

}