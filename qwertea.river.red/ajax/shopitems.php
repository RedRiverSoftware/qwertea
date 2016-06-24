<?php
	@session_start();

	require("../inc/qwertea.php");
	$GLOBALS["Qwertea"] = new Qwertea();
	$db = $GLOBALS["Qwertea"] -> Database;

	if (!isset($_SESSION["logincode"])) {
		die("Not logged in");
	} else {
		$r = $db -> query("SELECT NULL FROM `logincodes` WHERE `logincode`='" . $db->escape($_SESSION["logincode"]) . "'");
		if ($r -> num_rows == 0) {
			unset($_SESSION["logincode"]);
			unset($_SESSION["slackname"]);
			die("Not logged in");
		}
	}

	$r = $db -> query("SELECT `value` FROM `stringvars` WHERE `key_`='tearound'");
	if ($r -> num_rows == 0) {
		die("No tea round");
	} else {
		$r = $r -> fetch_array();
	}
	$r["value"] = explode(",",$r["value"]);
	if (time() > intval($r["value"][1])) {
		$db -> query("DELETE FROM `stringvars` WHERE `key_`='tearound'");
		die("Expired");
	}

	$products = [
		"products" => [],
	];

	$r2 = $db -> query("SELECT * FROM `products` ORDER BY `orders` DESC");
	while($row = $r2 -> fetch_assoc()) {
		$products["products"][$row["name"]] = $row;
		unset($products["products"][$row["name"]]["name"]);
	}
	$products["timeleft"] = intval($r["value"][1]);

	$r = $db -> query("SELECT `points` FROM `users` WHERE `slackname`='" . $db->escape($_SESSION["slackname"]) . "'") -> fetch_array();
	$products["points"] = intval($r["points"]);

	echo(json_encode($products));
?>