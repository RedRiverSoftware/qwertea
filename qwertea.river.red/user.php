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

	ob_start();

?>
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<title>Qwertea || @<?php echo($userinfo["slackname"]); ?></title>
		<link rel="stylesheet" type="text/css" href="/assets/css/users.css">
		<script type="text/javascript" src="/assets/js/lib/jquery-3.0.0.min.js"></script>
		<script src="http://libs.cartocdn.com/cartodb.js/v3/cartodb.js"></script>
		<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.1.6/Chart.bundle.min.js"></script>
		<script src="Chart.js"></script>
	</head>
	<body>
		<style>
			body {
				background-image: url('/assets/img/wallpapers/<?php echo($wallpaper); ?>');
			}
		</style>
		<div class="qwertea center horizontal vertical full"><div>

			<div id="container">

<?php			if ($userinfo["slackname"] == $_SESSION["slackname"]) { ?>
					<!--if no firstanme or lastname it will show the slack name-->
					<div id="big">Welcome, <?php
						if (isset($userinfo["firstname"]) && isset($userinfo["lastname"])) {
							echo(htmlentities($userinfo["firstname"]));
						} else {
							echo(htmlentities($userinfo["slackname"]));
						}
					?>!</div><br>

<?php			} ?>

				<div id="top" class="qwertea center vertical horizontal"><div>
					<!--Displays the users profile picture from slack-->
					<img src="<?php echo(htmlentities($userinfo["avatar_large"])); ?>" id="avatar"/><br>
					<!--Displays the users first name and last name-->
					<?php
						if (isset($userinfo["firstname"])) {
							if (isset($userinfo["lastname"])) {
								echo("<div id='name'>" . htmlentities($userinfo["firstname"]) . " " . htmlentities($userinfo["lastname"]) . "</div>");
							}
						}
					?>
					<!--Sends the user to the slack profile of the profile they are on -->
					<a href="https://rrsoftware.slack.com/messages/@<?php echo(htmlentities($userinfo["slackname"])); ?>/details" target="_blank">@<?php echo($userinfo["slackname"]); ?></a>
					</br>
					<!--Send the user to the leaderboard page-->
					<a href="http://qwertea.river.red/leaderboard/"><span class="button blue" style="margin-top:10px;">Visit Leaderboard</span></a>
				</div></div>

				<div id="bottom">

					<table id="detailstable">
						<!--Changed the background of the table row when points are below or above 0-->
						<tr <?php
							if (intval($userinfo["points"]) > 0) {
								echo("style='background-color:rgba(0,255,0,.1)'");
							} else if (intval($userinfo["points"]) < 0) {
								echo("style='background-color:rgba(255,0,0,.1)'");
							}
						?>>
							<td>Points</td>
							<td><?php echo(htmlentities($userinfo["points"])); ?></td>
						</tr>
							<!--Changed the background of the table row when points are below or above 0-->
						<tr <?php
							if (intval($userinfo["drinksdrunk"]) > intval($userinfo["drinksmade"])) {
								echo("style='background-color:rgba(255,0,0,.1)'");
							} else if (intval($userinfo["drinksdrunk"]) < intval($userinfo["drinksmade"])) {
								echo("style='background-color:rgba(0,255,0,.1'");
							}
						?>>
							<td>Drinks Made</td>
							<td><?php echo(htmlentities($userinfo["drinksmade"])); ?></td>
						</tr>
						<!--Changed the background of the table row when points are below or above 0-->
						<tr
							<?php
							if (intval($userinfo["drinksdrunk"]) > intval($userinfo["drinksmade"])) {
								echo("style='background-color:rgba(255,0,0,.1)'");
							} else if (intval($userinfo["drinksdrunk"]) < intval($userinfo["drinksmade"])) {
								echo("style='background-color:rgba(0,255,0,.1'");
							}
						?>>
							<td>Drinks Drunk</td>
							<td><?php echo(htmlentities($userinfo["drinksdrunk"])); ?></td>
						</tr>

						<tr>
							<!--Draw the graph and pulls the data from the database for the figures-->
							<canvas id="myChart" width="400" height="100"></canvas>
							<script>
							var ctx = document.getElementById("myChart").getContext("2d");
							var myChart = new Chart(ctx, {
							    type: 'bar',
							    data: {
							        labels: ["Points", "Drinks Made", "Drinks Drunk"],
							        datasets: [{
							            label: '',
							            data: [<?php echo(htmlentities($userinfo["points"]));?>, <?php echo(htmlentities($userinfo["drinksmade"]));?>, <?php echo(htmlentities($userinfo["drinksdrunk"]));?>],
							            backgroundColor: [
							                'rgba(255, 99, 132, 0.2)',
							                'rgba(54, 162, 235, 0.2)',
							                'rgba(255, 206, 86, 0.2)',
							            ],
							            borderColor: [
							                'rgba(255,99,132,1)',
							                'rgba(54, 162, 235, 1)',
							                'rgba(255, 206, 86, 1)',
							            ],
							            borderWidth: 1
							        }]
							    },
							    options: {
							        scales: {
							            yAxes: [{
							                ticks: {
							                    beginAtZero:true
							                }
							            }]
							        }
							    }
							});
							</script>
						</tr>
						<tr>

						</tr>

					</table>

				</div>

			</div>

		</div>
	</body>
</html>
<?php
	ob_end_flush();
?>