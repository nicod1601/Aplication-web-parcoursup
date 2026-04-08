// ============================================================
// CARTE.JS — Un marker par établissement, clé unifiée
// API : data.education.gouv.fr (annuaire éducation)
// ============================================================

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

let map           = null;
let allCandidats  = [];
let allSeries     = [];
let markersMap    = {};
let seriesVisible = {};
let iutCoords     = null; // { lat, lng } — coordonnées de l'IUT

// Cache géocodage : clé normaliserNom(nom)|codepost → { lat, lng }
const etabGeoCache = {};

// ============================================================
// CLÉ UNIQUE — utilisée partout pour éviter les désynchronisations
// ============================================================
function normaliserNom(str) {
	return (str || '')
		.trim()
		.toUpperCase()
		.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
		.replace(/[^A-Z0-9]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function etabKey(nometab, codepost) {
	return `${normaliserNom(nometab)}|${(codepost || '').trim()}`;
}

// ============================================================
// CALCUL DE DISTANCE (formule de Haversine)
// ============================================================
function distanceKm(lat1, lng1, lat2, lng2) {
	const R    = 6371;
	const dLat = (lat2 - lat1) * Math.PI / 180;
	const dLng = (lng2 - lng1) * Math.PI / 180;
	const a    = Math.sin(dLat / 2) * Math.sin(dLat / 2)
	           + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
	           * Math.sin(dLng / 2) * Math.sin(dLng / 2);
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ============================================================
// INITIALISATION DE LA CARTE
// ============================================================
async function initMap() {
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

	// ── Géocodage automatique de l'IUT via l'API adresse.data.gouv.fr ──
	try {
		const res  = await fetch('https://api-adresse.data.gouv.fr/search/?q=19+Rue+Boris+Vian+76610+Le+Havre&limit=1');
		const data = await res.json();

		if (data.features && data.features.length > 0) {
			const [lng, lat] = data.features[0].geometry.coordinates;
			iutCoords = { lat, lng };

			L.marker([lat, lng], {
				icon: L.divIcon({
					className: 'special-marker-iut',
					html: '<div style="background:#C0185C; color:white; border-radius:50%; width:34px; height:34px; display:flex; align-items:center; justify-content:center; border:3px solid white; box-shadow:0 0 15px rgba(192, 24, 92, 0.4); font-size:1.2rem;">🎓</div>',
					iconSize: [34, 34],
					iconAnchor: [17, 17]
				})
			}).addTo(map).bindPopup(`
				<div style="text-align:center; min-width:160px; font-family: 'IBM Plex Sans', sans-serif;">
					<strong style="color:#0D1B3E; font-size:0.9rem; display:block; margin-bottom:4px;">IUT Informatique du Havre</strong>
					<hr style="margin:5px 0; border:0; border-top:1px solid #d4ddf7;">
					<span style="font-size:0.75rem; color:#6b7a99;">📍 Rue Boris Vian, 76610 Le Havre</span>
				</div>
			`);
		}
	} catch (err) {
		console.warn('Géocodage IUT échoué:', err);
	}
}

// ============================================================
// CHARGEMENT PRINCIPAL
// ============================================================
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

			data.candidats = data.candidats.map(c => {
				const normalized = {};
				for (const [k, v] of Object.entries(c)) {
					normalized[k.toLowerCase()] = v;
				}
				return normalized;
			});

			document.getElementById('loading-msg').textContent = 'Géocodage des établissements...';
			data.candidats = await geocoderParEtablissement(data.candidats);

			sessionStorage.setItem(cacheKey, JSON.stringify(data));
		}

		allCandidats  = data.candidats;
		allSeries     = data.series;

		seriesVisible = {};
		allSeries.forEach(s => seriesVisible[s.codeseriedip] = true);

		await initMap();
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

// ============================================================
// GÉOCODAGE PAR ÉTABLISSEMENT
// ============================================================

const PAYS_COORDS = {
	'Maroc':              [31.79,  -7.09],
	'Algérie':            [28.03,   1.66],
	'Tunisie':            [33.89,   9.54],
	'Sénégal':            [14.50, -14.45],
	'Cameroun':           [ 3.85,  11.50],
	"Côte d'Ivoire":      [ 7.54,  -5.55],
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
	'Chine':              [35.86, 104.19],
};

async function geocoderParEtablissement(candidats) {
	const etrangers = candidats.filter(c => c.pays && c.pays !== 'France');
	const francais  = candidats.filter(c => !c.pays || c.pays === 'France');

	etrangers.forEach(c => {
		const base   = PAYS_COORDS[c.pays] || [20.0, 10.0];
		const offset = deterministicOffset(String(c.idcand || c.codecand) + c.pays);
		c.lat = base[0] + offset[0];
		c.lng = base[1] + offset[1];
	});

	if (francais.length === 0) return candidats;

	const etablissementsUniques = {};
	francais.forEach(c => {
		const key = etabKey(c.nometab, c.codepost);
		if (!etablissementsUniques[key]) {
			etablissementsUniques[key] = {
				nom:     (c.nometab  || '').trim(),
				cp:      (c.codepost || '').trim(),
				commune: (c.nomcommu || '').trim(),
				dept:    c.nomdept  || '',
			};
		}
	});

	const keys = Object.keys(etablissementsUniques);
	document.getElementById('loading-msg').textContent =
		`Géocodage de ${keys.length} établissements…`;

	const BATCH = 10;
	for (let i = 0; i < keys.length; i += BATCH) {
		const batch = keys.slice(i, i + BATCH);
		await Promise.all(
			batch.map(key => geocoderUnEtablissement(key, etablissementsUniques[key]))
		);
		document.getElementById('loading-msg').textContent =
			`Géocodage… ${Math.min(i + BATCH, keys.length)} / ${keys.length}`;
	}

	francais.forEach(c => {
		const key    = etabKey(c.nometab, c.codepost);
		const coords = etabGeoCache[key];
		if (coords) {
			c.lat = coords.lat;
			c.lng = coords.lng;
		} else {
			c.lat = 46.6;
			c.lng = 1.9;
		}
	});

	return candidats;
}

async function geocoderUnEtablissement(key, etab) {
	if (etabGeoCache[key]) return;

	// ── Stratégie 1 : API Annuaire Éducation Nationale ──
	try {
		const nomClean  = (etab.nom || '').replace(/["']/g, ' ');
		const nomEncode = encodeURIComponent(nomClean);
		const cp        = String(etab.cp || '').trim();

		const url = 'https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-annuaire-education/records'
			+ `?where=search(nom_etablissement%2C%20%22${nomEncode}%22)%20and%20code_postal%3D%22${cp}%22`
			+ '&limit=1&select=latitude%2Clongitude';

		const res  = await fetch(url);
		if (res.ok) {
			const data = await res.json();
			if (data.results && data.results.length > 0) {
				const r   = data.results[0];
				const lat = parseFloat(r.latitude);
				const lng = parseFloat(r.longitude);
				if (!isNaN(lat) && !isNaN(lng)) {
					etabGeoCache[key] = { lat, lng };
					return;
				}
			}
		}
	} catch (err) {
		console.warn('API Éducation échouée pour', etab.nom, ':', err);
	}

	// ── Stratégie 2 : fallback code postal ──
	await geocoderFallbackCodePostal(key, etab);
}

async function geocoderFallbackCodePostal(key, etab) {
	if (etabGeoCache[key]) return;
	const cp = etab.cp || '';
	if (!cp) return;

	try {
		const url  = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(cp)}&postcode=${encodeURIComponent(cp)}&limit=1`;
		const res  = await fetch(url);
		if (!res.ok) return;
		const data = await res.json();

		if (data.features && data.features.length > 0) {
			const [lng, lat] = data.features[0].geometry.coordinates;
			etabGeoCache[key] = { lat, lng };
		}
	} catch (err) {
		console.warn('Fallback code postal échoué pour', etab.nom, ':', err);
	}
}

function deterministicOffset(str) {
	let hash = 0;
	for (let i = 0; i < (str || '').length; i++) {
		hash = (hash * 31 + str.charCodeAt(i)) | 0;
	}
	const lat = ((hash & 0xFF) / 255 - 0.5) * 0.06;
	const lng = (((hash >> 8) & 0xFF) / 255 - 0.5) * 0.06;
	return [lat, lng];
}

// ============================================================
// AFFICHAGE DES MARKERS — UN SEUL PAR ÉTABLISSEMENT
// ============================================================
function afficherMarkers() {
	Object.values(markersMap).forEach(lg => lg.remove());
	markersMap = {};

	const etablissements = {};
	allCandidats.forEach(c => {
		if (!c.lat || !c.lng) return;
		const key = etabKey(c.nometab, c.codepost);
		if (!etablissements[key]) {
			etablissements[key] = {
				nom:       c.nometab  || '—',
				commune:   c.nomcommu || '—',
				dept:      c.nomdept  || '—',
				lat:       parseFloat(c.lat),
				lng:       parseFloat(c.lng),
				candidats: [],
			};
		}
		etablissements[key].candidats.push(c);
	});

	const layersBySerie = {};

	Object.values(etablissements).forEach(etab => {
		const countBySerie = {};
		etab.candidats.forEach(c => {
			const s = c.codeseriedip || 'Inconnu';
			countBySerie[s] = (countBySerie[s] || 0) + 1;
		});

		const serieDominante = Object.entries(countBySerie)
			.sort((a, b) => b[1] - a[1])[0][0];
		const color = getColor(serieDominante);

		const seriesResume = Object.entries(countBySerie)
			.sort((a, b) => b[1] - a[1])
			.map(([s, n]) => `
				<span style="
					background:${getColor(s)}20;
					color:${getColor(s)};
					padding:1px 6px;
					border-radius:3px;
					margin:2px;
					display:inline-block;
					font-size:0.75rem;
				">${escHtml(s)} (${n})</span>
			`).join('');

		// ── Indicateur de distance par rapport à l'IUT ──
		const distLine = iutCoords
			? (() => {
				const d      = distanceKm(etab.lat, etab.lng, iutCoords.lat, iutCoords.lng);
				const label  = d < 1
					? `${Math.round(d * 1000)} m de l'IUT`
					: `${d.toFixed(1)} km de l'IUT`;
				const couleur = d < 50 ? '#10B981' : d < 100 ? '#F59E0B' : '#EF4444';
				return `
					<div style="
						margin-top:6px;
						padding:4px 8px;
						background:${couleur}18;
						border-left:3px solid ${couleur};
						border-radius:3px;
						font-size:0.75rem;
						color:${couleur};
						font-weight:600;
					">📏 ${label}</div>`;
			})()
			: '';

		const marker = L.circleMarker([etab.lat, etab.lng], {
			radius:      7,
			fillColor:   color,
			color:       '#ffffff',
			weight:      1.5,
			opacity:     1,
			fillOpacity: 0.85,
		});

		marker.bindPopup(`
			<div class="popup-carte">
				<strong>🏫 ${escHtml(etab.nom)}</strong><br>
				<small>📍 ${escHtml(etab.commune)} (${escHtml(etab.dept)})</small><br>
				<div style="margin-top:6px;line-height:1.8;">${seriesResume}</div>
				${distLine}
				<small style="color:#888;margin-top:5px;display:block;">
					${etab.candidats.length} candidat(s)
				</small>
			</div>
		`, { maxWidth: 300 });

		if (!layersBySerie[serieDominante]) {
			layersBySerie[serieDominante] = L.layerGroup();
		}
		marker.addTo(layersBySerie[serieDominante]);
	});

	Object.entries(layersBySerie).forEach(([serie, lg]) => {
		lg.addTo(map);
		markersMap[serie] = lg;
	});
}

// ============================================================
// LÉGENDE
// ============================================================
function afficherLegende() {
	const container = document.getElementById('legende-container');
	container.innerHTML = '';

	const seriesSorted = [...allSeries].sort((a, b) => {
		const countA = allCandidats.filter(c => c.codeseriedip === a.codeseriedip).length;
		const countB = allCandidats.filter(c => c.codeseriedip === b.codeseriedip).length;
		return countB - countA;
	});

	seriesSorted.forEach(s => {
		const color = getColor(s.codeseriedip);
		const count = allCandidats.filter(c => c.codeseriedip === s.codeseriedip).length;
		const pct   = allCandidats.length > 0
			? Math.round((count / allCandidats.length) * 100)
			: 0;

		const item = document.createElement('div');
		item.className     = 'legende-item';
		item.dataset.serie = s.codeseriedip;
		item.innerHTML = `
			<span class="legende-dot" style="background:${color};"></span>
			<div class="legende-lib-wrap" style="flex:1;min-width:0;">
				<span class="legende-lib" style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"
				      title="${escHtml(s.libseriedip)}">${escHtml(s.libseriedip)}</span>
				<div style="background:#e5e7eb;border-radius:2px;height:3px;margin-top:3px;">
					<div style="background:${color};width:${pct}%;height:3px;border-radius:2px;transition:width .3s;"></div>
				</div>
			</div>
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

// ============================================================
// BARRE DE FILTRES
// ============================================================
function afficherFilterBar() {
	const container = document.getElementById('filter-checkboxes');
	container.innerHTML = '';

	allSeries.forEach(s => {
		const color = getColor(s.codeseriedip);
		const count = allCandidats.filter(c => c.codeseriedip === s.codeseriedip).length;
		const label = document.createElement('label');
		label.className = 'filter-check-label';
		label.title     = `${s.libseriedip} — ${count} candidat(s)`;
		label.innerHTML = `
			<input type="checkbox" data-serie="${escHtml(s.codeseriedip)}" checked>
			<span class="filter-check-dot" style="background:${color};"></span>
			${escHtml(s.codeseriedip)} <span style="font-size:0.65rem;color:#888;margin-left:2px;">(${count})</span>
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

	document.getElementById('btn-tout-cocher').onclick = () => {
		allSeries.forEach(s => { seriesVisible[s.codeseriedip] = true; });
		document.querySelectorAll('#filter-checkboxes input').forEach(cb => cb.checked = true);
		document.querySelectorAll('.legende-item').forEach(el => el.classList.remove('legende-item--off'));
		mettreAJourVisibilite();
	};

	document.getElementById('btn-tout-decocher').onclick = () => {
		allSeries.forEach(s => { seriesVisible[s.codeseriedip] = false; });
		document.querySelectorAll('#filter-checkboxes input').forEach(cb => cb.checked = false);
		document.querySelectorAll('.legende-item').forEach(el => el.classList.add('legende-item--off'));
		mettreAJourVisibilite();
	};
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

// ============================================================
// STATISTIQUES
// ============================================================
function afficherStats() {
	const container = document.getElementById('stats-container');
	const total     = allCandidats.length;

	const etabsUniques = new Set(
		allCandidats
			.filter(c => c.nometab)
			.map(c => etabKey(c.nometab, c.codepost))
	).size;

	const depts  = new Set(allCandidats.map(c => c.nomdept).filter(Boolean)).size;
	const series = allSeries.length;

	container.innerHTML = `
		<div class="stat-mini">
			<span class="stat-mini-val">${total}</span>
			<span class="stat-mini-lib">candidats</span>
		</div>
		<div class="stat-mini">
			<span class="stat-mini-val">${etabsUniques}</span>
			<span class="stat-mini-lib">établissements</span>
		</div>
		<div class="stat-mini">
			<span class="stat-mini-val">${depts}</span>
			<span class="stat-mini-lib">départements</span>
		</div>
		<div class="stat-mini">
			<span class="stat-mini-val">${series}</span>
			<span class="stat-mini-lib">séries</span>
		</div>
	`;
}

// ============================================================
// INITIALISATION
// ============================================================
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
	if (this.value) {
		chargerCarte(this.value);
	}
});

// ============================================================
// RECHERCHE SIDEBAR
// ============================================================
document.getElementById('carte-search').addEventListener('input', function () {
	const q = this.value.toLowerCase().trim();
	if (!q) {
		Object.entries(markersMap).forEach(([serie, lg]) => {
			if (seriesVisible[serie] && !map.hasLayer(lg)) lg.addTo(map);
		});
		return;
	}

	document.querySelectorAll('.legende-item').forEach(item => {
		const lib = (item.querySelector('.legende-lib')?.textContent || '').toLowerCase();
		item.style.opacity = lib.includes(q) ? '1' : '0.3';
	});
});

// ============================================================
// UTILITAIRE
// ============================================================
function escHtml(str) {
	if (!str) return '';
	return String(str)
		.replace(/&/g,  '&amp;')
		.replace(/</g,  '&lt;')
		.replace(/>/g,  '&gt;')
		.replace(/"/g,  '&quot;');
}