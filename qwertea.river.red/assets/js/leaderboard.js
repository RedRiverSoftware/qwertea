$("tr[data-url]").click(function() {
	window.location = $(this).data("url");
});