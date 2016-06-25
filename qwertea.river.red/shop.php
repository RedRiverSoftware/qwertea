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

	if (isset($_POST["checkout"])) {
		$_POST["checkout"] = json_decode($_POST["checkout"],true);
		if (!$_POST["checkout"]) {
			die();
		}

		$r2 = $db -> query("SELECT `value` FROM `stringvars` WHERE `key_`='tearound'");
		if ($r2 -> num_rows == 0) {
			die();
		}
		$r2 = $r2 -> fetch_array();
		$bywhom = explode(",",$r2["value"])[0];

		$products = $db -> query("SELECT * FROM `products`");
		$productsn = [];
		while($row = $products -> fetch_assoc()) {
			$productsn[$row["name"]] = $row;
			unset($productsn[$row["name"]]["name"]);
		}
		$products = $productsn;
		unset($products);

		$total = 0;
		foreach($_POST["checkout"] as $product => $details) {
			if ($details["amount"] > 0 && $details["guestorder"] == false && isset($products[$product])) {
				$total += intval($products[$product]["price"]) * $details["amount"];
			}
		}

		$r = $db -> query("SELECT `points` FROM `users` WHERE `slackname`='" . $db->escape($_SESSION["slackname"]) . "'") -> fetch_array();
		if (intval($r["points"]) >= $total) {
			$db -> query("BEGIN");
			foreach($_POST["checkout"] as $product => $details) {
				if ($details["amount"] > 0 && $details["guestorder"] == false && isset($products[$product])) {
					if (!isset($details["extras"])) {
						$details["extras"] = null;
					} else {
						$r3 = $db -> query("SELECT `extras` FROM `products` WHERE `name`='" . $db->escape($product) . "'") -> fetch_array();
						$extras = json_decode($r3["extras"]);
						if (!$extras) {
							trigger_error("There is a problem with the `extras` table for Qwertea - your `extras` column has incorrect JSON.",E_USER_ERROR);
							die();
						}
						foreach($details["extras"] as $extra => $value) {
							if (!isset($extras[$extra])) {
								unset($details["extras"][$extra]);
							} else if ($extras[$extra]["type"] != gettype($value)) {
								unset($details["extras"][$extra]);
							} else if ($extras[$extra]["type"] == "integer") {
								if (isset($extras[$extra]["max"])) {
									if ($value > intval($extras[$extra]["max"])) {
										unset($details["extras"][$extra]);
									}
								}
								if (isset($extras[$extra]["min"])) {
									if ($value < intval($extras[$extra]["min"])) {
										unset($details["extras"][$extra]);
									}
								}
							}
						}
					}
					$db -> query("

						INSERT INTO `orders` (`fromwhom`,`guestorder`,`bywhom`,`product`,`extras`)
						VALUES(

							'" . $db->escape($_SESSION["slackname"]) . "',
							'" . $db->escape($details["guestorder"]) . "',
							'" . $db->escape($bywhom) . "',
							'" . $db->escape($product) . "',
							'" . $db->escape($details["extras"]) . "'

						)

					");
				}
			}
			$db -> query("COMMIT");
			die();
		}
	}

	ob_start();
?>
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<noscript>
			<meta http-equiv="refresh" content="0;/incompatible/">
		</noscript>
		<title>Qwertea || Shop</title>
		<link rel="stylesheet" type="text/css" href="/assets/css/lib/bootstrap-grid-only.css">
		<link rel="stylesheet" type="text/css" href="/assets/css/shop.css">
		<link rel="stylesheet" type="text/css" href="/assets/css/animate.css">
		<script type="text/javascript" src="/assets/js/lib/jquery-3.0.0.min.js"></script>
	</head>
	<body>
<?php 	if (!isset($_GET["expired"])) { ?>

			<div class="qwertea center horizontal vertical full visible" id="modalcontainer"><div>
				<div id="modal">

					<label><input id="guestordermodal" type="checkbox"/> Guest Order</label>
					<div class="underline">Extras</div>
					<div id="extrascontainer"></div>
					<div class="button green" id="savemodalbutton">Save</div>

				</div>
			</div></div>

			<div class="qwertea center horizontal vertical full"><div>

				<div id="whitebox" class="animated fadeIn">
					<div class="container-fluid">
						<div class="row">
							<div class="col-xs-8" id="products_column">
								<div class="row" id="products"></div>
							</div>
							<div class="col-xs-4" id="cart_column">
								<div id="cart">
									<div id="header">Cart</div>
									<div class="rule"></div>
									<span id="cart_text"></span>
									<div class="rule space"></div>
									<span id="total"></span><br>
									<div class="spacer s10px"></div>
									<span id="hastotal"></span>
									<div class="spacer s10px"></div>
									<span id="edittip"></span>

									<div id="timer"></div>
									<div id="yourpoints"></div>
									<div id="checkout" class="button green disabled">Checkout</div>
								</div>
							</div>
						</div>
					</div>
				</div>

			</div></div>

<?php 	} else { ?>

			<div class="qwertea center horizontal vertical full"><div>

				<h1>Uh oh!</h1>
				You ran out of time to order. Your order has not been placed and no points have been awarded or deducted.

			</div></div>

<?php	} ?>
		<script type="text/javascript" src="/assets/js/shop.js"></script>
	</body>
</html>
<?php
	ob_end_flush();
?>