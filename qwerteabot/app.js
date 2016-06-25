function strip_phone_number(phone) {
	if (typeof(phone) != "string") {return phone;}
	return phone.replace(/^\+/,"").replace(/\s/,"");
}

function populate_users_table(mysql,bot,cb) {
	bot.api.users.list({},function(err,response) {
		if (err) {throw(err);}
		response = response["members"];
		if (response.length == 0) {
			cb();
			return;
		}
		for(var i=0;i < response.length;i++) {
			if (response[i].deleted != true) {
				mysql.query(

					"INSERT INTO `users` (`slackname`,`firstname`,`lastname`,`is_admin`,`is_owner`,`email`,`phone`,`avatar`,`avatar_large`)\
					VALUES(\
					" + mysql.escape(response[i].name) + ",\
					" + mysql.escape(response[i].profile.first_name || null) + ",\
					" + mysql.escape(response[i].profile.last_name || null) + ",\
					" + mysql.escape(response[i].is_admin || false) + ",\
					" + mysql.escape(response[i].is_owner || false) + ",\
					" + mysql.escape(response[i].profile.email) + ",\
					" + mysql.escape(strip_phone_number(response[i].profile.phone) || null) + ",\
					" + mysql.escape(response[i].profile.image_24) + ",\
					" + mysql.escape(response[i].profile.image_192) + ")\
					ON DUPLICATE KEY UPDATE\
					`email`=" + mysql.escape(response[i].profile.email) + ",\
					`is_admin`=" + mysql.escape(response[i].is_admin || false) + ",\
					`is_owner`=" + mysql.escape(response[i].is_owner || false) + ",\
					`firstname`=" + mysql.escape(response[i].profile.first_name || null) + ",\
					`avatar`=" + mysql.escape(response[i].profile.image_24) + ",\
					`avatar_large`=" + mysql.escape(response[i].profile.image_192) + ",\
					`phone`=" + mysql.escape(response[i].profile.phone || null) + ",\
					`lastname`=" + mysql.escape(response[i].profile.last_name || null),

				function(err) {
					if (err) {throw err;}
					if (i == response.length) {
						cb();
					}
				});
			} else {
				mysql.query("DELETE FROM `users` WHERE `slackname`=" + mysql.escape(response[i].name),function(err) {
					if (err) {throw err;}
					if (i == response.length) {
						cb();
					}
				});
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

function getLoginCode(mysql,name,email,id,cb) {
	var logincode = md5(name + email + id + time());
	mysql.query("INSERT INTO `logincodes` (`logincode`,`expires`,`forwhom`) VALUES(" + mysql.escape(logincode) + "," + mysql.escape(time() + 600) + "," + mysql.escape(name) + ") ON DUPLICATE KEY UPDATE `logincode`=" + mysql.escape(logincode) + ", `expires`=" + mysql.escape(time() + 600),function(err,rows) {
		if (err) {throw err;}
		cb(logincode);
	});
}

try {

var Botkit = require("botkit");
var request = require("request");
var fs = require("fs");
var MySQL = require("mysql");
var md5 = require("md5");
var clockwork;
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

	clockwork = require("clockwork")({key:Config.ClockworkAPIKey});

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

							MySQL_Connection.query("DELETE IGNORE FROM `stringvars` WHERE `key_`='tearound'",function(err) {
								if (err) {throw err;}

								populate_users_table(MySQL_Connection,bot,function() {

									var commands = {

										"help": {
											"description": "Displays help for specific commands or all of them.",
											"function"   : function(mysql,bot,message,args) {
												if (args[0]) {
													if (commands[args[0]]) {
														var message_with_attachments = {
															"username": bot.identity.name,
															"text": "Sorry, but that command you need help with doesn't exist! (cAsE sEnSiTiVe) For a list of commands, type \"help\".",
															"icon_emoji": ":x:"
														};
														bot.reply(message,message_with_attachments);
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

													var message_with_attachments = {
														"username": bot.identity.name,
														"text": "```\n" + say.join("\n") + "\n```",
														"icon_emoji": ":information_source:"
													};
													bot.reply(message,message_with_attachments);
												}
											},
										},

										"tea": {
											"description": "Start a tea round!",
											"function"   : function(mysql,bot,message,args) {
												MySQL_Connection.query("SELECT 1 FROM `stringvars` WHERE `key_`='tearound'",function(err,rows) {
													if (err) {throw err;}
													if (rows.length == 0) {
														MySQL_Connection.query("INSERT INTO `stringvars` (`key_`,`value`) VALUES('tearound'," + MySQL_Connection.escape(users_ids[message.user].name + "," + (time() + 300)) + ")",function(err,rows) {
															if (err) {throw err;}
															console.log(rows);
															var message_with_attachments = {
																"username": bot.identity.name,
																"text": "An announcement has been posted in the <#C1JT56JLX|qwertea> channel",
																"icon_emoji": ":tea:"
															};
															bot.reply(message,message_with_attachments);
															updateUsersArrays(function() {
																MySQL_Connection.query("SELECT * FROM `users` WHERE `phone` IS NOT NULL AND `allowsms`=1",function(err,rows) {
																	if (err) {throw err;}
																	for (i=0;i < rows.length;i++) {
																		var is = i;
																		getLoginCode(MySQL_Connection,rows[i].slackname,rows[i].email,users[rows[i].slackname].user,function(logincode) {
																			clockwork.sendSms({ To: strip_phone_number(rows[is].phone), From: "Qwertea", Content: "A tea round has been started by @" + users_ids[message.user].name + ".\nLog in to Slack for more details or click the link below.\n" + Config.url + "?l=" + logincode},function(error,resp) {
																				if (error) {
																					bot.startPrivateConversation(message,function(err,dm) {
																						if (err) {throw err;}
																						var message_with_attachments = {
																							"username": bot.identity.name,
																							"text": "Hey, we just tried to SMS you using your phone number listed on Slack (" + rows[is].phone + ") but unfortunately it didn't work. Please check that your number is correct!",
																							"icon_emoji": ":no_entry_sign:"
																						};
																						dm.say(message_with_attachments);
																					});
																				} else {
																					bot.startPrivateConversation(message,function(err,dm) {
																						if (err) {throw err;}
																						if (resp.responses[0].id == "") {

																						var message_with_attachments = {
																							"username": bot.identity.name,
																							"text": "Hey, we just tried to SMS you using your phone number listed on Slack (" + rows[is].phone + ") but unfortunately it didn't work. Please check that your number is correct!",
																							"icon_emoji": ":no_entry_sign:"
																						};
																						dm.say(message_with_attachments);
																							return;
																						}
																					});
																				}
																			});
																		});
																	}
																});
																bot.say({
																	username: bot.identity.name,
																	text: "<@" + users_ids[message.user].name + "> has started a tea round! \nDirect message me (<@U1K5NCVHA|me>) `order` if you want to place an order.",
																	icon_emoji: ":tea:",
																	channel: channels["qwertea"].id,
																});
															});
														});
													} else {
														var message_with_attachments = {
															"username": bot.identity.name,
															"text": "Sorry if you missed it but there's currently already a tea round going on!",
															"icon_emoji": ":cry:"
														}
														bot.reply(message,message_with_attachments);
													}
												});
											},
										},

										"order": {
											"description": "Place your orders for the current tea round!",
											"function"   : function(mysql,bot,message,args) {
												MySQL_Connection.query("SELECT 1 FROM `stringvars` WHERE `key_`='tearound'",function(err,rows) {
													if (err) {throw err;}
													if (rows.length == 0) {
														var message_with_attachments = {
															"username": bot.identity.name,
															"text": "You can't join a tea round when there isn't even one going on! (Type `help` for more info)",
															"icon_emoji": ":x:"
														}
														bot.reply(message,message_with_attachments);
													} else {
														getLoginCode(MySQL_Connection,users_ids[message.user].name,users_ids[message.user].profile.email,message.user,function(logincode) {
														var message_with_attachments = {
															"username"  : bot.identity.name,
															"text"      : "To place an order, visit <http://qwertea.river.red/shop/|the order page>\nFrom there, you will be instructed on how to place your order\nRemember to make sure that you are logged in!\nIf you aren't already logged in, <" + Config.url + "?l=" + logincode + "|click here> and then re-open the <http://qwertea.river.red/shop/|order page>",
															"icon_emoji": ":information_source:"
														}
														bot.reply(message,message_with_attachments);
														});

													}
											});
										},
											/*	MySQL_Connection.query("SELECT 1 FROM `stringvars` WHERE `key_`='tearound'",function(err,rows) {
													if (err) {throw err;}
													if (rows.length == 0) {
														var message_with_attachments = {
															"username": bot.identity.name,
															"text": "You can't join a tea round when there isn't even one going on! (Type `help` for more info)",
															"icon_emoji": ":x:"
														};
														bot.reply(message,message_with_attachments);
													} else {
												getLoginCode(MySQL_Connection,users_ids[message.user].name,users_ids[message.user].profile.email,message.user,function(logincode) {
												}*/



				/*								MySQL_Connection.query("SELECT 1 FROM `stringvars` WHERE `key_`='tearound'",function(err,rows) {
													if (err) {throw err;}
													if (rows.length == 0) {
														var message_with_attachments = {
															"username": bot.identity.name,
															"text": "You can't join a tea round when there isn't even one going on! (Type `help` for more info)",
															"icon_emoji": ":x:"
														};
														bot.reply(message,message_with_attachments);
													} else {
														MySQL_Connection.query("SELECT * FROM `products` ORDER BY CHAR_LENGTH(`name`)",function(err,products) {
															if (err) {throw err;}

															var nproducts = {};
															for(var i=0;i < products.length;i++) {
																nproducts[products[i].name] = products[i];
																delete(nproducts[products[i].name].name);
															}
															products = nproducts;
															nproducts = undefined;

															bot.startConversation(message,function(err,conversation) {
																if (err) {throw err;}
																var lengths = [];
																var say = [];
																for (var name in products) {
																	lengths.push([name,name.length]);
																}
																lengths.sort(function(a,b) {
																	return a[1] - b[1];
																});
																lengths = lengths.reverse();
																for(var i=0;i < lengths.length;i++) {
																	if (products[lengths[i][0]].price == 1) {
																		say.push(i + (" ").repeat(i.toString().length - lengths.length.toString().length) + ": " + lengths[i][0] + (" ").repeat(lengths[0][0].length - lengths[i][0].length) + ": 1 Point");
																	} else {
																		say.push(i + (" ").repeat(i.toString().length - lengths.length.toString().length) + ": " + lengths[i][0] + (" ").repeat(lengths[0][0].length - lengths[i][0].length) + ": " + products[lengths[i][0]].price + " Points");
																	}
																}

																function placeorder() {

																}

																function order_callback_2() {

																}

																function order_callback_1(lengths,reply) {
																	if (!isNaN(reply.text)) {
																		reply.text = Number(reply.text);
																		if (lengths[reply.text]) {

																			var productid   = reply.text;
																			var productname = lengths[reply.text][0];
																			var productobj  = products[productname];
																			var orders = [];

																			if (productobj.extras != null) {

																				var lengths = [];
																				var say = [];
																				for(var extra_name in productobj.extras) {
																					lengths.push([extra_name,extra_name.length]);
																				}
																				lengths.sort(function(a,b) {
																					return a[1] - b[1];
																				});
																				lengths = lengths.reverse();
																				for(i=0;i < lengths.length;i++) {

																					//console.log(productobj.extras[i]);
																				}

																			} else {
																				placeorder(reply,productid);
																			}

																		} else {
																			conversation.ask({

																				"username"  : bot.identity.name,
																				"text"      : "Invalid product! Please try again or type `cancel`.",
																				"icon_emoji": ":no_entry_sign:",

																			},function(r) {
																				return order_callback_1(lengths,r);
																			});
																		}
																	} else if (reply.text == "cancel") {
																		conversation.say("You're no longer ordering anything.");
																	} else {
																		conversation.ask({

																			"username"  : bot.identity.name,
																			"text"      : "That wasn't a number! Please try again or type `cancel`.",
																			"icon_emoji": ":no_entry_sign:",

																		},function(r) {
																			return order_callback_1(lengths,r);
																		});
																	}
																}
																getLoginCode(MySQL_Connection,users_ids[message.user].name,users_ids[message.user].profile.email,message.user,function(logincode) {
																conversation.ask({

																	"username"  : bot.identity.name,
																	"text"      : "To place an order, visit <http://qwertea.river.red/shop/|the order page>\nFrom there, you will be instructed on how to place your order\nRemember to make sure that you are logged in!\nIf you aren't already logged in, <" + Config.url + "?l=" + logincode + "|click here> and then re-open the <http://qwertea.river.red/shop/|order page>",
																	"icon_emoji": ":information_source:"

																},function(r) {
																	return order_callback_1(lengths,r);
																});
																});
															});

														});
													}
												});
											},
										},*/
										},


										"cancel": {
											"description": "Stops the current tea round.",
											"function"   : function(mysql,bot,message,args) {
												MySQL_Connection.query("SELECT `value` FROM `stringvars` WHERE `key_`='tearound'",function(err,rows) {
													if (err) {throw err;}
													if (rows.length == 0) {
														var message_with_attachments = {
															"username": bot.identity.name,
															"text": "There's not currently a tea round started!",
															"icon_emoji": ":no_entry_sign:"
														};
														bot.reply(message,message_with_attachments);
														return;
													}
													if (rows[0].value.split(",")[0] == users_ids[message.user].name) {
														MySQL_Connection.query("DELETE FROM `stringvars` WHERE `key_`='tearound'",function(err,rows) {
															if (err) {throw err;}
															var message_with_attachments = {
																"username": bot.identity.name,
																"text": "The tea round has been successfully cancelled!",
																"icon_emoji": ":white_check_mark:"
															};
															bot.reply(message,message_with_attachments);
															bot.say({
																username: bot.identity.name,
																text: "<@" + users_ids[message.user].name + "> has cancelled the tea round!",
																icon_emoji: ":tea:",
																channel: channels["qwertea"].id,
															});
														});
													} else {
														var message_with_attachments = {
															"username": bot.identity.name,
															"text": "Error: Only the original tea round creator can cancel a tea round.",
															"icon_emoji": ":no_entry_sign:"
														};
														bot.reply(message,message_with_attachments);
													}
												});
											},
										},

										"login": {
											"description": "Used for logging into the site.",
											"function"   : function(mysql,bot,message,args) {
												getLoginCode(MySQL_Connection,users_ids[message.user].name,users_ids[message.user].profile.email,message.user,function(logincode) {
													var message_with_attachments = {
														"username": bot.identity.name,
														"text": "To log in, <" + Config.url + "?l=" + logincode + "|click here>. This will expire after ten minutes.",
														"icon_emoji": ":bust_in_silhouette:"
													};
													bot.reply(message,message_with_attachments);
												});
											},
										},

										"stats": {
											"description": "Shows your statistics.",
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
																MySQL_Connection.query("SELECT * FROM `users` WHERE `slackname`=" + MySQL_Connection.escape(users_ids[message.user].name),function(err,rows){
																	if (err) {throw(err);}
																	if (rows[0].points == 1) {
																		var message_with_attachments = {
																			"username": bot.identity.name,
																			"text": "You have: 1 point",
																			"icon_emoji": ":joystick:"
																		};
																		bot.reply(message,message_with_attachments);
																	} else {
																		var message_with_attachments = {
																			"username": bot.identity.name,
																			"text": "You have: " + rows[0].points + " points",
																			"icon_emoji": ":joystick:"
																		};
																		bot.reply(message,message_with_attachments);
																	}
																	if (rows[0].drinksmade == 1) {
																		var message_with_attachments = {
																			"username": bot.identity.name,
																			"text": "You have made: 1 drink",
																			"icon_emoji": ":joystick:"
																		};
																		bot.reply(message,message_with_attachments);
																	} else {
																		var message_with_attachments = {
																			"username": bot.identity.name,
																			"text": "You have made: " + rows[0].drinksmade + " drinks",
																			"icon_emoji": ":joystick:"
																		};
																		bot.reply(message,message_with_attachments);
																	}
																	if (rows[0].drinksdrunk == 1) {
																		var message_with_attachments = {
																			"username": bot.identity.name,
																			"text": "You have drunk: 1 drink",
																			"icon_emoji": ":joystick:"
																		};
																		bot.reply(message,message_with_attachments);
																	} else {
																		var message_with_attachments = {
																			"username": bot.identity.name,
																			"text": "You have drunk: " + rows[0].drinksdrunk + " drinks",
																			"icon_emoji": ":joystick:"
																		};
																		bot.reply(message,message_with_attachments);
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
												var message_with_attachments = {
													"username": bot.identity.name,
													"text": (users_ids[message.user].profile.first_name || users_ids[message.user].name) + ", I've started a direct message conversation with you.",
													"icon_emoji": ":speaking_head_in_silhouette:"
												};
												bot.reply(message,message_with_attachments);
												bot.startPrivateConversation(message,function(err,dm) {
													if (err) {throw err;}
													var message_with_attachments = {
														"username": bot.identity.name,
														"text": "Hi, you asked for me?",
														"icon_emoji": ":speaking_head_in_silhouette:"
													};
													dm.say(message_with_attachments);
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

																	if ((longestpoints - 6) < 1) {
																		gen += " Points |";
																	} else {
																		gen += " Points" + (" ").repeat(longestpoints - 6 + 1) + " |";
																	}

																	gen += "\n" + ("=").repeat(2 + 4 + n3 + 3 + 6 + n4 + 2);

																	gen = "```\n" + gen;

																	for(i=0;i < rowsn;i++) {
																		var m = get_name_db(rows[i]);

																		var n1 = longestname - m.length;
																		if (n1 < (4 - m.length)) {
																			n1 = 4 - m.length + 1;
																		}

																		var n2 = longestpoints - rows[i].points.toString().length;
																		if (n2 < (6 - rows[i].points.toString().length)) {
																			n2 = 6 - longestpoints - rows[i].points.toString().length + 1;
																		}

																		gen += "\n| " + m + (" ").repeat(n1) + " | " + rows[i].points + (" ").repeat(n2) + " |";
																	}

																	gen += "\n" + ("=").repeat(2 + 4 + n3 + 3 + 6 + n4 + 2);

																	var message_with_attachments = {
																		"username": bot.identity.name,
																		"text": gen.replace(/\n$/,"") + "\n```",
																		"icon_emoji": ":trophy:"
																	}
																	bot.reply(message,message_with_attachments);
																});
															});
														}
													}
												});
											}
										},

										"avatar": {
											"description": "Displays your profile picture.",
											"function"   : function(mysql,bot,message,args) {
												bot.api.users.list({},function(err,response) {
													if (err) {
														bot.reply(message,"Error with getting your details from the Slack API!");
														return;
													}
													response = response["members"];
													for(var i=0;i < response.length;i++) {
														if (response[i].id == message.user) {
															var message_with_attachments = {
																"username": bot.identity.name,
																"text": "Hey, my profile picture changed! Look familiar?",
																"icon_url": "http://gravatar.com/avatar/" + md5(response[i].profile.email) + "?s=36"
															}
															bot.reply(message,message_with_attachments);
														}
													}
												});
											}
										},

										"cat": {
											"description": "Displays a random cat.",
											"function"   : function(mysql,bot,message,args) {
												request("http://random.cat/meow", function(error, response, body) {
													if (!error && response.statusCode == 200) {
														var result = JSON.parse(body);
													}
													var reply_with_attachments = {
														"username": bot.identity.name,
													    "text": result.file,
														"icon_emoji": ":smiley_cat:"
													};
													bot.reply(message, reply_with_attachments);
												});
											},
										},

										"insult": {
											"description": "Displays a random insult.",
											"function"   : function(mysql,bot,message,args) {
												request("http://quandyfactory.com/insult/json", function(error, response, body) {
													if (!error && response.statusCode == 200) {
														var result = JSON.parse(body);
													}
													var reply_with_attachments = {
														"username": bot.identity.name,
													    "text": result.insult,
														"icon_emoji": ":middle_finger:"
													};
													bot.reply(message, reply_with_attachments);
												});
											},
										},

										"joke": {
											"description": "Displays a random joke.",
											"function"   : function(mysql,bot,message,args) {

												request("http://tambal.azurewebsites.net/joke/random", function(error, response, body) {
													if (!error && response.statusCode == 200) {
														var result = JSON.parse(body);
													}
													var reply_with_attachments = {
														"username": bot.identity.name,
													    "text": result.joke,
														"icon_emoji": ":laughing:"
													};
													bot.reply(message, reply_with_attachments);
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
											var reply_with_attachments = {
												"username": bot.identity.name,
												"text": "Sorry, but that command doesn't exist! (cAsE sEnSiTiVe) For a list of commands, type \"help\".",
												"icon_emoji": ":x:"
											};
											bot.reply(message, reply_with_attachments);
										}
									});
									controller.hears(".*",["ambient"],function(bot,message) {
										if (channels_ids[message.channel].name != "qwertea") {return;}
										var args = message.text.split(" ");
										if (args[0] == "messageme") {
											commands[args[0]].function(MySQL_Connection,bot,message,args.splice(1));
										} else {
											var message_with_attachments = {
												"username": bot.identity.name,
												"text": "Please *don't* use this channel to message the bot. This channel is for announcements, notifications and the `messageme` command.",
												"icon_emoji": ":no_entry_sign:"
											};
											bot.reply(message,message_with_attachments);
										}
									});

								});

							});

						});

					});
				});

			});

		});

	});

});

} catch(err) {

	console.log("\nDISGUSTING LOOP PREVENTED:\n" + err + "\n");
	process.kill(process.pid,"SIGTERM");

}
