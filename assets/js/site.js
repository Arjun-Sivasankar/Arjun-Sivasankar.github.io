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

/* --- the field: a map of the work that stirs under the cursor -------- */

(function () {
	var panel = document.querySelector('[data-field]');
	if (!panel) {
		return;
	}

	var canvas = panel.querySelector('canvas');
	var ctx = canvas && canvas.getContext('2d');
	if (!ctx) {
		return;
	}

	var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	var clusters = [
		{ x: 0.26, y: 0.24 },
		{ x: 0.66, y: 0.18 },
		{ x: 0.30, y: 0.62 },
		{ x: 0.70, y: 0.58 },
		{ x: 0.48, y: 0.86 }
	];

	var dots = [];
	var width = 0;
	var height = 0;
	var pointer = { x: -999, y: -999, active: false };
	var raf = 0;
	var last = 0;
	var onScreen = true;

	function gaussian() {
		var u = 0;
		var v = 0;
		while (u === 0) { u = Math.random(); }
		while (v === 0) { v = Math.random(); }
		return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
	}

	function seed() {
		dots = [];
		clusters.forEach(function (cluster) {
			for (var i = 0; i < 52; i += 1) {
				var hx = (cluster.x + gaussian() * 0.042) * width;
				var hy = (cluster.y + gaussian() * 0.042) * height;
				dots.push({ hx: hx, hy: hy, x: hx, y: hy, vx: 0, vy: 0 });
			}
		});
	}

	function render(step) {
		ctx.clearRect(0, 0, width, height);

		for (var i = 0; i < dots.length; i += 1) {
			var dot = dots[i];

			if (step && !reduced) {
				dot.vx += (dot.hx - dot.x) * 0.012;
				dot.vy += (dot.hy - dot.y) * 0.012;

				if (pointer.active) {
					var dx = dot.x - pointer.x;
					var dy = dot.y - pointer.y;
					var distance2 = dx * dx + dy * dy;
					var radius = 92;

					if (distance2 < radius * radius && distance2 > 0.01) {
						var distance = Math.sqrt(distance2);
						var force = (1 - distance / radius) * 2.4;
						dot.vx += (dx / distance) * force;
						dot.vy += (dy / distance) * force;
					}
				}

				dot.vx *= 0.9;
				dot.vy *= 0.9;
				dot.x += dot.vx;
				dot.y += dot.vy;
			}

			ctx.beginPath();
			ctx.arc(dot.x, dot.y, 1.7, 0, Math.PI * 2);
			ctx.fillStyle = 'rgba(16, 18, 21, 0.55)';
			ctx.fill();
		}
	}

	function frame(now) {
		raf = 0;
		if (!onScreen) {
			return;
		}
		render(now - last);
		last = now;
		raf = window.requestAnimationFrame(frame);
	}

	function start() {
		if (raf || reduced || !onScreen) {
			return;
		}
		last = window.performance.now();
		raf = window.requestAnimationFrame(frame);
	}

	function resize() {
		var rect = panel.getBoundingClientRect();
		var dpr = Math.min(window.devicePixelRatio || 1, 2);
		width = rect.width;
		height = rect.height;
		canvas.width = Math.round(width * dpr);
		canvas.height = Math.round(height * dpr);
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		seed();
		render(0);
	}

	panel.addEventListener('pointermove', function (event) {
		var rect = panel.getBoundingClientRect();
		pointer.x = event.clientX - rect.left;
		pointer.y = event.clientY - rect.top;
		pointer.active = true;
		start();
	});

	panel.addEventListener('pointerleave', function () {
		pointer.active = false;
	});

	if ('ResizeObserver' in window) {
		new ResizeObserver(resize).observe(panel);
	} else {
		window.addEventListener('resize', resize);
	}

	if ('IntersectionObserver' in window) {
		new IntersectionObserver(function (entries) {
			onScreen = entries[0].isIntersecting;
			if (onScreen) {
				start();
			}
		}, { threshold: 0.1 }).observe(panel);
	}

	document.addEventListener('visibilitychange', function () {
		if (document.hidden && raf) {
			window.cancelAnimationFrame(raf);
			raf = 0;
		} else if (!document.hidden) {
			start();
		}
	});

	resize();
	if (reduced) {
		render(0);
	}
}());
