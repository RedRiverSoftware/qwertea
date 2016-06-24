<!DOCTYPE html>
<html>
	<head>
		<title>Qwertea</title>
		<link rel="stylesheet" type="text/css" href="/assets/css/error.css">
	</head>
	<body>
		<div class="qwertea center vertical full absolute"><div>
			<h1>Uh oh!</h1>
			Qwertea's ran into an error to do with <?php echo(htmlentities($_GET["type"])); ?>. The details are:<br><br>
			<?php echo(htmlentities($_GET["details"])); ?><br><br>
			Have you ran the <a href="/install/">installer</a> yet?<br>
			If it's a MySQL connection error, you'll need to configure inc/config.php correctly for your database.<br><br>
			<a href="javascript:window.history.back()">Retry</a>
		</div></div>
	</body>
</html>