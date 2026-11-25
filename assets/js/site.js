/* arjun-sivasankar.github.io: progressive enhancement only.
   The page is complete without this file; it adds the intro, the hero reel,
   the live system diagrams, the current-section marker and the timeline rail. */
(function () {
	'use strict';

	var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	function play(video) {
		if (!video || video.ended) { return; }
		var attempt = video.play();
		if (attempt && attempt.catch) { attempt.catch(function () {}); }
	}

	function forceMuted(video) {
		video.muted = true;
		video.defaultMuted = true;
		video.setAttribute('muted', '');
		video.playsInline = true;
		video.setAttribute('playsinline', '');
	}

	/* ------------------------------------------------------------ hero reel */

	var hero = document.querySelector('.hero');
	var reel = document.getElementById('reel');
	var heroReady = false;

	/* The portrait is short, muted and plays once, so it plays even when the
	   system asks for reduced motion (as the site always did). Only the full-screen
	   intro steps back for reduced motion. */
	function startHero(fromTop) {
		if (!reel) { return; }
		heroReady = true;
		if (fromTop) { reel.currentTime = 0; }
		play(reel);

		/* some browsers refuse the first play(): nudge, then offer a button */
		[600, 1600, 3000].forEach(function (delay) {
			window.setTimeout(function () {
				if (!reel.paused || reel.ended) { return; }
				play(reel);
				if (delay === 3000 && reel.paused && !document.querySelector('.reel-play-btn')) {
					var button = document.createElement('button');
					button.type = 'button';
					button.className = 'reel-play-btn';
					button.textContent = 'Play portrait';
					button.addEventListener('click', function () {
						play(reel);
						button.remove();
					});
					reel.parentNode.appendChild(button);
				}
			}, delay);
		});
	}

	if (reel) {
		forceMuted(reel);
		var fail = function () { if (hero) { hero.classList.add('no-video'); } };
		reel.addEventListener('error', fail);
		var source = reel.querySelector('source');
		if (source) { source.addEventListener('error', fail); }

		if ('IntersectionObserver' in window) {
			new IntersectionObserver(function (entries) {
				if (!heroReady) { return; }
				if (entries[0].isIntersecting) { play(reel); } else { reel.pause(); }
			}, { threshold: 0.2 }).observe(reel);
		}

		document.addEventListener('visibilitychange', function () {
			if (!heroReady) { return; }
			if (document.hidden) { reel.pause(); } else { play(reel); }
		});
	}

	/* ------------------------------------------------------------ intro */

	var intro = document.getElementById('intro');
	var introVideo = document.getElementById('intro-reel');
	var skip = document.getElementById('intro-skip');
	var seen = false;

	try { seen = window.sessionStorage.getItem('intro-seen') === '1'; } catch (error) { seen = false; }

	if (!intro || !introVideo || seen || reduced) {
		if (intro) { intro.hidden = true; }
		startHero(false);
	} else {
		var regions = [document.querySelector('header.nav'), document.querySelector('main'), document.querySelector('footer')];
		var lock = function (on) {
			regions.forEach(function (region) {
				if (!region) { return; }
				if (on) { region.setAttribute('inert', ''); region.setAttribute('aria-hidden', 'true'); }
				else { region.removeAttribute('inert'); region.removeAttribute('aria-hidden'); }
			});
		};
		var done = false;
		var dismiss = function () {
			if (done) { return; }
			done = true;
			try { window.sessionStorage.setItem('intro-seen', '1'); } catch (error) {}
			intro.classList.add('is-out');
			document.body.classList.remove('intro-running');
			introVideo.pause();
			lock(false);
			window.setTimeout(function () { intro.hidden = true; }, 850);
			startHero(true);
		};

		intro.hidden = false;
		document.body.classList.add('intro-running');
		lock(true);
		forceMuted(introVideo);

		introVideo.addEventListener('ended', dismiss);
		introVideo.addEventListener('error', dismiss);
		if (skip) {
			skip.addEventListener('click', dismiss);
			skip.focus();
		}
		document.addEventListener('keydown', function (event) {
			if (event.key === 'Escape') { dismiss(); }
		});

		var attempt = introVideo.play();
		if (attempt && attempt.catch) { attempt.catch(dismiss); }
	}

	/* ------------------------------------------------------------ system diagrams */

	function closestLength(path, x, y) {
		var total = path.getTotalLength();
		var best = 0;
		var bestDist = Infinity;
		for (var s = 0; s <= total; s += 2) {
			var p = path.getPointAtLength(s);
			var d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y);
			if (d < bestDist) { bestDist = d; best = s; }
		}
		return best;
	}

	function setupDiagram(figure) {
		var svg = figure.querySelector('svg');
		var say = figure.querySelector('.sys-say');
		var paths = Array.prototype.slice.call(svg.querySelectorAll('.sys-path'));
		var glows = svg.querySelectorAll('.packet-glow');
		var lanes = [];

		/* packets travel behind the nodes, so they read as entering each stage */
		var firstNode = svg.querySelector('.node');
		if (firstNode) {
			Array.prototype.forEach.call(svg.querySelectorAll('.packet-glow, .packet'), function (dot) {
				svg.insertBefore(dot, firstNode);
			});
		}

		Array.prototype.forEach.call(svg.querySelectorAll('.packet'), function (packet) {
			var index = Number(packet.getAttribute('data-path')) || 0;
			var path = paths[index];
			if (!path) { return; }
			var glow = null;
			Array.prototype.forEach.call(glows, function (g) {
				if (Number(g.getAttribute('data-path')) === index) { glow = g; }
			});
			var nodes = Array.prototype.slice.call(svg.querySelectorAll('.node[data-path="' + index + '"]'))
				.map(function (node) {
					var box = node.querySelector('rect').getBBox();
					return { el: node, at: closestLength(path, box.x + box.width / 2, box.y + box.height / 2) };
				})
				.sort(function (a, b) { return a.at - b.at; });

			lanes.push({
				path: path,
				packet: packet,
				glow: glow,
				nodes: nodes,
				total: path.getTotalLength(),
				duration: (Number(packet.getAttribute('data-dur')) || 6) * 1000,
				current: null
			});
		});

		var running = false;
		var frame = 0;
		var origin = 0;
		var elapsed = 0;

		function tick(now) {
			if (!running) { return; }
			var time = now - origin;
			lanes.forEach(function (lane) {
				var distance = (time % lane.duration) / lane.duration * lane.total;
				var point = lane.path.getPointAtLength(distance);
				lane.packet.setAttribute('cx', point.x);
				lane.packet.setAttribute('cy', point.y);
				if (lane.glow) {
					lane.glow.setAttribute('cx', point.x);
					lane.glow.setAttribute('cy', point.y);
				}
				var active = null;
				lane.nodes.forEach(function (node) {
					if (distance + 4 >= node.at) { active = node; }
				});
				if (active !== lane.current) {
					if (lane.current) { lane.current.el.classList.remove('on'); }
					if (active) {
						active.el.classList.add('on');
						if (say) { say.textContent = active.el.getAttribute('data-say'); }
					}
					lane.current = active;
				}
			});
			frame = window.requestAnimationFrame(tick);
		}

		function start() {
			if (running) { return; }
			running = true;
			figure.classList.add('is-live');
			origin = performance.now() - elapsed;
			frame = window.requestAnimationFrame(tick);
		}

		function stop() {
			if (!running) { return; }
			running = false;
			elapsed = performance.now() - origin;
			window.cancelAnimationFrame(frame);
			figure.classList.remove('is-live');
		}

		return { start: start, stop: stop };
	}

	var figures = Array.prototype.slice.call(document.querySelectorAll('[data-sys]'));

	if (figures.length) {
		/* the diagrams always run while on screen: they are the work itself */
		if (!('IntersectionObserver' in window)) {
			figures.forEach(function (figure) { figure.classList.add('is-seen'); });
		} else {
			var diagrams = new Map();
			figures.forEach(function (figure) { diagrams.set(figure, setupDiagram(figure)); });

			var watcher = new IntersectionObserver(function (entries) {
				entries.forEach(function (entry) {
					var diagram = diagrams.get(entry.target);
					if (entry.isIntersecting) {
						entry.target.classList.add('is-seen');
						diagram.start();
					} else {
						diagram.stop();
					}
				});
			}, { threshold: 0.35 });

			figures.forEach(function (figure) { watcher.observe(figure); });

			document.addEventListener('visibilitychange', function () {
				if (document.hidden) { diagrams.forEach(function (d) { d.stop(); }); }
			});
		}
	}

	/* ------------------------------------------------------------ current section in the nav */

	var links = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));

	if (links.length && 'IntersectionObserver' in window) {
		var byId = {};
		links.forEach(function (link) { byId[link.getAttribute('href').slice(1)] = link; });

		var spy = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (!entry.isIntersecting) { return; }
				links.forEach(function (link) { link.classList.remove('is-current'); });
				var link = byId[entry.target.id];
				if (link) { link.classList.add('is-current'); }
			});
		}, { rootMargin: '-45% 0px -50% 0px' });

		Object.keys(byId).forEach(function (id) {
			var section = document.getElementById(id);
			if (section) { spy.observe(section); }
		});
	}

	/* ------------------------------------------------------------ stack cross-section */

	var strata = document.querySelector('[data-strata]');

	if (strata) {
		var list = strata.querySelector('.strata-list');
		var layers = Array.prototype.slice.call(strata.querySelectorAll('.stratum'));
		var stackPending = false;
		var updateStack = function () {
			stackPending = false;
			var box = list.getBoundingClientRect();
			var mark = window.innerHeight * 0.55;
			var p = Math.min(1, Math.max(0, (mark - box.top) / box.height));
			strata.style.setProperty('--p', p.toFixed(4));
			layers.forEach(function (layer) {
				layer.classList.toggle('is-lit', layer.getBoundingClientRect().top + 30 < mark);
			});
		};
		window.addEventListener('scroll', function () {
			if (!stackPending) { stackPending = true; window.requestAnimationFrame(updateStack); }
		}, { passive: true });
		window.addEventListener('resize', updateStack);
		updateStack();
	}

	/* ------------------------------------------------------------ timeline rail */

	var timeline = document.querySelector('.timeline');

	if (timeline) {
		var stops = Array.prototype.slice.call(timeline.querySelectorAll('li'));
		var pending = false;

		var update = function () {
			pending = false;
			var mark = window.innerHeight * 0.6;
			var box = timeline.getBoundingClientRect();
			var progress = Math.min(1, Math.max(0, (mark - box.top) / box.height));
			timeline.style.setProperty('--progress', progress.toFixed(4));
			stops.forEach(function (stop) {
				stop.classList.toggle('is-past', stop.getBoundingClientRect().top + 8 < mark);
			});
		};

		window.addEventListener('scroll', function () {
			if (!pending) {
				pending = true;
				window.requestAnimationFrame(update);
			}
		}, { passive: true });
		window.addEventListener('resize', update);
		update();
	}

	/* ------------------------------------------------------------ films */

	Array.prototype.forEach.call(document.querySelectorAll('[data-film]'), function (button) {
		var dialog = document.getElementById('film-' + button.getAttribute('data-film'));
		if (!dialog || typeof dialog.showModal !== 'function') { return; }
		var film = dialog.querySelector('video');
		var close = dialog.querySelector('.film-close');

		button.addEventListener('click', function () {
			dialog.showModal();
			if (film) { play(film); }
		});
		if (close) { close.addEventListener('click', function () { dialog.close(); }); }
		dialog.addEventListener('click', function (event) {
			if (event.target === dialog) { dialog.close(); }
		});
		dialog.addEventListener('close', function () {
			if (film) { film.pause(); }
			button.focus();
		});
	});

	/* ------------------------------------------------------------ year */

	var year = document.getElementById('year');
	if (year) { year.textContent = new Date().getFullYear(); }
}());
