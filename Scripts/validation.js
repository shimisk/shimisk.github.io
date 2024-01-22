// Example starter JavaScript for disabling form submissions if there are invalid fields
(function () {
	"use strict";

	// Fetch all the forms we want to apply custom Bootstrap validation styles to
	var forms = document.querySelectorAll(".needs-validation");

	// Loop over them and prevent submission
	Array.prototype.slice.call(forms).forEach(function (form) {
		form.addEventListener(
			"submit",
			function (event) {
				var boolName = false;
				var boolEmails = false;
				var boolMessage = false;
				var name = $("#name").val();
				console.log(name);
				var message = $("#message").val();
				console.log("hello");
				if (message === "") {
					$("#message").addClass("is-invalid");
					boolName = false;
					event.preventDefault();
					event.stopPropagation();
				} else {
					$("#message").addClass("is-valid");
					$("#message").removeClass("is-invalid");
					boolMessage = true;
				}

				if (name === "") {
					$("#name").addClass("is-invalid");
					boolName = false;
					event.preventDefault();
					event.stopPropagation();
				} else {
					$("#name").addClass("is-valid");
					$("#name").removeClass("is-invalid");
					boolName = true;
				}
				//form.classList.add("was-validated");
				var email = $("#email").val();
				var confirmemail = $("#confirm_email").val();

				if (validateEmail(email)) {
					if (
						email !== confirmemail ||
						email === "" ||
						confirmemail === ""
					) {
						$("#confirm_email").addClass("is-invalid");
						$("#email").addClass("is-invalid");
						$("#emailText").html("メールアドレスが一致しません");
						var boolEmails = false;
						event.preventDefault();
						event.stopPropagation();
					} else {
						$("#confirm_email").removeClass("is-invalid");
						$("#email").removeClass("is-invalid");
						$("#confirm_email").addClass("is-valid");
						$("#email").addClass("is-valid");

						var boolEmails = true;
					}
				} else {
					$("#email").addClass("is-invalid");

					$("#emailText").html(
						"有効なメールアドレスを入力してください"
					);
					event.preventDefault();
					event.stopPropagation();
				}

				if (boolName && boolEmails && boolMessage) {
					form.classList.add("was-validated");
				}
			},
			false
		);
	});
})();

function validateEmail(email) {
	const re =
		/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(email);
}
