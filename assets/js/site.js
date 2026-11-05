/* The scene: stars, a horizon, and one faceted solid that answers the cursor.
   Plain canvas 2D — no WebGL, no libraries. */
(function () {
	'use strict';

	var canvas = document.getElementById('scene');
	if (!canvas) {
		return;
	}

	var ctx = canvas.getContext('2d');
	var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	var width = 0;
	var height = 0;
	var dpr = 1;
	var stars = [];
	var pointer = { x: 0, y: 0, tx: 0, ty: 0 };
	var raf = 0;
	var running = false;
	var start = performance.now();

	/* ---------------------------------------------------------- geometry */

	var phi = (1 + Math.sqrt(5)) / 2;
	var raw = [
		[-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
		[0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
		[phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
	];

	var verts = raw.map(function (v) {
		var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
		return [v[0] / length, v[1] / length, v[2] / length];
	});

	var faces = [
		[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
		[1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
		[3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
		[4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
	];

	function rotate(point, ax, ay) {
		var cosY = Math.cos(ay);
		var sinY = Math.sin(ay);
		var x1 = point[0] * cosY + point[2] * sinY;
		var z1 = -point[0] * sinY + point[2] * cosY;

		var cosX = Math.cos(ax);
		var sinX = Math.sin(ax);
		var y1 = point[1] * cosX - z1 * sinX;
		var z2 = point[1] * sinX + z1 * cosX;

		return [x1, y1, z2];
	}

	/* ---------------------------------------------------------- scene */

	function resize() {
		var rect = canvas.getBoundingClientRect();
		dpr = Math.min(window.devicePixelRatio || 1, 2);
		width = rect.width;
		height = rect.height;
		canvas.width = Math.round(width * dpr);
		canvas.height = Math.round(height * dpr);
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		buildStars();
		if (reduced) {
			render(0.6);
		}
	}

	function buildStars() {
		stars = [];
		var count = Math.round((width * height) / 9000);
		for (var i = 0; i < count; i += 1) {
			stars.push({
				x: Math.random() * width,
				y: Math.random() * height * 0.85,
				r: Math.random() * 1.1 + 0.25,
				a: Math.random() * 0.55 + 0.15,
				phase: Math.random() * Math.PI * 2,
				depth: Math.random() * 0.7 + 0.3
			});
		}
	}

	function render(time) {
		ctx.clearRect(0, 0, width, height);

		/* horizon */
		var horizonY = height * 0.82;
		var glow = ctx.createRadialGradient(width * 0.5, horizonY + height * 0.22, 0, width * 0.5, horizonY + height * 0.22, height * 0.95);
		glow.addColorStop(0, 'rgba(124, 242, 212, 0.16)');
		glow.addColorStop(0.35, 'rgba(124, 242, 212, 0.05)');
		glow.addColorStop(1, 'rgba(4, 5, 6, 0)');
		ctx.fillStyle = glow;
		ctx.fillRect(0, 0, width, height);

		/* stars */
		for (var i = 0; i < stars.length; i += 1) {
			var star = stars[i];
			var twinkle = reduced ? 1 : 0.65 + 0.35 * Math.sin(time * 0.9 + star.phase);
			var px = star.x + pointer.x * star.depth * 14;
			var py = star.y + pointer.y * star.depth * 10;
			ctx.beginPath();
			ctx.arc(px, py, star.r, 0, Math.PI * 2);
			ctx.fillStyle = 'rgba(255, 255, 255, ' + (star.a * twinkle).toFixed(3) + ')';
			ctx.fill();
		}

		/* faint terrain line */
		ctx.beginPath();
		ctx.moveTo(0, horizonY);
		for (var x = 0; x <= width; x += 24) {
			var wobble = Math.sin(x * 0.012) * 6 + Math.sin(x * 0.031 + 1.7) * 3;
			ctx.lineTo(x, horizonY + wobble);
		}
		ctx.strokeStyle = 'rgba(124, 242, 212, 0.13)';
		ctx.lineWidth = 1;
		ctx.stroke();

		drawSolid(time);
	}

	function drawSolid(time) {
		var cx = width * 0.6 + pointer.x * 26;
		var cy = height * 0.3 + pointer.y * 20;
		var radius = Math.min(width, height) * 0.2;

		var ay = time * 0.18 + pointer.x * 0.7;
		var ax = Math.sin(time * 0.28) * 0.16 + pointer.y * 0.5;

		/* glow behind the solid */
		var halo = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 2.1);
		halo.addColorStop(0, 'rgba(124, 242, 212, 0.16)');
		halo.addColorStop(0.5, 'rgba(124, 242, 212, 0.04)');
		halo.addColorStop(1, 'rgba(4, 5, 6, 0)');
		ctx.fillStyle = halo;
		ctx.fillRect(cx - radius * 2.2, cy - radius * 2.2, radius * 4.4, radius * 4.4);

		var projected = verts.map(function (v) {
			var r = rotate(v, ax, ay);
			var depth = 4.2;
			var scale = (radius * 2.6) / (depth - r[2]);
			return {
				x: cx + r[0] * scale,
				y: cy + r[1] * scale,
				z: r[2]
			};
		});

		var light = [0.45, -0.65, 0.72];

		var ordered = faces.map(function (face) {
			var a = verts[face[0]];
			var b = verts[face[1]];
			var c = verts[face[2]];

			var ra = rotate(a, ax, ay);
			var rb = rotate(b, ax, ay);
			var rc = rotate(c, ax, ay);

			var u = [rb[0] - ra[0], rb[1] - ra[1], rb[2] - ra[2]];
			var v = [rc[0] - ra[0], rc[1] - ra[1], rc[2] - ra[2]];
			var n = [
				u[1] * v[2] - u[2] * v[1],
				u[2] * v[0] - u[0] * v[2],
				u[0] * v[1] - u[1] * v[0]
			];
			var len = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]) || 1;
			n = [n[0] / len, n[1] / len, n[2] / len];

			var draw = n[2] > -0.02;
			var lambert = Math.max(0, n[0] * light[0] + n[1] * light[1] + n[2] * light[2]);

			return { face: face, normal: n, lambert: lambert, draw: draw, z: (ra[2] + rb[2] + rc[2]) / 3 };
		}).sort(function (a, b) { return a.z - b.z; });

		ordered.forEach(function (item) {
			if (!item.draw) {
				return;
			}

			var shade = Math.pow(item.lambert, 0.8);
			var red = Math.round(9 + shade * 96);
			var green = Math.round(22 + shade * 190);
			var blue = Math.round(24 + shade * 160);

			ctx.beginPath();
			ctx.moveTo(projected[item.face[0]].x, projected[item.face[0]].y);
			ctx.lineTo(projected[item.face[1]].x, projected[item.face[1]].y);
			ctx.lineTo(projected[item.face[2]].x, projected[item.face[2]].y);
			ctx.closePath();

			ctx.fillStyle = 'rgba(' + red + ', ' + green + ', ' + blue + ', 0.88)';
			ctx.fill();

			ctx.strokeStyle = 'rgba(190, 255, 240, ' + (0.08 + shade * 0.3).toFixed(3) + ')';
			ctx.lineWidth = 1;
			ctx.stroke();
		});
	}

	function loop(now) {
		var time = (now - start) / 1000;

		pointer.x += (pointer.tx - pointer.x) * 0.06;
		pointer.y += (pointer.ty - pointer.y) * 0.06;

		render(time);
		raf = window.requestAnimationFrame(loop);
	}

	function startLoop() {
		if (running || reduced) {
			return;
		}
		running = true;
		raf = window.requestAnimationFrame(loop);
	}

	function stopLoop() {
		running = false;
		if (raf) {
			window.cancelAnimationFrame(raf);
			raf = 0;
		}
	}

	window.addEventListener('pointermove', function (event) {
		pointer.tx = (event.clientX / window.innerWidth - 0.5) * 2;
		pointer.ty = (event.clientY / window.innerHeight - 0.5) * 2;
	}, { passive: true });

	if ('ResizeObserver' in window) {
		new ResizeObserver(resize).observe(canvas);
	} else {
		window.addEventListener('resize', resize);
	}

	if ('IntersectionObserver' in window) {
		new IntersectionObserver(function (entries) {
			if (entries[0].isIntersecting) {
				startLoop();
			} else {
				stopLoop();
			}
		}, { threshold: 0.05 }).observe(canvas);
	} else {
		startLoop();
	}

	document.addEventListener('visibilitychange', function () {
		if (document.hidden) {
			stopLoop();
		} else if (!reduced) {
			startLoop();
		}
	});

	resize();
	startLoop();
}());

/* Reel: pointer parallax, and a graceful still if the video is not there yet. */
(function () {
	'use strict';

	var frame = document.getElementById('reel-frame');
	var video = document.getElementById('reel');
	if (!frame || !video) {
		return;
	}

	var chip = frame.querySelector('.reel-play');
	var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	function still() {
		if (chip) {
			chip.innerHTML = 'stills / 2026';
		}
	}

	video.addEventListener('error', still);
	video.querySelector('source').addEventListener('error', still);

	window.setTimeout(function () {
		if (!video.videoWidth) {
			still();
		}
	}, 2200);

	if (reduced) {
		return;
	}

	window.addEventListener('pointermove', function (event) {
		var x = (event.clientX / window.innerWidth - 0.5) * 2;
		var y = (event.clientY / window.innerHeight - 0.5) * 2;
		frame.style.transform = 'translate3d(' + (x * -9).toFixed(1) + 'px,' + (y * -7).toFixed(1) + 'px,0)';
	}, { passive: true });
}());

/* Section reveals, once each. */
(function () {
	'use strict';

	var items = Array.prototype.slice.call(
		document.querySelectorAll('.card, .rows li, .cell, .paper, .section-head')
	);

	if (!items.length) {
		return;
	}

	if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
