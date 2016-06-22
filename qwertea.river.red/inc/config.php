<?php
	class QwerteaConfig {public function __construct() {$this -> MySQL = new stdClass();
		
		$this -> MySQL -> Host     = "localhost";
		$this -> MySQL -> Database = "qwertea";
		$this -> MySQL -> User     = "qwertea";
		$this -> MySQL -> Password = null;
		
	}};
?>