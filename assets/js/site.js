/* The scene, in real 3D: a faceted solid lit by an environment built from a
   gradient, a star field, and pointer parallax. three.js is vendored locally. */
(function () {
	'use strict';

	var canvas = document.getElementById('scene');
	var hero = document.querySelector('.hero');
	if (!canvas || !hero) {
		return;
	}

	var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	/* No THREE, or no WebGL: fall back to the CSS backdrop without fuss. */
	if (!window.THREE) {
		hero.classList.add('no-webgl');
		return;
	}

	var renderer;
	try {
		renderer = new THREE.WebGLRenderer({
			canvas: canvas,
			antialias: true,
			alpha: true,
			powerPreference: 'high-performance'
		});
	} catch (error) {
		hero.classList.add('no-webgl');
		return;
	}

	var scene = new THREE.Scene();
	var camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
	camera.position.set(0, 0, 4.6);

	renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
	renderer.outputEncoding = THREE.sRGBEncoding;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.05;

	/* ---------------------------------------------------------- environment */

	function environment() {
		var face = document.createElement('canvas');
		face.width = 512;
		face.height = 256;
		var g = face.getContext('2d');

		var sky = g.createLinearGradient(0, 0, 0, 256);
		sky.addColorStop(0, '#050708');
		sky.addColorStop(0.45, '#0b1a17');
		sky.addColorStop(0.75, '#2f6f5f');
		sky.addColorStop(1, '#8ef7d9');
		g.fillStyle = sky;
		g.fillRect(0, 0, 512, 256);

		var sun = g.createRadialGradient(360, 74, 0, 360, 74, 130);
		sun.addColorStop(0, 'rgba(255,255,255,0.95)');
		sun.addColorStop(0.4, 'rgba(180,255,238,0.35)');
		sun.addColorStop(1, 'rgba(255,255,255,0)');
		g.fillStyle = sun;
		g.fillRect(0, 0, 512, 256);

		var texture = new THREE.CanvasTexture(face);
		texture.mapping = THREE.EquirectangularReflectionMapping;
		texture.encoding = THREE.sRGBEncoding;

		var pmrem = new THREE.PMREMGenerator(renderer);
		pmrem.compileEquirectangularShader();
		var target = pmrem.fromEquirectangular(texture);
		pmrem.dispose();
		texture.dispose();
		return target.texture;
	}

	var envMap = environment();

	/* ---------------------------------------------------------- the solid */

	var detail = window.innerWidth < 760 ? 1 : 2;
	var geometry = new THREE.IcosahedronGeometry(0.66, detail);

	var material = new THREE.MeshPhysicalMaterial({
		color: 0x08120f,
		metalness: 0.45,
		roughness: 0.22,
		clearcoat: 1,
		clearcoatRoughness: 0.22,
		flatShading: true,
		envMap: envMap,
		envMapIntensity: 1.15
	});

	var solid = new THREE.Mesh(geometry, material);
	solid.position.set(0.28, 0.32, 0);
	scene.add(solid);

	/* ---------------------------------------------------------- lights */

	var key = new THREE.DirectionalLight(0xffffff, 1.7);
	key.position.set(4, 6, 5);
	scene.add(key);

	var rim = new THREE.PointLight(0x7cf2d4, 6, 12);
	rim.position.set(-3.4, 1.6, -3.2);
	scene.add(rim);

	var fill = new THREE.AmbientLight(0x10201d, 1.6);
	scene.add(fill);

	/* ---------------------------------------------------------- stars */

	var count = window.innerWidth < 760 ? 500 : 1100;
	var positions = new Float32Array(count * 3);
	for (var i = 0; i < count; i += 1) {
		positions[i * 3] = (Math.random() - 0.5) * 16;
		positions[i * 3 + 1] = (Math.random() - 0.5) * 9;
		positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
	}

	var starGeometry = new THREE.BufferGeometry();
	starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

	var stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({
		color: 0xffffff,
		size: 0.016,
		transparent: true,
		opacity: 0.75,
		sizeAttenuation: true,
		depthWrite: false
	}));
	scene.add(stars);

	/* ---------------------------------------------------------- loop */

	var pointer = { x: 0, y: 0, tx: 0, ty: 0 };
	var clock = new THREE.Clock();
	var running = false;
	var frame = 0;

	function resize() {
		var rect = canvas.getBoundingClientRect();
		if (!rect.width || !rect.height) {
			return;
		}
		renderer.setSize(rect.width, rect.height, false);
		camera.aspect = rect.width / rect.height;
		camera.updateProjectionMatrix();
		if (reduced) {
			renderer.render(scene, camera);
		}
	}

	function draw() {
		var t = clock.getElapsedTime();

		pointer.x += (pointer.tx - pointer.x) * 0.055;
		pointer.y += (pointer.ty - pointer.y) * 0.055;

		solid.rotation.y = t * 0.14 + pointer.x * 0.65;
		solid.rotation.x = Math.sin(t * 0.33) * 0.1 + pointer.y * 0.42;
		solid.position.y = 0.32 + Math.sin(t * 0.5) * 0.035;

		stars.rotation.y = t * 0.008;
		stars.rotation.x = pointer.y * -0.03;

		renderer.render(scene, camera);
	}

	function loop() {
		draw();
		frame = window.requestAnimationFrame(loop);
	}

	function start() {
		if (running || reduced) {
			return;
		}
		running = true;
		frame = window.requestAnimationFrame(loop);
	}

	function stop() {
		running = false;
		if (frame) {
			window.cancelAnimationFrame(frame);
			frame = 0;
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
				start();
			} else {
				stop();
			}
		}, { threshold: 0.02 }).observe(canvas);
	} else {
		start();
	}

	document.addEventListener('visibilitychange', function () {
		if (document.hidden) {
			stop();
		} else {
			start();
		}
	});

	resize();
	if (reduced) {
		draw();
	} else {
		start();
	}
}());

/* Reel: pointer parallax, and a graceful still until the footage lands. */
(function () {
	'use strict';

	var frameEl = document.getElementById('reel-frame');
	var video = document.getElementById('reel');
	if (!frameEl || !video) {
		return;
	}

	var chip = frameEl.querySelector('.reel-play');
	var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	function still() {
		if (chip) {
			chip.textContent = 'stills / 2026';
		}
	}

	video.addEventListener('error', still);
	var source = video.querySelector('source');
	if (source) {
		source.addEventListener('error', still);
	}

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
		frameEl.style.transform = 'translate3d(' + (x * -9).toFixed(1) + 'px,' + (y * -7).toFixed(1) + 'px,0)';
	}, { passive: true });
}());


/* The reel: play exactly once, count the seconds, hold the last frame. */
(function () {
	'use strict';

	var video = document.getElementById('reel');
	var frame = document.getElementById('reel-frame');
	var clock = document.getElementById('reel-time');
	var replay = document.getElementById('reel-replay');
	if (!video || !frame) {
		return;
	}

	var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	function pad(value) {
		return (value < 10 ? '0' : '') + value;
	}

	function tick() {
		if (!clock) {
			return;
		}
		var seconds = Math.floor(video.currentTime || 0);
		clock.textContent = pad(Math.floor(seconds / 60)) + ':' + pad(seconds % 60);
	}

	function offer(label) {
		if (replay) {
			replay.hidden = false;
			replay.textContent = label;
		}
	}

	video.addEventListener('timeupdate', tick);

	video.addEventListener('ended', function () {
		frame.classList.add('is-done');
		offer('Replay');
	});

	if (replay) {
		replay.addEventListener('click', function () {
			frame.classList.remove('is-done');
			replay.hidden = true;
			video.currentTime = 0;
			var played = video.play();
			if (played && played.catch) {
				played.catch(function () { offer('Play'); });
			}
		});
	}

	if (reduced) {
		video.removeAttribute('autoplay');
		video.pause();
		frame.classList.add('is-paused');
		offer('Play');
		return;
	}

	var attempt = video.play();
	if (attempt && attempt.catch) {
		attempt.catch(function () {
			frame.classList.add('is-paused');
			offer('Play');
		});
	}

	if ('IntersectionObserver' in window) {
		new IntersectionObserver(function (entries) {
			if (!entries[0].isIntersecting) {
				video.pause();
				return;
			}
			if (!video.ended && !frame.classList.contains('is-done')) {
				var resumed = video.play();
				if (resumed && resumed.catch) {
					resumed.catch(function () {});
				}
			}
		}, { threshold: 0.2 }).observe(frame);
	}

	document.addEventListener('visibilitychange', function () {
		if (document.hidden) {
			video.pause();
		}
	});
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
