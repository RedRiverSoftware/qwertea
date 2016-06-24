<?php
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

	$r = $db -> query("SELECT * FROM `users` ORDER BY `points` DESC LIMIT 0,10");

	ob_start();

?>
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<title>Qwertea || Leaderboard</title>
		<link rel="stylesheet" type="text/css" href="/assets/css/leaderboard.css">
		<script type="text/javascript" src="/assets/js/lib/jquery-3.0.0.min.js"></script>
	</head>
	<body>
		<style>
			body {
				background-image: url('/assets/img/wallpapers/<?php echo($wallpaper); ?>');
			}
		</style>
		<div class="qwertea center horizontal vertical full"><div>
			<div id="container">
				<div id="top">

					<div class="qwertea center horizontal">
						Leaderboard
					</div>
					<table id="head">
						<tr>
							<th></th>
							<th>Slack</th>
							<th>Name</th>
							<th>Points</th>
							<th>Rating</th>
						</tr>
					</table>

				</div>
				<div id="bottom">
					<table id="leaderboardtable"><tbody>

						<tr>
							<th style="width:32px"></th>
							<th>Slack</th>
							<th>Name</th>
							<th>Points</th>
							<th>Rating</th>
						</tr>

						<?php

							while($row = $r -> fetch_assoc()) { ?>

								<tr data-url="/users/<?php echo(htmlentities($row["slackname"])); ?>">
									<td>
										<img src="<?php echo(htmlentities($row["avatar"])); ?>" id="avatar"/>
									</td>
									<td class="shrink" data-font-size="14">
										<span><?php echo(htmlentities("@" . $row["slackname"])); ?></span>
									<td class="shrink" data-font-size="14">
										<span><?php
											if ($row["firstname"] != null) {
												if ($row["lastname"] != null) {
													echo(htmlentities($row["firstname"] . " " . $row["lastname"]));
												} else {
													echo(htmlentities($row["firstname"]));
												}
											}
										?></span>
									</td>
									<td class="shrink" data-font-size="14" <?php
										if (intval($row["points"]) > 0) {
											echo("style='background-color:rgba(0,255,0,.1)'");
										} else if (intval($row["points"]) < 0) {
											echo("style='background-color:rgba(255,0,0,.1)'");
										}
									?>>
										<span><?php echo(htmlentities($row["points"])); ?></span>
									</td>
									<td class="shrink" data-font-size="14"><span>
										<?php
											$r2 = $db -> query("SELECT `rating` FROM `ratings` WHERE `forwhom`='" . $db->escape($row["slackname"]) . "'");
											$rating = 0;
											while($row2 = $r2 -> fetch_assoc()) {
												if ($row2["rating"] == 1) {
													$rating += 1;
												} else {
													$rating -= 1;
												}
											}
											echo($rating);
										?>
									</span></td>
								</tr>

<?php						}

						?>


					</tbody></table>
				</div>
			</div>
		</div>
		<script type="text/javascript" src="/assets/js/leaderboard.js"></script>
		<script type="text/javascript" src="/assets/js/global.js"></script>
	</body>
</html>