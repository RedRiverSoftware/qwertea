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

	if (isset($_GET["l"])) {
		$logincode = $_GET["l"];
		$r = $db -> query("SELECT * FROM `logincodes` WHERE `logincode`='" . $db -> escape($logincode) . "'");
		if ($r -> num_rows == 0) {
			$error = "Login code invalid! Get a new one by direct messaging the bot \"logincode\".";
		} else {
			$r = $r -> fetch_array();
			if (time() > $r["expires"]) {
				$db -> query("DELETE FROM `logincodes` WHERE `logincode`='" . $db -> escape($logincode) . "'");
				$error = "Login code expired! Get a new one by direct messaging the bot \"logincode\".";
			} else {
				$_SESSION["logincode"] = $logincode;
				$_SESSION["slackname"] = $r["forwhom"];
				redirect();
			}
		}
	}
?>
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<title>Qwertea || Login</title>
		<link rel="stylesheet" type="text/css" href="assets/css/index.css">
		<script type="text/javascript" src="/assets/js/lib/jquery-3.0.0.min.js"></script>
	</head>
	<body>
		<div class="qwertea center vertical full absolute"><div>
			<div id="radial"></div>
		</div></div>
		<div class="qwertea center vertical full absolute"><div>
			<img src="/assets/img/logo.png" style="width:100px"/><br><br>
			To log in, <a href="<?php echo(htmlentities($GLOBALS["Qwertea"] -> BotMessageURL)); ?>">send a direct message</a> with the command <span class="code">login</span> to the Slack bot.<br>
			<div class="spacer"></div>
			You'll be redirected back here with a link.
		</div></div>
		<script type="text/javascript" src="/assets/js/global.js"></script>
	</body>
</html>