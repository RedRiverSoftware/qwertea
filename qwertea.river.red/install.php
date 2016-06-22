<?php
	
	require("inc/qwertea.php");
	$GLOBALS["Qwertea"] = new Qwertea();
	
	if (isset($_GET["stage"])) {
		if (!empty($_GET["stage"])) {
			
			if ($_GET["stage"] == "mysql/" || $_GET["stage"] == "mysql") {
				
				$queries = [
				
					"
					
						CREATE TABLE IF NOT EXISTS `points` (
							`who` varchar(255) NOT NULL,
							`points` int(11) NOT NULL,
							PRIMARY KEY (`who`)
						)

					",
					
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
				
				];
				
				foreach($queries as $query) {
					$GLOBALS["Qwertea"] -> Database -> query($query,function($err) {
						header("LOCATION: /error.php?type=Installation MySQL Query&details=" . $err);
					});
				}
				
				header("LOCATION: /install/done/");
				
			}
			
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
				To log in, direct message the bot with the command "/logincode".<br>
				You'll find him in your Slack!
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