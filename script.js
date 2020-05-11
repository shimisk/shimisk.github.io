//change text to english on nav bar

// $(function () {
//   var oldtext;
//   var oldwidth;
//   var newwidth;
//   $("li a").hover(
//     function () {
//       //get text and width
//       oldtext = $(this).text();
//       oldwidth = $(this).width();
//       //if text not empty change the text content
//       if ($(this).text()) {
//         $(this).text($(this).attr("id"));
//       }
//       newwidth = $(this).width();
//       if (newwidth < oldwidth) {
//         $(this).width(oldwidth);
//       }
//     },
//     function () {
//       //if there is text change it to the old one
//       if ($(this).text()) {
//         $(this).text(oldtext);
//       }
//       //change to the old width
//       $(this).width(oldwidth);
//     }
//   );
// });

$(window).resize(function () {
  if ($(window).width() >= 1200) {
    $("nav a").removeClass("scrolled");
  }
});

//add bck when scrolling
$(function () {
  $(document).scroll(function () {
    var $nav = $("#mainNav");
    $nav.toggleClass("scrolled", $(this).scrollTop() > $nav.height());
  });
});
//change back
$(function () {
  $("nav button").click(function () {
    console.log("clicked");
    $("nav a").addClass("scrolled");
    $("nav a img").parent().removeClass("scrolled");
  });
});
