/* The hero portrait: plays once on arrival, then holds. Nothing else. */
(function () {
	'use strict';

	var video = document.getElementById('reel');
	if (!video) {
		return;
	}

	var hero = document.querySelector('.hero');
	var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	function fail() {
		if (hero) {
			hero.classList.add('no-video');
		}
	}

	video.addEventListener('error', fail);
	var source = video.querySelector('source');
	if (source) {
		source.addEventListener('error', fail);
	}

	if (reduced) {
		video.removeAttribute('autoplay');
		video.pause();
		return;
	}

	var attempt = video.play();
	if (attempt && attempt.catch) {
		attempt.catch(function () {
			/* blocked by the browser: the poster is the fallback */
		});
	}

	if ('IntersectionObserver' in window) {
		new IntersectionObserver(function (entries) {
			if (!entries[0].isIntersecting) {
				video.pause();
			} else if (!video.ended) {
				var resumed = video.play();
				if (resumed && resumed.catch) {
					resumed.catch(function () {});
				}
			}
		}, { threshold: 0.2 }).observe(video);
	}

	document.addEventListener('visibilitychange', function () {
		if (document.hidden) {
			video.pause();
		} else if (!video.ended) {
			video.play().catch(function () {});
		}
	});
}());

/* Section reveals, once each. */
(function () {
	'use strict';

	var items = Array.prototype.slice.call(
		document.querySelectorAll('.card, .rows li, .cell, .paper, .section-head')
	);

	if (!items.length || !('IntersectionObserver' in window) ||
		window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		return;
	}

	items.forEach(function (item, index) {
		item.classList.add('reveal');
		item.style.setProperty('--i', index % 4);
	});

	var observer = new IntersectionObserver(function (entries) {
		entries.forEach(function (entry) {
			if (entry.isIntersecting) {
				entry.target.classList.add('in');
				observer.unobserve(entry.target);
			}
		});
	}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

	items.forEach(function (item) { observer.observe(item); });
}());

/* Year in the footer. */
(function () {
	var year = document.getElementById('year');
	if (year) {
		year.textContent = new Date().getFullYear();
	}
}());