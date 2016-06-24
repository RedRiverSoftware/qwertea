var cart = [];
var products_in_cart = {};
var products_data;

function timef() {
	return Math.round(+new Date() / 1000);
}

function removeb(thisb) {
	var product = $(thisb).parent().parent().find(".l").data("product");
	delete(products_in_cart[product]);
	cart = [];
	$.each(products_in_cart,function(i,v) {
		console.log(i,v);
		for(var x=0;x < i;x++) {
			cart.push(i);
		}
	});
	console.log(cart);
	update_cart_text();
}

$.get("/ajax/shopitems.php",function(data) {
	if (data == "Not logged in") {
		window.location = "/";
		return;
	}
	if (data == "No tea round") {
		window.location = "/";
		return;
	}

	products_data = JSON.parse(data);

	$.each(products_data.products,function(namex,product) {

		var product_col = document.createElement("div");
		$(product_col).addClass("col-md-6");

			$("#products").append(product_col);

		var product_elm = document.createElement("div");
		$(product_elm).addClass("product");

			$(product_col).append(product_elm);

		var product_nam = document.createElement("div");
		$(product_nam).addClass("name");
		$(product_nam).html(namex);

			$(product_elm).append(product_nam);

		var product_img_container = document.createElement("div");
		$(product_img_container).addClass("image");

			var product_img = document.createElement("div");
			$(product_img).css("background-image","url('/assets/img/products/" + product.image + "')");

				$(product_img_container).append(product_img);

			$(product_elm).append(product_img_container);

		var product_det_price = document.createElement("div");
		$(product_det_price).addClass("price");
		if (Number(product.price) == 1) {
			$(product_det_price).html("1 Point");
		} else {
			$(product_det_price).html(product.price + " Points");
		}

			$(product_elm).append(product_det_price);

		var product_det_add = document.createElement("div");
		$(product_det_add).addClass("button green add");
		$(product_det_add).html("+ Add");

			$(product_elm).append(product_det_add);

	});

	$(".add").click(function() {
		var product = $(this).parent().find(".name").html();
		cart.push(product);
		update_cart_text();
	});

	$("#yourpoints").html("Your points: " + products_data.points);

	window.setInterval(function(time) {
		time -= timef();
		var hours     = Math.floor(time / 3600);
	    var minutes   = Math.floor((time - (hours * 3600)) / 60);
	    var seconds   = time - (hours * 3600) - (minutes * 60);
	    var hours_s   = " hours";
	    var minutes_s = " minutes";
	    var seconds_s = " seconds";

	    if (hours == 1) {
	    	hours_s = " hour";
	    }
	    if (minutes == 1) {
	    	minutes_s = " minute";
	    }
	    if (seconds == 1) {
	    	seconds_s = " second";
	    }

		if (hours > 0) {
			$("#timer").html("You have " + hours + hours_s + " and " + minutes + minutes_s + " and " + seconds + seconds_s + " to order.")
		} else if (minutes > 0) {
			$("#timer").html("You have " + minutes + minutes_s + " and " + seconds + seconds_s + " to order.");
		} else {
			$("#timer").html("You have " + seconds + seconds_s + " to order.");
		}
		if (time <= 0) {
			window.location = "?expired";
		}
	},1000,products_data.timeleft);
});

var mode = false;
function responsive() {
	if ($("body").outerWidth() <= 799 && mode == false) {

		mode = true;
		$("#products_column").attr("class","col-xs-12");
		$("#cart_column").attr("class","col-xs-12");

	} else if ($("body").outerWidth() > 799 && mode == true) {

		mode = false;
		$("#products_column").attr("class","col-xs-8");
		$("#cart_column").attr("class","col-xs-4");

	}
}
$(window).resize(responsive);
responsive();

function update_cart_text() {
	if (cart.length == 0) {
		$("#cart_text").html("You don't have any items in your cart. Just click one of the add buttons to add an item to your cart.");
		$("#hastotal").html("");
		$("#edittip").html("");
		$("#total").html("");
		$("#checkout").removeClass("disabled");
	} else {
		products_in_cart = {};
		for(var i=0;i < cart.length;i++) {
			products_in_cart[cart[i]] = 0;
			for(var x=0;x < cart.length;x++) {
				if (cart[x] == cart[i]) {
					products_in_cart[cart[i]] += 1;
				}
			}
			products_in_cart[cart[i]] -= $(".guestorders[data-name='" + cart[i] + "']").val() || 0;
		}
		var sorting = [];
		for(var product in products_in_cart) {
			sorting.push([product,product.length]);
		}
		sorting.sort(function(a,b) {
			return a[1] - b[1];
		});
		sorting = sorting.reverse();

		var gen = "";
		for(i=0;i < sorting.length;i++) {
			gen += "<div class='p'><div class='l' data-product='" + sorting[i][0] + "'>" + sorting[i][0] + " x" + products_in_cart[sorting[i][0]] + "</div><div class='r'><img class='editb' src='/assets/img/edit.png'/>&nbsp;&nbsp;<img class='removeb' onclick='removeb(this)' src='/assets/img/cancel.png'/></div></div><br>";
		}
		$("#cart_text").html(gen.replace(/\n$/,""));

		var total = 0;
		$.each(sorting,function(i,prod) {
			total += Number(products_data["products"][prod[0]].price) * products_in_cart[prod[0]];
		});

		if (total == 1) {
			$("#total").html("Total price: 1 Point");
		} else {
			$("#total").html("Total price: " + total + " Points");
		}

		if (products_data.points < total) {
			if (total - products_data.points == 1) {
				$("#hastotal").html("You can't afford this! You need 1 more point.");
				$("#checkout").addClass("disabled");
			} else {
				$("#hastotal").html("You can't afford this! You need " + (total - products_data.points) + " more points.");
				$("#checkout").addClass("disabled");
			}
		} else {
			if (total == 0) {
				$("#checkout").addClass("disabled");
			} else {
				$("#hastotal").html("Press the checkout button below to place your order once you're ready. You'll have " + (products_data.points - total) + " points left after this order.");
				$("#edittip").html("To make an order a guest order (which is an order that does not add or negate any points) or to edit the amount of a product press the pencil button next to the product on the list.");
				$("#checkout").removeClass("disabled");
			}
		}
	}
}
update_cart_text();

$("#checkout").click(function() {
	if ($(this).hasClass("disabled")) {
		return;
	}

	var order = {};
	$.each(products_in_cart,function(k,v) {
		order[k] = {
			"amount": v,
			"extras": extras,
			"guestorders": $(".guestorders[data-name='" + k + "']").val() || 0,
		};
	});

	$.post("/shop/",{

		"checkout": JSON.stringify(products_in_cart)

	},function(data) {
		console.log(data);
		//window.location = "?done";
	});
});

