<?php
	require("inc/qwertea.php");
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
				<input required type="text" placeholder="Login code" class="space" style="width:175px"/><br>
				<input type="submit" name="login" value="Login" class="button green" style="width:190px">
			</form>
		</div></div>
		<script type="text/javascript" src="/assets/js/global.js"></script>
	</body>
</html>