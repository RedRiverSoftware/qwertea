<?php
	class Database {

		public $db;

		public function query($q,$e = null) {
			$qe = $this -> db -> query($q);
			if (!$qe) {
				if ($e != null) {
					$e($this -> db -> error);
				} else {
					trigger_error("MySQL error: " . $this -> db -> error,E_USER_WARNING);
				}
			}
			return $qe;
		}

		public function escape($s) {
			return $this -> db -> real_escape_string($s);
		}

	}

	$db = @new mysqli(

		$GLOBALS["Qwertea"] -> ConfigFile -> MySQL -> Host,
		$GLOBALS["Qwertea"] -> ConfigFile -> MySQL -> User,
		$GLOBALS["Qwertea"] -> ConfigFile -> MySQL -> Password,
		$GLOBALS["Qwertea"] -> ConfigFile -> MySQL -> Database

	);

	if ($db -> connect_error) {
		$GLOBALS["Qwertea"] -> Database = false;
		if ($GLOBALS["Qwertea"] -> Config -> RedirectErrors == true) {
			header("LOCATION: /error.php?type=MySQL&details=" . $db -> connect_error);
		}
	} else {
		$GLOBALS["Qwertea"] -> Database = new Database();
		$GLOBALS["Qwertea"] -> Database -> db = $db;
	}
?>