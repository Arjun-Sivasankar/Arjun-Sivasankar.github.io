/* Small progressive enhancements: current year, copy-email button.
   The page is fully usable without this file. */
(function () {
	'use strict';

	var year = document.getElementById('year');
	if (year) {
		year.textContent = new Date().getFullYear();
	}

	var button = document.querySelector('.copy');
	if (!button) {
		return;
	}

	var original = button.textContent;

	function done() {
		button.textContent = 'Copied';
		window.setTimeout(function () {
			button.textContent = original;
		}, 1800);
	}

	button.addEventListener('click', function () {
		var value = button.getAttribute('data-copy') || '';

		if (navigator.clipboard && navigator.clipboard.writeText) {
			navigator.clipboard.writeText(value).then(done, fallback);
			return;
		}
		fallback();

		function fallback() {
			var field = document.createElement('textarea');
			field.value = value;
			field.setAttribute('readonly', '');
			field.style.position = 'absolute';
			field.style.left = '-9999px';
			document.body.appendChild(field);
			field.select();
			try {
				document.execCommand('copy');
				done();
			} catch (error) {
				button.textContent = value;
			}
			document.body.removeChild(field);
		}
	});
}());
