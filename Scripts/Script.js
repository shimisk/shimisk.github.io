var $isClosed = true;

$(function () {
	$("nav").load("/Templates/nav.html", function () {
		$("li.nav-item.active").removeClass("active");
		var current_title = $(document).attr("title");
		switch (current_title) {
			case "The Speak Your Mind School, Shibuya":
				$("ul li").eq(0).addClass("active");
				break;
			case "100 Minute of English":
				$("ul li").eq(1).addClass("active");
				break;
			case "Courses":
				$("ul li").eq(2).addClass("active");
				break;
			case "Method":
				$("ul li").eq(3).addClass("active");
				break;
			case "Enrol":
				$("ul li").eq(4).addClass("active");
				break;
			case "Contact":
				$("ul li").eq(5).addClass("active");
				break;
			// case "FAQ":
			// 	$("ul li").eq(6).addClass("active");
			// 	break;
			// case "Student Comments":
			// 	$("ul li").eq(7).addClass("active");
			// 	break;
		}
	});

	$("footer").load("/Templates/footer.html", function () {
		$("#copyright-year").html(new Date().getFullYear());
	});
});

//FOR MODAL
/* $(function () {
	$(window).on("load", function () {
		//$("#COVID-modal").modal("show");
		if (!sessionStorage.getItem("shown-modal")) {
			$("#COVID-modal").modal("show");
			sessionStorage.setItem("shown-modal", "true");
		}
	});
}); */


$(document).on("click", "#buttonNav", function () {
	var $nav = $("#mainNav");
	$isClosed = !$isClosed;

	$nav.addClass("scrolled");

	if ($(document).scrollTop() < 50 && $isClosed) {
		setTimeout(function () {
			$nav.removeClass("scrolled");
		}, 300);
	}
});
$(function () {
	$(window).scroll(function () {
		var $nav = $("#mainNav");
		if ($(document).scrollTop() > 50) {
			$nav.addClass("bg-gray");
		} else if ($(document).scrollTop() < 50 && $isClosed) {
			$nav.removeClass("bg-gray");
		}
	});
});

$(function () {});
