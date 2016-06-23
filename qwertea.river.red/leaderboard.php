<?php
	require("inc/qwertea.php");
	$GLOBALS["Qwertea"] = new Qwertea();
	$db = $GLOBALS["Qwertea"] -> Database;

	$wallpapers = array_diff(scandir("assets/img/wallpapers"),["..","."]);
	$wallpaper  = $wallpapers[array_rand($wallpapers)];
?>
<!DOCTYPE html>
<html>
	<head>
		<title>Qwertea || Leaderboard</title>
		<link rel="stylesheet" type="text/css" href="/assets/css/users.css">
		<script type="text/javascript" src="/assets/js/lib/jquery-3.0.0.min.js"></script>
	</head>
	<body>
		<style>
			body {
				background-image: url(/assets/img/wallpapers/<?php echo($wallpaper); ?>);
			}
		</style>
		<div class="qwertea center horizontal vertical full">
			<div id="top" class="qwertea center vertical horizontal">
				<h1>Leaderboards</h1>
			<div>
			<div id="detailstables">
				<?php
					$sql = "SELECT * FROM `users` ORDER BY `points` DESC";
					$result = $db->query($sql);

					if ($result->num_rows > 0) {
				     // output data of each row
				    while($row = $result->fetch_assoc()) {
				         echo "<br> Name : ". $row["firstname"]. " ". $row["lastname"]. "</br> Slack Name : <a href="https://rrsoftware.slack.com/messages/@" . $row["slackname"] . "</a></br> Points : " . $row["points"] . "<br>";
				    }
					} else {
				     echo "Couldnt Get Leaderboard Data";
					}
				?>
			</div>
		<div>
	</body>
</html>