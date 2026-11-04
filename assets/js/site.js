/* Running head, active nav, chart reveal, copy confirmation.
   Everything here is enhancement: the page reads fine without it. */
(function () {
	'use strict';

	var year = document.getElementById('year');
	if (year) {
		year.textContent = new Date().getFullYear();
	}

	/* --- running head + current section ------------------------------- */

	var links = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"]'));
	var head = document.getElementById('running-head');

	var sections = links.map(function (link) {
		return {
			link: link,
			name: link.textContent.trim(),
			section: document.querySelector(link.getAttribute('href'))
		};
	}).filter(function (item) {
		return item.section;
	});

	if (head && 'IntersectionObserver' in window && sections.length) {
		var ratios = new Map();

		var observer = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				ratios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0);
			});

			var best = null;
			var bestRatio = 0;

			sections.forEach(function (item) {
				var value = ratios.get(item.section) || 0;
				if (value > bestRatio) {
					bestRatio = value;
					best = item;
				}
			});

			sections.forEach(function (item) {
				if (item === best) {
					item.link.setAttribute('aria-current', 'true');
				} else {
					item.link.removeAttribute('aria-current');
				}
			});

			head.textContent = best ? best.name : '';
		}, { rootMargin: '-25% 0px -55% 0px', threshold: [0, 0.2, 0.5, 0.9] });

		sections.forEach(function (item) {
			observer.observe(item.section);
		});
	}

	/* --- chart: draws once when it comes into view --------------------- */

	var charts = Array.prototype.slice.call(document.querySelectorAll('[data-chart]'));

	if (charts.length) {
		if (!('IntersectionObserver' in window)) {
			charts.forEach(function (chart) {
				chart.classList.add('is-visible');
			});
		} else {
			var chartObserver = new IntersectionObserver(function (entries) {
				entries.forEach(function (entry) {
					if (entry.isIntersecting) {
						entry.target.classList.add('is-visible');
						chartObserver.unobserve(entry.target);
					}
				});
			}, { threshold: 0.4 });

			charts.forEach(function (chart) {
				chartObserver.observe(chart);
			});
		}
	}

	/* --- copy email ---------------------------------------------------- */

	var button = document.querySelector('.copy');
	var stamp = document.getElementById('stamp');
	if (!button || !stamp) {
		return;
	}

	var hideTimer;

	function confirm() {
		stamp.textContent = 'Copied';
		stamp.classList.add('is-shown');
		window.clearTimeout(hideTimer);
		hideTimer = window.setTimeout(function () {
			stamp.classList.remove('is-shown');
		}, 2200);
	}

	function fallback(value) {
		var field = document.createElement('textarea');
		field.value = value;
		field.setAttribute('readonly', '');
		field.style.position = 'absolute';
		field.style.left = '-9999px';
		document.body.appendChild(field);
		field.select();
		try {
			document.execCommand('copy');
			confirm();
		} catch (error) {
			stamp.textContent = 'Press copy';
			stamp.classList.add('is-shown');
		}
		document.body.removeChild(field);
	}

	button.addEventListener('click', function () {
		var value = button.getAttribute('data-copy') || '';

		if (navigator.clipboard && navigator.clipboard.writeText) {
			navigator.clipboard.writeText(value).then(confirm, function () {
				fallback(value);
			});
			return;
		}

		fallback(value);
	});
}());
