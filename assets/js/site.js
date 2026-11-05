/* The record: a small corpus of what I have actually done, and a BM25 index over it.
   No model, no network — the ranking maths fits in this file. */
(function () {
	'use strict';

	var corpus = [
		{ id: 'selfhosted', section: 'work', label: 'Docs4D · 2026', title: 'Self-hosted inference', text: 'Fine-tuned an open-weight LLM with LoRA for the clinical domain and served it through vLLM on in-house GPUs, so sensitive text never reaches a third-party API.', keys: 'llm vllm gpu lora fine-tuning on-premise privacy' },
		{ id: 'rag', section: 'work', label: 'Docs4D · 2026', title: 'Retrieval, end to end', text: 'Document parsing, hierarchical chunking, Qdrant hybrid search and cross-encoder reranking. Batching the reranker brought retrieval under one second without losing context recall.', keys: 'rag retrieval qdrant rerank embedding chunking latency' },
		{ id: 'agents', section: 'work', label: 'Docs4D · 2026', title: 'Agents in production', text: 'A multi-agent assistant in LangGraph for chat and voice, built with a German university hospital, with a separate validation layer around generation for EU MDR conformity.', keys: 'agents langgraph mcp multi-agent validation mdr regulated' },
		{ id: 'voice', section: 'work', label: 'Docs4D · 2026', title: 'Voice and speech', text: 'A real-time conversational agent — speech-to-text, LLM, text-to-speech — shipped into the Guardian iOS and Android app, plus a streaming Parakeet pipeline with Whisper correction and speaker diarization.', keys: 'speech voice tts stt whisper parakeet diarization asr audio' },
		{ id: 'evals', section: 'work', label: 'Docs4D · 2026', title: 'Evaluation and observability', text: 'Langfuse tracing, MLflow experiment tracking and RAGAS scoring, with A/B tests on agent prompts and open-weight model choice.', keys: 'eval evaluation ragas mlflow langfuse ab testing benchmark' },
		{ id: 'product', section: 'work', label: 'Docs4D · 2026', title: 'Product surface', text: 'DocScan, an OCR service for patient-uploaded documents, and the Frontline Next.js dashboard that integrates transcription and OCR. SQL migrations and row-level security for a Supabase backend.', keys: 'nextjs ocr fullstack supabase postgresql sql rls frontend' },
		{ id: 'vodafone', section: 'work', label: 'Vodafone · 2024', title: 'Applied AI intern', text: 'Built LLM agents on Microsoft Azure with enterprise customers, from experiment to integration into their products and the Vodafone Assist platform. Built an on-premise transcription service for 6G-HEALTH that transcribes, separates speakers and summarizes conversations in real time.', keys: 'azure foundry enterprise agents transcription telecom' },
		{ id: 'chairs', section: 'work', label: 'TU Dresden · 2023', title: 'Student research assistant', text: 'PyTorch models forecasting memory-access intervals in hardware accelerators from time series, co-authored with the Vodafone Chair. Quantization-aware training pipelines measuring accuracy at sub-8-bit precision.', keys: 'pytorch time series forecasting quantization hardware accelerators research' },
		{ id: 'lt', section: 'work', label: 'L&T · 2021', title: 'Engineer', text: 'Design Structure Matrices across a wind-turbine architecture and the Python network-analysis tool that builds them from correlation data. PLM extraction from Windchill with Selenium; Power BI dashboards.', keys: 'python network analysis wind turbine plm windchill powerbi mechanical' },
		{ id: 'gannet', section: 'work', label: 'Gannet · 2020', title: 'Automotive research intern', text: 'Design-of-experiments test planning and regression versus machine-learning models of NOx and soot emissions; the selected model met a target of under 10% prediction error.', keys: 'doe regression emissions automotive matlab validation' },

		{ id: 'msc', section: 'education', label: 'Education', title: 'M.Sc. Computational Modeling and Simulation', text: 'Technische Universität Dresden, 2022 to 2026, final grade 1.7. Computational Engineering track, focused on machine learning, deep learning and data science.', keys: 'master msc dresden degree university grade 1.7' },
		{ id: 'btech', section: 'education', label: 'Education', title: 'B.Tech. Mechanical Engineering', text: 'Manipal Institute of Technology, 2016 to 2020, CGPA 8.81 out of 10, minor in Machine Design. Thesis on engine emissions with design of experiments and machine learning.', keys: 'bachelor btech mechanical manipal india cgpa' },

		{ id: 'thesis', section: 'projects', label: 'Thesis', title: 'Knowledge graphs and neuro-symbolic reasoning', text: 'ICD-9-CM prediction over MIMIC-IV, current-visit coding and next-visit prediction within twelve months. Llama-3.2-1B, Llama-3.1-8B and Meditron-8B fine-tuned with LoRA, grounded through UMLS knowledge-graph paths with relation weighting.', keys: 'thesis mimic ehr icd9 umls graph llama meditron lora research neuro-symbolic' },
		{ id: 'results', section: 'projects', label: 'Thesis · result', title: 'What the thesis actually found', text: 'Knowledge-graph augmentation lifted micro-F1 from 0.459 to 0.503 on Llama-3.1-8B, and tail-class F1 by 26 to 46 percent. Gains on next-visit prediction were marginal, which the thesis reports rather than hides.', keys: 'result f1 metric improvement numbers evaluation benchmark' },
		{ id: 'inr', section: 'projects', label: 'Project', title: 'Conductivity reconstruction with invertible networks', text: 'High-resolution conductivity maps reconstructed from low-resolution magnetic-field data, with a reduced sensor set chosen to preserve reconstruction quality.', keys: 'invertible neural network physics sensors simulation' },
		{ id: 'gtsrb', section: 'projects', label: 'Coursework', title: 'Traffic sign classification', text: 'Convolutional network for German traffic sign recognition on the GTSRB benchmark.', keys: 'cnn computer vision gtsrb classification' },

		{ id: 'llms', section: 'skills', label: 'Skills', title: 'LLMs and generation', text: 'LoRA fine-tuning, prompt engineering, RAG with hybrid search and cross-encoder reranking in Qdrant, multi-agent systems in LangGraph and MCP, evaluation with RAGAS and LLM-as-judge.', keys: 'llm generation prompt engineering rag qdrant langgraph mcp' },
		{ id: 'infra', section: 'skills', label: 'Skills', title: 'Deployment', text: 'On-premise GPU inference with vLLM, SGLang and NVIDIA DGX; Docker, Kubernetes, Terraform; CI/CD and code review on GitLab CI and GitHub; AWS and Azure AI Foundry; MLflow and Langfuse.', keys: 'deployment docker kubernetes terraform aws azure ci cd gpu dgx sglang' },
		{ id: 'stack', section: 'skills', label: 'Skills', title: 'Product surface', text: 'Next.js, REST APIs, microservices, PostgreSQL with Supabase, SQL migrations and row-level security, Redis.', keys: 'frontend backend api postgres redis microservices nextjs' },
		{ id: 'ml', section: 'skills', label: 'Skills', title: 'Machine learning', text: 'Python, PyTorch, TensorFlow, scikit-learn, time-series forecasting, NLP, quantization-aware training.', keys: 'python pytorch tensorflow sklearn nlp ml forecasting' },
		{ id: 'speechskills', section: 'skills', label: 'Skills', title: 'Speech and documents', text: 'Whisper and NVIDIA Parakeet, speaker diarization, summarization, text-to-speech, OCR.', keys: 'speech whisper parakeet diarization tts ocr documents' },
		{ id: 'regulated', section: 'skills', label: 'Skills', title: 'Regulated software', text: 'EU MDR, IEC 62304, ISO 13485 and the EU AI Act — the part that decides whether a model is allowed to ship.', keys: 'mdr iec62304 iso13485 eu ai act compliance medical device regulation' },

		{ id: 'paper', section: 'research', label: 'IEEE · 2024', title: 'Access interval prediction', text: 'Enlarging the time budget for neural network based predictors for access interval prediction. IEEE ACDSA 2024, pages 1 to 7, with Friedrich, Matúš and Fettweis at the Vodafone Chair.', keys: 'ieee paper publication doi acdsa research citation' },
		{ id: 'patent', section: 'research', label: 'Patent · 2024', title: 'A System for Ejection', text: 'Indian patent, granted February 2024, application 201941044944. A canister-aided gas ejection mechanism built for the sounding rocket Team thrustMIT flew at the 2019 Spaceport America Cup.', keys: 'patent rocket spaceport thrustmit invention' },
		{ id: 'awards', section: 'research', label: 'Recognition', title: 'Awards', text: 'Rising Star Award at L&T Technology Services for FY 2021-22, and a Recognition of Leadership Award at Manipal for leading a team of 24 as Mechanical Head and Deputy Project Manager.', keys: 'award recognition leadership team rocket' },

		{ id: 'contact', section: 'contact', label: 'Contact', title: 'Get in touch', text: 'Open to AI engineering roles in Germany and the European Union. Based in Trier, open to relocating. English fluent, German basic, plus Hindi, Malayalam and Gujarati.', keys: 'contact email hire job role relocation languages' },
		{ id: 'cv', section: 'contact', label: 'Contact', title: 'Available for', text: 'AI engineering and machine learning engineering roles: agents, retrieval, speech, evaluation and the infrastructure that serves models on hardware you control.', keys: 'available hiring roles job search open' }
	];

	var input = document.getElementById('q');
	var panel = document.getElementById('results');
	var hintBar = document.getElementById('hints');
	if (!input || !panel) {
		return;
	}

	function tokenize(text) {
		return (text || '').toLowerCase()
			.replace(/[^a-z0-9äöüß+#.]+/g, ' ')
			.split(' ')
			.filter(function (word) { return word.length > 1; });
	}

	var documents = corpus.map(function (entry) {
		var bag = tokenize(entry.title + ' ' + entry.text + ' ' + (entry.keys || '') + ' ' + entry.label);
		return { entry: entry, terms: bag, length: bag.length };
	});

	var frequency = {};
	documents.forEach(function (doc) {
		var seen = {};
		doc.terms.forEach(function (term) {
			if (!seen[term]) {
				seen[term] = 1;
				frequency[term] = (frequency[term] || 0) + 1;
			}
		});
	});

	var total = documents.length;
	var average = documents.reduce(function (sum, doc) { return sum + doc.length; }, 0) / total;

	function rank(query) {
		var terms = tokenize(query);
		if (!terms.length) {
			return [];
		}

		return documents.map(function (doc) {
			var score = 0;

			terms.forEach(function (term) {
				var hits = 0;
				doc.terms.forEach(function (word) {
					if (word === term || word === term + 's' || word + 's' === term) {
						hits += 1;
					}
				});
				if (!hits) {
					return;
				}
				var df = frequency[term] || 0;
				var idf = Math.log(1 + (total - df + 0.5) / (df + 0.5));
				var norm = hits + 1.4 * (1 - 0.72 + 0.72 * doc.length / average);
				score += idf * (hits * 2.4) / norm;
			});

			return { entry: doc.entry, score: score };
		})
		.filter(function (hit) { return hit.score > 0; })
		.sort(function (a, b) { return b.score - a.score; });
	}

	function escape(text) {
		return text.replace(/[&<>]/g, function (character) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[character];
		});
	}

	function mark(text, terms) {
		var output = escape(text);
		terms.forEach(function (term) {
			if (term.length < 3) {
				return;
			}
			var pattern = new RegExp('(' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
			output = output.replace(pattern, '<mark>$1</mark>');
		});
		return output;
	}

	function excerpt(text, terms) {
		var lower = text.toLowerCase();
		var at = -1;
		terms.forEach(function (term) {
			var index = lower.indexOf(term);
			if (index >= 0 && (at < 0 || index < at)) {
				at = index;
			}
		});
		if (at < 0) {
			at = 0;
		}
		var start = Math.max(0, at - 60);
		var end = Math.min(text.length, at + 150);
		return (start > 0 ? '… ' : '') + text.slice(start, end) + (end < text.length ? ' …' : '');
	}

	function render(query) {
		var terms = tokenize(query);
		panel.innerHTML = '';

		if (!terms.length) {
			panel.hidden = true;
			if (hintBar) {
				hintBar.hidden = false;
			}
			return;
		}

		var hits = rank(query).slice(0, 6);
		panel.hidden = false;
		if (hintBar) {
			hintBar.hidden = true;
		}

		if (!hits.length) {
			panel.innerHTML = '<p class="empty">Nothing in the record matches <strong>' + escape(query) + '</strong>. Try <button type="button" class="linkish" data-q="retrieval">retrieval</button>, <button type="button" class="linkish" data-q="speech">speech</button> or <button type="button" class="linkish" data-q="mdr">MDR</button>.</p>';
			return;
		}

		var count = document.createElement('p');
		count.className = 'count';
		count.textContent = hits.length + (hits.length === 1 ? ' entry' : ' entries') + ' matching';
		panel.appendChild(count);

		hits.forEach(function (hit, index) {
			var entry = hit.entry;
			var row = document.createElement('a');
			row.className = 'hit';
			row.href = '#' + entry.section;
			row.style.setProperty('--i', index);
			row.innerHTML =
				'<span class="hit-label">' + escape(entry.label) + '</span>' +
				'<span class="hit-title">' + mark(entry.title, terms) + '</span>' +
				'<span class="hit-text">' + mark(excerpt(entry.text, terms), terms) + '</span>';
			row.addEventListener('click', function () {
				document.getElementById(entry.section).classList.add('flash');
				window.setTimeout(function () {
					document.getElementById(entry.section).classList.remove('flash');
				}, 1600);
			});
			panel.appendChild(row);
		});
	}

	input.addEventListener('input', function () {
		render(input.value);
	});

	input.addEventListener('keydown', function (event) {
		if (event.key === 'Escape') {
			input.value = '';
			render('');
			input.blur();
			return;
		}
		if (event.key === 'Enter') {
			event.preventDefault();
			var first = panel.querySelector('.hit');
			if (first) {
				first.click();
			}
		}
	});

	document.addEventListener('keydown', function (event) {
		if (event.key === '/' && document.activeElement !== input) {
			event.preventDefault();
			input.focus();
		}
	});

	document.addEventListener('click', function (event) {
		var chip = event.target.closest('[data-q]');
		if (!chip) {
			return;
		}
		input.value = chip.getAttribute('data-q');
		input.focus();
		render(input.value);
	});

	/* --- the chart draws once, when it is actually on screen --- */

	var charts = Array.prototype.slice.call(document.querySelectorAll('[data-chart]'));

	if (charts.length) {
		if (!('IntersectionObserver' in window)) {
			charts.forEach(function (chart) { chart.classList.add('is-visible'); });
		} else {
			var chartObserver = new IntersectionObserver(function (entries) {
				entries.forEach(function (entry) {
					if (entry.isIntersecting) {
						entry.target.classList.add('is-visible');
						chartObserver.unobserve(entry.target);
					}
				});
			}, { threshold: 0.4 });

			charts.forEach(function (chart) { chartObserver.observe(chart); });
		}
	}

	var year = document.getElementById('year');
	if (year) {
		year.textContent = new Date().getFullYear();
	}
}());
