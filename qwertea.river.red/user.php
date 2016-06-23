<?php
	@session_start();

	require("inc/qwertea.php");
	$GLOBALS["Qwertea"] = new Qwertea();
	$db = $GLOBALS["Qwertea"] -> Database;

	if (!isset($_SESSION["logincode"])) {
		header("LOCATION: /");
	} else {
		$r = $db -> query("SELECT NULL FROM `logincodes` WHERE `logincode`='" . $db->escape($_SESSION["logincode"]) . "'");
		if ($r -> num_rows == 0) {
			unset($_SESSION["logincode"]);
			unset($_SESSION["slackname"]);
			header("LOCATION: /");
		}
	}

	$wallpapers = array_diff(scandir("assets/img/wallpapers"),["..","."]);
	$wallpaper  = $wallpapers[array_rand($wallpapers)];

	$userinfo = $db -> query("SELECT * FROM `users` WHERE `slackname`='" . $db->escape($_GET["slackname"]) . "'");
	if ($userinfo -> num_rows == 0) {
		header("LOCATION: /");
	} else {
		$userinfo = $userinfo -> fetch_array();
	}

?>
<!DOCTYPE html>
<html>
	<head>
		<title>Qwertea || @<?php echo($userinfo["slackname"]); ?></title>
		<link rel="stylesheet" type="text/css" href="/assets/css/users.css">
		<script type="text/javascript" src="/assets/js/lib/jquery-3.0.0.min.js"></script>
	</head>
	<body>
		<style>
			body {
				background-image: url(/assets/img/wallpapers/<?php echo($wallpaper); ?>);
			}
		</style>
		<div class="qwertea center horizontal vertical full"><div>

			<div id="container">

				<div id="top" class="qwertea center vertical horizontal"><div>

					<img src="http://gravatar.com/avatar/<?php echo(htmlentities(md5($userinfo["email"]))); ?>?s=128" id="avatar"/><br>

					<?php
						if (isset($userinfo["firstname"])) {
							if (isset($userinfo["lastname"])) {
								echo("<div id='name'>" . htmlentities($userinfo["firstname"]) . " " . htmlentities($userinfo["lastname"]) . "</div>");
							}
						}
					?>

					<a href="https://rrsoftware.slack.com/messages/@<?php echo(htmlentities($userinfo["slackname"])); ?>/details">@<?php echo($userinfo["slackname"]); ?></a>

				</div></div>

				<div id="bottom">

					<table id="detailstable">

						<tr <?php
							if (intval($userinfo["points"]) >= 0) {
								echo("style='background-color:rgba(0,255,0,.1)'");
							} else if (intval($userinfo["points"]) < 0) {
								echo("style='background-color:rgba(255,0,0,.1)'");
							}
						?>>
							<td>Points</td>
							<td><?php echo(htmlentities($userinfo["points"])); ?></td>
						</tr>

						<tr <?php
							if (intval($userinfo["drinksdrunk"]) > intval($userinfo["drinksmade"])) {
								echo("style='background-color:rgba(255,0,0,.1)'");
							}
						?>>
							<td>Drinks Made</td>
							<td><?php echo(htmlentities($userinfo["drinksmade"])); ?></td>
						</tr>

						<tr <?php
							if (intval($userinfo["drinksdrunk"]) > intval($userinfo["drinksmade"])) {
								echo("style='background-color:rgba(255,0,0,.1)'");
							}
						?>>
							<td>Drinks Drunk</td>
							<td><?php echo(htmlentities($userinfo["drinksdrunk"])); ?></td>
						</tr>

					</table>

				</div>

			</div>

		</div>
	</body>
</html>