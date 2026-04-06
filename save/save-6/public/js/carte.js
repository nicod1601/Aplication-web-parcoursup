const SERIE_COLORS = {
	'Générale':                   '#3B82F6',
	'STI2D':                      '#EF4444',
	'STMG':                       '#F59E0B',
	'ST2S':                       '#10B981',
	'STL':                        '#8B5CF6',
	'STAV':                       '#06B6D4',
	'STD2A':                      '#EC4899',
	'Bac Professionnel':          '#84CC16',
	'Bac Professionnel Agricole': '#84CC16',
};

function getColor(codeSerie) {
	for (const [key, color] of Object.entries(SERIE_COLORS)) {
		if (codeSerie && codeSerie.toLowerCase().includes(key.toLowerCase())) return color;
	}
	const hash = [...(codeSerie || 'X')].reduce((acc, c) => acc + c.charCodeAt(0), 0);
	const palette = ['#6366F1', '#F97316', '#14B8A6', '#A855F7', '#EAB308', '#64748B'];
	return palette[hash % palette.length];
}

let map            = null;
let allCandidats   = [];
let allSeries      = [];
let markersMap     = {};
let seriesVisible  = {};

function initMap() {
	if (map) { map.remove(); map = null; }

	map = L.map('carte-leaflet', {
		center: [46.603354, 1.888334],
		zoom: 6,
		zoomControl: true,
	});

	L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
		attribution: '© OpenStreetMap © CARTO',
		subdomains: 'abcd',
		maxZoom: 19,
	}).addTo(map);
}

async function chargerCarte(annee) {
	document.getElementById('carte-loading').style.display = 'flex';
	document.getElementById('loading-msg').textContent = 'Chargement des données...';

	try {
		const cacheKey = `carte_${annee}`;
		const cached   = sessionStorage.getItem(cacheKey);
		let data;

		if (cached) {
			data = JSON.parse(cached);
		} else {
			const res = await fetch(`/carte_data.php?annee=${encodeURIComponent(annee)}`);
			if (!res.ok) throw new Error('Erreur serveur');
			data = await res.json();
			if (!data.success) throw new Error(data.error || 'Erreur inconnue');

			document.getElementById('loading-msg').textContent = 'Géocodage des adresses...';
			data.candidats = await geocoderCandidats(data.candidats);

			sessionStorage.setItem(cacheKey, JSON.stringify(data));
		}

		allCandidats  = data.candidats;
		allSeries     = data.series;

		seriesVisible = {};
		allSeries.forEach(s => seriesVisible[s.codeseriedip] = true);

		initMap();
		afficherMarkers();
		afficherLegende();
		afficherFilterBar();
		afficherStats();

		document.getElementById('legende-block').style.display = 'block';
		document.getElementById('stats-block').style.display   = 'block';
		document.getElementById('filter-bar').style.display    = 'flex';

	} catch (err) {
		console.error('Erreur carte:', err);
		alert('Impossible de charger les données : ' + err.message);
	} finally {
		document.getElementById('carte-loading').style.display = 'none';
	}
}

const PAYS_COORDS = {
	'Maroc':              [31.79, -7.09],
	'Algérie':            [28.03,  1.66],
	'Tunisie':            [33.89,  9.54],
	'Sénégal':            [14.50,-14.45],
	'Cameroun':           [ 3.85, 11.50],
	"Côte d'Ivoire":      [ 7.54, -5.55],
	'Madagascar':         [-18.77, 46.87],
	'Congo':              [-0.23,  15.83],
	'Guinée':             [ 9.95,  -9.70],
	'Mali':               [17.57,  -4.00],
	'Liban':              [33.85,  35.86],
	'Belgique':           [50.50,   4.47],
	'Suisse':             [46.82,   8.23],
	'Luxembourg':         [49.82,   6.13],
	'Espagne':            [40.46,  -3.75],
	'Italie':             [41.87,  12.57],
	'Portugal':           [39.40,  -8.22],
	'Allemagne':          [51.17,  10.45],
	'Royaume-Uni':        [55.38,  -3.44],
	'États-Unis':         [37.09, -95.71],
	'Canada':             [56.13,-106.35],
	'Chine':              [35.86, 104.20],
	'Japon':              [36.20, 138.25],
	'Brésil':             [-14.24,-51.93],
	'Gabon':              [-0.80,  11.61],
	'Togo':               [ 8.62,   0.82],
	'Bénin':              [ 9.31,   2.32],
	'Burkina Faso':       [12.36,  -1.56],
};

async function geocoderCandidats(candidats) {
	const etrangers = candidats.filter(c => c.pays && c.pays !== 'France');
	const francais  = candidats.filter(c => !c.pays || c.pays === 'France');

	etrangers.forEach(c => {
		const base = PAYS_COORDS[c.pays] || [20.0, 10.0];
		const offset = deterministicOffset(c.codepost + c.pays);
		c.lat = base[0] + offset[0];
		c.lng = base[1] + offset[1];
	});

	if (francais.length === 0) return candidats;

	const codesUniques = [...new Set(francais.map(c => c.codepost).filter(Boolean))];

	if (codesUniques.length === 0) {
		francais.forEach(c => { c.lat = 46.6; c.lng = 1.9; });
		return candidats;
	}

	const coordsMap = await geocoderCodesBatch(codesUniques);

	francais.forEach(c => {
		const cp = c.codepost;
		if (cp && coordsMap[cp]) {
			const offset = deterministicOffset(String(c.idcand || c.codecand) + cp);
			c.lat = coordsMap[cp][0] + offset[0];
			c.lng = coordsMap[cp][1] + offset[1];
		} else {
			// Fallback : centre de France si le code postal n'est pas géocodé
			c.lat = 46.6 + deterministicOffset(cp || 'xx')[0];
			c.lng = 1.9  + deterministicOffset(cp || 'xx')[1];
		}
	});

	return candidats;
}

async function geocoderCodesBatch(codes) {
	const csv      = 'postcode\n' + codes.join('\n');
	const formData = new FormData();
	formData.append('data', new Blob([csv], { type: 'text/csv' }), 'codes.csv');
	formData.append('columns', 'postcode');
	formData.append('result_columns', 'latitude,longitude');

	try {
		const res = await fetch('https://api-adresse.data.gouv.fr/search/csv/', {
			method: 'POST',
			body: formData,
		});

		if (!res.ok) {
			console.warn('API adresse.data.gouv.fr indisponible, fallback activé');
			return {};
		}

		const text = await res.text();
		return parseCsvCoords(text);

	} catch (err) {
		console.warn('Erreur API géocodage :', err);
		return {};
	}
}

function parseCsvCoords(csvText) {
	const lines   = csvText.trim().split('\n');
	const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
	const idxCode = headers.indexOf('postcode');
	const idxLat  = headers.indexOf('latitude');
	const idxLng  = headers.indexOf('longitude');

	if (idxCode === -1 || idxLat === -1 || idxLng === -1) return {};

	const result = {};
	for (let i = 1; i < lines.length; i++) {
		const cols = lines[i].split(',');
		const code = cols[idxCode]?.replace(/"/g, '').trim();
		const lat  = parseFloat(cols[idxLat]);
		const lng  = parseFloat(cols[idxLng]);
		if (code && !isNaN(lat) && !isNaN(lng)) {
			result[code] = [lat, lng];
		}
	}
	return result;
}

function deterministicOffset(str) {
	let hash = 0;
	for (let i = 0; i < (str || '').length; i++) {
		hash = (hash * 31 + str.charCodeAt(i)) | 0;
	}
	const lat = ((hash & 0xFF) / 255 - 0.5) * 0.10; // Réduction du jitter
	const lng = (((hash >> 8) & 0xFF) / 255 - 0.5) * 0.10; // Réduction du jitter
	return [lat, lng];
}

function afficherMarkers() {
	Object.values(markersMap).forEach(lg => lg.remove());
	markersMap = {};

	const bySerie = {};
	allCandidats.forEach(c => {
		const key = c.codeseriedip || c.libseriedip || 'Inconnu';
		if (!bySerie[key]) bySerie[key] = [];
		bySerie[key].push(c);
	});

	Object.entries(bySerie).forEach(([serie, candidats]) => {
		const color      = getColor(serie);
		const layerGroup = L.layerGroup();

		candidats.forEach(c => {
			if (!c.lat || !c.lng) return;

			const marker = L.circleMarker([parseFloat(c.lat), parseFloat(c.lng)], {
				radius:      7,
				fillColor:   color,
				color:       '#ffffff',
				weight:      1.5,
				opacity:     1,
				fillOpacity: 0.85,
			});

			marker.bindPopup(`
				<div class="popup-carte">
					<strong>${escHtml(c.nomcand)} ${escHtml(c.prenomcand)}</strong><br>
					<span class="popup-serie" style="background:${color}20;color:${color};">${escHtml(c.libseriedip)}</span><br>
					<small>📍 ${escHtml(c.nomcommu)} (${escHtml(c.nomdept)})</small><br>
					<small>📊 Note lycée : <strong>${parseFloat(c.notelycee || 0).toFixed(2)}</strong></small><br>
					<small>⭐ Note globale : <strong>${parseFloat(c.noteglobale || 0).toFixed(2)}</strong></small>
				</div>
			`, { maxWidth: 240 });

			marker.addTo(layerGroup);
		});

		layerGroup.addTo(map);
		markersMap[serie] = layerGroup;
	});
}

function afficherLegende() {
	const container = document.getElementById('legende-container');
	container.innerHTML = '';

	allSeries.forEach(s => {
		const color = getColor(s.codeseriedip);
		const count = allCandidats.filter(c => c.codeseriedip === s.codeseriedip).length;

		const item = document.createElement('div');
		item.className  = 'legende-item';
		item.dataset.serie = s.codeseriedip;
		item.innerHTML  = `
			<span class="legende-dot" style="background:${color};"></span>
			<span class="legende-lib">${escHtml(s.libseriedip)}</span>
			<span class="legende-count">${count}</span>
		`;

		item.addEventListener('click', () => {
			seriesVisible[s.codeseriedip] = !seriesVisible[s.codeseriedip];
			mettreAJourVisibilite();
			item.classList.toggle('legende-item--off', !seriesVisible[s.codeseriedip]);
			const cb = document.querySelector(`#filter-checkboxes input[data-serie="${s.codeseriedip}"]`);
			if (cb) cb.checked = seriesVisible[s.codeseriedip];
		});

		container.appendChild(item);
	});
}

function afficherFilterBar() {
	const container = document.getElementById('filter-checkboxes');
	container.innerHTML = '';

	allSeries.forEach(s => {
		const color = getColor(s.codeseriedip);
		const label = document.createElement('label');
		label.className = 'filter-check-label';
		label.innerHTML = `
			<input type="checkbox" data-serie="${escHtml(s.codeseriedip)}" checked>
			<span class="filter-check-dot" style="background:${color};"></span>
			${escHtml(s.codeseriedip)}
		`;
		const cb = label.querySelector('input');
		cb.addEventListener('change', () => {
			seriesVisible[s.codeseriedip] = cb.checked;
			mettreAJourVisibilite();
			const legItem = document.querySelector(`.legende-item[data-serie="${s.codeseriedip}"]`);
			if (legItem) legItem.classList.toggle('legende-item--off', !cb.checked);
		});
		container.appendChild(label);
	});

	document.getElementById('btn-tout-cocher').addEventListener('click', () => {
		allSeries.forEach(s => { seriesVisible[s.codeseriedip] = true; });
		document.querySelectorAll('#filter-checkboxes input').forEach(cb => cb.checked = true);
		document.querySelectorAll('.legende-item').forEach(el => el.classList.remove('legende-item--off'));
		mettreAJourVisibilite();
	});

	document.getElementById('btn-tout-decocher').addEventListener('click', () => {
		allSeries.forEach(s => { seriesVisible[s.codeseriedip] = false; });
		document.querySelectorAll('#filter-checkboxes input').forEach(cb => cb.checked = false);
		document.querySelectorAll('.legende-item').forEach(el => el.classList.add('legende-item--off'));
		mettreAJourVisibilite();
	});
}

function mettreAJourVisibilite() {
	Object.entries(markersMap).forEach(([serie, layerGroup]) => {
		if (seriesVisible[serie]) {
			if (!map.hasLayer(layerGroup)) layerGroup.addTo(map);
		} else {
			if (map.hasLayer(layerGroup)) map.removeLayer(layerGroup);
		}
	});
}

function afficherStats() {
	const container = document.getElementById('stats-container');
	const total     = allCandidats.length;
	const depts     = new Set(allCandidats.map(c => c.nomdept)).size;

	container.innerHTML = `
		<div class="stat-mini">
			<span class="stat-mini-val">${total}</span>
			<span class="stat-mini-lib">candidats</span>
		</div>
		<div class="stat-mini">
			<span class="stat-mini-val">${depts}</span>
			<span class="stat-mini-lib">départements</span>
		</div>
		<div class="stat-mini">
			<span class="stat-mini-val">${allSeries.length}</span>
			<span class="stat-mini-lib">séries</span>
		</div>
	`;
}

window.addEventListener('load', async () => {
	try {
		const res  = await fetch('/loadTableau.php');
		const data = await res.json();

		const select = document.getElementById('annee-select');
		if (data.annees && data.annees.length > 0) {
			data.annees.forEach(a => {
				const opt       = document.createElement('option');
				opt.value       = a.value;
				opt.textContent = a.value;
				select.appendChild(opt);
			});
		}
	} catch (err) {
		console.error('Erreur init:', err);
	}
});

document.getElementById('annee-select').addEventListener('change', function () {
	if (this.value) chargerCarte(this.value);
});

function escHtml(str) {
	if (!str) return '';
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g,  '&lt;')
		.replace(/>/g,  '&gt;')
		.replace(/"/g,  '&quot;');
}