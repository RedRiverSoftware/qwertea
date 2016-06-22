if ($("#radial").length > 0) {
	function resizeRadial() {
		var w = $(document).outerWidth();
		$("#radial")
			.css("width",(w + 300) + "px")
			.css("height",(w + 300) + "px")
			.css("margin-left",-(($("#radial").outerWidth() / 2) - ($("body").outerWidth() / 2)))
			.css("margin-top",-(($("#radial").outerHeight() / 2) - ($("body").outerHeight() / 2)));
	}
	resizeRadial();
	$(window).resize(resizeRadial);
	$("body")
		.css("overflow","hidden")
		.css("color","#000");
}