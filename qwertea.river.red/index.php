<?php
	@session_start();

	require("inc/qwertea.php");
	$GLOBALS["Qwertea"] = new Qwertea();
	$db = $GLOBALS["Qwertea"] -> Database;

	function redirect() {
		global $db;
		$r = $db -> query("SELECT `value` FROM `stringvars` WHERE `key_`='teamaker'");
		if ($r -> num_rows == 0) {
			die('<meta http-equiv="refresh" content="0;URL=/users/' . $_SESSION["slackname"] . '/">');
		} else {
			die('<meta http-equiv="refresh" content="0;URL=/shop/>');
		}
	}

	if (isset($_SESSION["logincode"])) {
		redirect();
	}

	if (isset($_POST["login"]) && isset($_POST["logincode"])) {
		$r = $db -> query("SELECT * FROM `logincodes` WHERE `logincode`='" . $db -> escape($_POST["logincode"]) . "'");
		if ($r -> num_rows == 0) {
			$error = "Login code invalid! Get a new one by direct messaging the bot \"logincode\".";
		} else {
			$r = $r -> fetch_array();
			if (time() > $r["expires"]) {
				$db -> query("DELETE FROM `logincodes` WHERE `logincode`='" . $db -> escape($_POST["logincode"]) . "'");
				$error = "Login code expired! Get a new one by direct messaging the bot \"logincode\".";
			} else {
				$_SESSION["logincode"] = $_POST["logincode"];
				$_SESSION["slackname"] = $r["forwhom"];
				redirect();
			}
		}
	}
?>
<!DOCTYPE html>
<html>
	<head>
		<title>Qwertea || Login</title>
		<link rel="stylesheet" type="text/css" href="assets/css/index.css">
		<script type="text/javascript" src="/assets/js/lib/jquery-3.0.0.min.js"></script>
	</head>
	<body>
		<div class="qwertea center vertical full absolute"><div>
			<div id="radial"></div>
		</div></div>
		<div class="qwertea center vertical full absolute"><div>
			<img src="/assets/img/logo.png"/><br><br>
			To log in, enter your login code below.<br>
			Don't have a login code? Direct message the Slack bot "help".<br><br>
			<form method="POST">
				<?php
					if (isset($error)) {
						echo("<div id='error'>" . htmlentities($error) . "</div>");
					}
				?>
				<input required name="logincode" type="text" placeholder="Login code" class="space" style="width:175px"/><br>
				<input type="submit" name="login" value="Login" class="button green" style="width:190px">
			</form>
		</div></div>
		<script type="text/javascript" src="/assets/js/global.js"></script>
	</body>
</html>