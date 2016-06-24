if ($("#radial").length > 0) {
	var s;
	var s2;
	function resizeRadial() {
		var w = $(document).outerWidth();
		$("#radial")
			.css("width",(w + 300) + "px")
			.css("height",(w + 300) + "px");
		if (!s && !s2) {
			s  = $("#radial").outerWidth();
			s2 = $("#radial").outerHeight();
		}
		console.log($("body").outerWidth());
		console.log($("body").outerHeight());
		$("#radial")
			.css("margin-left",-((s / 2) - ($("body").outerWidth() / 2)))
			.css("margin-top",-((s2 / 2) - ($("body").outerHeight() / 2)));
	}
	resizeRadial();
	$(window).resize(resizeRadial);
	$("body")
		.css("overflow","hidden")
		.css("color","#000");
}

$(".shrink").each(function() {
	var w = $(this).width();
	var t = $(this).find("span");
	var f = Number($(this).data("font-size"));
	while(t.width() > w) {
		t.css("font-size",f -= 0.5);
	}
});