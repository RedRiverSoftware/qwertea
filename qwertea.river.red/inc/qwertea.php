<?php
	foreach($_GET as $k => $v) {
		$_GET[$k] = urldecode($v);
	}
	
	class Qwertea {
		
		public $Database;
		
		public $Config;
		
		public function __construct($Config = null) {
			$this -> Config = new stdClass();
			
			$this -> Config -> RedirectErrors = true;
			
			if ($Config != null) {
				foreach($Config as $k => $v) {
					$this -> Config -> $k = $v;
				}
			}
			
			$GLOBALS["Qwertea"] = $this;
			
			require("database.php");
			
			if ($this -> Database != false && $this -> Config -> RedirectErrors == true) {
				$r = $this -> Database -> query("SHOW TABLES");
				if ($r -> num_rows == 0) {
					header("LOCATION: /install/");
				}
			}
		}
		
	}
?>