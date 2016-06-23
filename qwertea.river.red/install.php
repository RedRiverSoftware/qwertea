<?php

	require("inc/qwertea.php");
	$GLOBALS["Qwertea"] = new Qwertea([
		"RedirectErrors" => false,
	]);
	if (isset($_GET["stage"])) {
		if (!empty($_GET["stage"])) {

			function do_checks() {
				$cur_config = @file_get_contents("../slack/config.json");
				if (!$cur_config) {
					header("LOCATION: /error.php?type=Installation&details=Couldn't find the Slack bot. Please make sure there is a folder<br>called \"slack\" outside of the website's folder.");
				}
			}

			if (isset($_POST["slacktoken"])) {
				require("inc/config.php");
				$QwerteaConfig = new QwerteaConfig();
				$config = [
					"url"   => "http://" . $_SERVER["HTTP_HOST"] . "/",
					"token" => $_POST["slacktoken"],
					"mysql" => [
						"username"   => $QwerteaConfig -> Config -> User,
						"password"   => $QwerteaConfig -> Config -> Password,
						"database"   => $QwerteaConfig -> Config -> Database,
						"socketPath" => "/var/run/mysqld/mysqld.sock",
					],
				];
				file_put_contents("../slack/config.json",json_encode($config));
				header("LOCATION: /install/done/");
			}

			if ($_GET["stage"] == "mysql/" || $_GET["stage"] == "mysql") {

				do_checks();

				$queries = [

					"

						CREATE TABLE IF NOT EXISTS `ratings` (
							`id` int(11) NOT NULL AUTO_INCREMENT,
							`orderid` int(11) NOT NULL,
							`forwhom` varchar(255) NOT NULL,
							`bywhom` varchar(255) NOT NULL,
							`rating` tinyint(1) NOT NULL,
							PRIMARY KEY (`id`),
							UNIQUE KEY `constraint` (`orderid`,`forwhom`,`bywhom`)
						)

					",

					"

						CREATE TABLE IF NOT EXISTS `products` (
							`id` int(11) NOT NULL AUTO_INCREMENT,
							`name` varchar(255) CHARACTER SET utf8 NOT NULL,
							`price` int(11) NOT NULL,
							`image` varchar(255) NOT NULL,
							`guestallowed` tinyint(1) NOT NULL,
							PRIMARY KEY (`id`)
						)

					",

					"

						CREATE TABLE `orders` (
							`orderid` int(11) NOT NULL AUTO_INCREMENT,
							`fromwhom` varchar(255) NOT NULL,
							`guestorder` tinyint(1) NOT NULL,
							`completed` tinyint(1) NOT NULL,
							`bywhom` varchar(255) NOT NULL,
							`product` int(11) NOT NULL,
							PRIMARY KEY (`orderid`)
						)

					",

					"

						CREATE TABLE `users` (
							`slackname` varchar(255) NOT NULL,
							`points` int(11) NOT NULL,
							`drinksdrank` int(11) NOT NULL,
							`drinksmade` int(11) NOT NULL,
							PRIMARY KEY (`slackname`)
						)

					",

					"

						CREATE TABLE `logincodes` (
							`logincode` varchar(255) NOT NULL,
							`forwhom` varchar(255) NOT NULL,
							`expires` int(11) NOT NULL,
							PRIMARY KEY (`forwhom`)
						)

					",

					"

						CREATE TABLE `stringvars` (
							`key_` varchar(255) NOT NULL,
							`value` varchar(255) NOT NULL,
							PRIMARY KEY (`key_`)
						)

					",

					"INSERT INTO `stringvars` (`key_`,`value`) VALUES('installed','yes')",

				];

				foreach($queries as $query) {
					$GLOBALS["Qwertea"] -> Database -> query($query,function($err) {
						header("LOCATION: /error.php?type=Installation MySQL Query&details=" . $err);
					});
				}

				header("LOCATION: /install/bot/");

			} else if ($_GET["stage"] == "bot/" || $_GET["stage"] == "bot") {

				do_checks(); ?>

				<form method="POST">
					We're going to need you to generate a Slack Custom Bot token for the Slack bot.<br>
					To do this, <a href="https://slack.com/services/bot" target="_blank">click here</a>. You need to be an administrator on your Slack team or above.<br>
					You will be asked to add a username for the bot, this can be whatever you want. All we need is the API Token you'll be shown when the bot is created.<br><br>
					<input type="text" placeholder="Slack Token" name="slacktoken"/>
					<input type="submit" name="slacktoken"/>
				</form>

<?php		}

		}
	}

	ob_start();

?>
<!DOCTYPE html>
<html>
	<head>
		<title>Qwertea || Installation</title>
		<link rel="stylesheet" type="text/css" href="/assets/css/install.css">
		<script type="text/javascript" src="/assets/js/lib/jquery-3.0.0.min.js"></script>
	</head>
	<body>
<?php	if ($_GET["stage"] == "done" || $_GET["stage"] == "done/") { ?>

			<div class="qwertea center vertical full absolute"><div>
				<div id="radial" class="visible"></div>
			</div></div>
			<div class="qwertea center vertical full absolute"><div>
				<h1>All done!</h1>
				To start the bot, SSH into your server and type: qwerteabot start.<br>
				To stop it, type: qwerteabot stop.<br>
				<div class="spacer"></div><br>
				To log in to this website, direct message the bot with the command "logincode".<br>
				You'll find him in your Slack! If you don't, type "messageme" in #qwertea (if it doesn't exist, create it and invite the bot) and the bot will message you instead.
			</div></div>

<?php	} else { ?>

			<div class="qwertea center vertical full absolute"><div>
				<div id="radial"></div>
			</div></div>
			<div class="qwertea center vertical full absolute"><div>
				<a href="/install/mysql/" class="blank"><img id="logo" src="/assets/img/logo.png"/></a>
			</div></div>
			<div id="tip">
				Click the coffee to install.
			</div>

<?php	} ?>
		<script type="text/javascript" src="/assets/js/global.js"></script>
		<script type="text/javascript" src="/assets/js/install.js"></script>
	</body>
</html>
<?php
	ob_end_flush();
?>