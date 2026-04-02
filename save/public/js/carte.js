// public/js/carte.js

// ============================================================
// COULEURS PAR SÉRIE DE BAC
// ============================================================
const SERIE_COLORS = {
    'Générale':               '#3B82F6', // bleu
    'STI2D':                  '#EF4444', // rouge
    'STMG':                   '#F59E0B', // orange
    'ST2S':                   '#10B981', // vert
    'STL':                    '#8B5CF6', // violet
    'STAV':                   '#06B6D4', // cyan
    'STD2A':                  '#EC4899', // rose
    'Bac Professionnel':      '#84CC16', // vert clair
    'Bac Professionnel Agricole': '#84CC16',
};

function getColor(codeSerie) {
    for (const [key, color] of Object.entries(SERIE_COLORS)) {
        if (codeSerie && codeSerie.toLowerCase().includes(key.toLowerCase())) return color;
    }
    // Couleur de fallback déterministe
    const hash = [...(codeSerie || 'X')].reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const palette = ['#6366F1','#F97316','#14B8A6','#A855F7','#EAB308','#64748B'];
    return palette[hash % palette.length];
}

// ============================================================
// ÉTAT GLOBAL
// ============================================================
let map = null;
let allCandidats = [];
let allSeries    = [];
let markersMap   = {}; // codeSerieDip → L.LayerGroup
let seriesVisible = {}; // codeSerieDip → bool
let selectedMarkerCandidats = [];

// ============================================================
// INITIALISATION CARTE LEAFLET
// ============================================================
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

// ============================================================
// CHARGEMENT DES DONNÉES
// ============================================================
async function chargerCarte(annee) {
    document.getElementById('carte-loading').style.display = 'flex';

    try {
        // 1. Vérifier le sessionStorage
        const cacheKey = `carte_${annee}`;
        const cached = sessionStorage.getItem(cacheKey);

        let data;
        if (cached) {
            data = JSON.parse(cached);
        } else {
            const res = await fetch(`/carte_data.php?annee=${encodeURIComponent(annee)}`);
            if (!res.ok) throw new Error('Erreur serveur');
            data = await res.json();
            if (!data.success) throw new Error(data.error || 'Erreur inconnue');
            // Stocker dans sessionStorage (perdu à la fermeture de l'onglet)
            sessionStorage.setItem(cacheKey, JSON.stringify(data));
        }

        allCandidats = data.candidats;
        allSeries    = data.series;

        // Initialiser visibilité
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
        document.getElementById('table-wrapper').style.display = 'block';

        mettreAJourTableau(allCandidats);

    } catch (err) {
        console.error('Erreur carte:', err);
        alert('Impossible de charger les données : ' + err.message);
    } finally {
        document.getElementById('carte-loading').style.display = 'none';
    }
}

// ============================================================
// MARKERS LEAFLET
// ============================================================
function afficherMarkers() {
    // Supprimer les anciens layers
    Object.values(markersMap).forEach(lg => lg.remove());
    markersMap = {};

    // Grouper par série
    const bySerie = {};
    allCandidats.forEach(c => {
        const key = c.codeseriedip || c.libseriedip || 'Inconnu';
        if (!bySerie[key]) bySerie[key] = [];
        bySerie[key].push(c);
    });

    Object.entries(bySerie).forEach(([serie, candidats]) => {
        const color = getColor(serie);
        const layerGroup = L.layerGroup();

        candidats.forEach(c => {
            if (!c.lat || !c.lng) return;

            const marker = L.circleMarker([parseFloat(c.lat), parseFloat(c.lng)], {
                radius: 7,
                fillColor: color,
                color: '#ffffff',
                weight: 1.5,
                opacity: 1,
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

            marker.on('click', () => {
                // Filtrer tous les candidats de la même commune
                const communeCandidats = allCandidats.filter(
                    x => x.nomcommu === c.nomcommu && seriesVisible[x.codeseriedip || x.libseriedip]
                );
                mettreAJourTableau(communeCandidats, `Candidats de ${c.nomcommu}`);
            });

            marker.addTo(layerGroup);
        });

        layerGroup.addTo(map);
        markersMap[serie] = layerGroup;
    });
}

// ============================================================
// LÉGENDE
// ============================================================
function afficherLegende() {
    const container = document.getElementById('legende-container');
    container.innerHTML = '';

    allSeries.forEach(s => {
        const color = getColor(s.codeseriedip);
        const count = allCandidats.filter(c => c.codeseriedip === s.codeseriedip).length;

        const item = document.createElement('div');
        item.className = 'legende-item';
        item.dataset.serie = s.codeseriedip;
        item.innerHTML = `
            <span class="legende-dot" style="background:${color};"></span>
            <span class="legende-lib">${escHtml(s.libseriedip)}</span>
            <span class="legende-count">${count}</span>
        `;

        item.addEventListener('click', () => {
            const visible = seriesVisible[s.codeseriedip];
            seriesVisible[s.codeseriedip] = !visible;
            mettreAJourVisibilite();
            item.classList.toggle('legende-item--off', !seriesVisible[s.codeseriedip]);
            // Sync checkbox
            const cb = document.querySelector(`#filter-checkboxes input[data-serie="${s.codeseriedip}"]`);
            if (cb) cb.checked = seriesVisible[s.codeseriedip];
        });

        container.appendChild(item);
    });
}

// ============================================================
// BARRE DE FILTRES (checkboxes)
// ============================================================
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
            // Sync légende
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

    // Mettre à jour le tableau avec les candidats visibles
    const visibles = allCandidats.filter(c => seriesVisible[c.codeseriedip]);
    mettreAJourTableau(visibles);
}

// ============================================================
// STATISTIQUES
// ============================================================
function afficherStats() {
    const container = document.getElementById('stats-container');
    const total = allCandidats.length;
    const depts = new Set(allCandidats.map(c => c.nomdept)).size;

    container.innerHTML = `
        <div class="stat-mini"><span class="stat-mini-val">${total}</span><span class="stat-mini-lib">candidats</span></div>
        <div class="stat-mini"><span class="stat-mini-val">${depts}</span><span class="stat-mini-lib">départements</span></div>
        <div class="stat-mini"><span class="stat-mini-val">${allSeries.length}</span><span class="stat-mini-lib">séries</span></div>
    `;
}

// ============================================================
// TABLEAU DES CANDIDATS
// ============================================================
function mettreAJourTableau(candidats, titre = 'Tous les candidats') {
    document.getElementById('table-title').textContent = titre;
    document.getElementById('table-count').textContent = candidats.length;

    const tbody = document.getElementById('carte-table-body');
    tbody.innerHTML = '';

    candidats.slice(0, 200).forEach(c => { // Limité à 200 pour les perfs
        const color = getColor(c.codeseriedip);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escHtml(c.nomcand)}</td>
            <td>${escHtml(c.prenomcand)}</td>
            <td>${escHtml(c.civilite)}</td>
            <td><span class="badge-serie" style="background:${color}20;color:${color};">${escHtml(c.libseriedip)}</span></td>
            <td>${escHtml(c.nomcommu)}</td>
            <td>${escHtml(c.nomdept)}</td>
            <td>${parseFloat(c.notelycee || 0).toFixed(2)}</td>
            <td>${parseFloat(c.noteglobale || 0).toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
    });

    if (candidats.length > 200) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="8" style="text-align:center;color:var(--muted);font-style:italic;">
            ... et ${candidats.length - 200} candidats supplémentaires (utilisez les filtres pour affiner)
        </td>`;
        tbody.appendChild(tr);
    }
}

// ============================================================
// RECHERCHE
// ============================================================
document.getElementById('carte-search')?.addEventListener('input', function () {
    const q = this.value.toLowerCase().trim();
    if (!q) {
        mettreAJourTableau(allCandidats.filter(c => seriesVisible[c.codeseriedip]));
        return;
    }
    const results = allCandidats.filter(c =>
        (c.nomcand     && c.nomcand.toLowerCase().includes(q))     ||
        (c.prenomcand  && c.prenomcand.toLowerCase().includes(q))  ||
        (c.libseriedip && c.libseriedip.toLowerCase().includes(q)) ||
        (c.nomcommu    && c.nomcommu.toLowerCase().includes(q))    ||
        (c.nomdept     && c.nomdept.toLowerCase().includes(q))
    );
    mettreAJourTableau(results, `Résultats pour "${this.value}"`);
});

// ============================================================
// SÉLECTEUR D'ANNÉE
// ============================================================
window.addEventListener('load', async () => {
    try {
        // Charger les années disponibles
        const res = await fetch('/carte_data.php?annee=0-0'); // trick pour avoir juste les années
        // En fait on charge directement depuis loadTableau qui existe déjà
        const resAnnees = await fetch('/loadTableau.php');
        const data = await resAnnees.json();

        const select = document.getElementById('annee-select');
        if (data.annees && data.annees.length > 0) {
            data.annees.forEach(a => {
                const opt = document.createElement('option');
                opt.value = a.value;
                opt.textContent = a.value;
                select.appendChild(opt);
            });

            // Charger automatiquement la première année
            chargerCarte(data.annees[0].value);
        }
    } catch (err) {
        console.error('Erreur init:', err);
    }
});

document.getElementById('annee-select').addEventListener('change', function () {
    if (this.value) chargerCarte(this.value);
});

// ============================================================
// UTILITAIRES
// ============================================================
function escHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}