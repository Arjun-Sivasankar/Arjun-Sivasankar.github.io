/* Small, boring enhancements: the hero reel plays once, sections reveal, year. */
(function () {
	'use strict';

	var video = document.getElementById('reel');
	var hero = document.querySelector('.hero');
	var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	if (video) {
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
		} else {
			var attempt = video.play();
			if (attempt && attempt.catch) {
				attempt.catch(function () {});
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
					var back = video.play();
					if (back && back.catch) {
						back.catch(function () {});
					}
				}
			});
		}
	}

	var items = Array.prototype.slice.call(
		document.querySelectorAll('.card, .steps li, .cell, .item, .statement, .prose')
	);

	if (items.length && 'IntersectionObserver' in window && !reduced) {
		items.forEach(function (item, index) {
			item.classList.add('reveal');
			item.style.setProperty('--i', index % 3);
		});

		var observer = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) {
					entry.target.classList.add('in');
					observer.unobserve(entry.target);
				}
			});
		}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

		items.forEach(function (item) { observer.observe(item); });
	}

	var year = document.getElementById('year');
	if (year) {
		year.textContent = new Date().getFullYear();
	}
}());
