// ============================================================
// GESTION DU MENU
// ============================================================
const menuItems = document.querySelectorAll('.menu-item');
menuItems[3].classList.add('active');

menuItems.forEach(item => {
	item.addEventListener('click', () => {
		menuItems.forEach(i => i.classList.remove('active'));
		item.classList.add('active');
		window.location.href = item.getAttribute('href');
	});
});

// ============================================================
// VARIABLES GLOBALES
// ============================================================
const fileInput           = document.getElementById('file-input');
const confirmBtnContainer = document.getElementById('confirm-btn-container');
const table               = document.getElementById('excel-table');
const paginationBar       = document.getElementById('paginationBar');
const traitementText      = document.getElementById('traitement');
const loadingOverlay      = document.getElementById('loading-overlay');

let allFichiers = typeof initialFichiers !== 'undefined' ? initialFichiers : [];
const LIMITE_LIGNES = 25;
let excelData   = [];
let currentPage = 1;

renderTable([]);

// ============================================================
// CARTE INFORMATION — Mise à jour
// ============================================================
function mettreAJourInformation({ nomFichier = null, nbLignes = null, annee = null } = {}) {
	const el = document.getElementById('dossier-count');
	if (!el) return;

	if (nomFichier === null) {
		el.innerHTML = `<span class="info-placeholder"></span>`;
		return;
	}

	el.innerHTML = `
		<div class="info-card">
			<div class="info-item">
				<span class="info-icon info-icon--file">📄</span>
				<div>
					<div class="info-label">Fichier</div>
					<div class="info-value">${escapeHtml(nomFichier)}</div>
				</div>
			</div>
			<div class="info-item">
				<span class="info-icon info-icon--candidates">👥</span>
				<div>
					<div class="info-label">Candidats</div>
					<div class="info-value info-value--candidates">${nbLignes !== null ? nbLignes : '—'}</div>
				</div>
			</div>
			<div class="info-item">
				<span class="info-icon info-icon--year">📅</span>
				<div>
					<div class="info-label">Année scolaire</div>
					<div class="info-value info-value--year ${annee ? 'info-value--red' : 'info-value--muted'}">
						${annee ? annee : 'Non détectée'}
					</div>
				</div>
			</div>
		</div>
	`;
}

// ============================================================
// DÉTECTION DE L'ANNÉE DANS LES EN-TÊTES
// ============================================================
function detecterAnnee(headers) {
	// Cherche un pattern AAAA/AAAA ou AAAA-AAAA dans les colonnes
	const patterns = [
		/(\d{4}\/\d{4})/,
		/(\d{4}-\d{4})/,
	];
	const anneesTrouvees = new Set();

	headers.forEach(header => {
		patterns.forEach(pattern => {
			const match = String(header).match(pattern);
			if (match) anneesTrouvees.add(match[1]);
		});
	});

	if (anneesTrouvees.size === 0) return null;
	// Retourne la première année trouvée (normalisée avec tiret)
	return [...anneesTrouvees][0].replace('/', '-');
}

// ============================================================
// LECTURE DU FICHIER EXCEL
// ============================================================
fileInput.addEventListener('change', (e) => {
	const file = e.target.files[0];
	if (!file) return;

	const reader = new FileReader();

	loadingOverlay.style.display = 'flex';
	traitementText.textContent   = 'Lecture du fichier en cours...';

	reader.onload = (event) => {
		const data     = new Uint8Array(event.target.result);
		const workbook = XLSX.read(data, { type: 'array' });

		const firstSheetName = workbook.SheetNames[0];
		const worksheet      = workbook.Sheets[firstSheetName];

		excelData   = XLSX.utils.sheet_to_json(worksheet);
		currentPage = 1;
		updateTable();

		const headers    = excelData.length > 0 ? Object.keys(excelData[0]) : [];
		const annee      = detecterAnnee(headers);
		const nomFichier = file.name;
		const nbLignes   = excelData.length;

		mettreAJourInformation({ nomFichier, nbLignes, annee });

		if (annee) {
			const anneeSelect = document.getElementById('annee-select');
			const anneeNorm   = annee.replace('/', '-'); // "2024-2025"
			for (let i = 0; i < anneeSelect.options.length; i++) {
				if (anneeSelect.options[i].value === anneeNorm) {
					anneeSelect.selectedIndex = i;
					break;
				}
			}
		}

		// Afficher le nom du fichier dans la zone drop
		const fileNameEl = document.getElementById('file-name');
		if (fileNameEl) fileNameEl.textContent = file.name;

		loadingOverlay.style.display = 'none';
	};

	reader.onerror = () => {
		loadingOverlay.style.display = 'none';
		alert('Erreur lors de la lecture du fichier.');
	};

	reader.readAsArrayBuffer(file);
});

// ============================================================
// RENDU DU TABLEAU
// ============================================================
function renderTable(data) {
	table.innerHTML = '';

	if (!data || data.length === 0) {
		table.innerHTML = `
			<thead>
				<tr><th colspan="100">AUCUNE DONNÉE</th></tr>
			</thead>
			<tbody>
				<tr>
					<td colspan="100" style="text-align:center;padding:30px;color:gray;font-style:italic;">
						📭 Aucune donnée à afficher — importez un fichier Excel
					</td>
				</tr>
			</tbody>
		`;
		return;
	}

	const headers    = Object.keys(data[0]);
	const thead      = document.createElement('thead');
	const ligneTitre = document.createElement('tr');

	headers.forEach(header => {
		const th       = document.createElement('th');
		th.textContent = header;
		ligneTitre.appendChild(th);
	});
	thead.appendChild(ligneTitre);
	table.appendChild(thead);

	const tbody = document.createElement('tbody');
	data.forEach(row => {
		const tr = document.createElement('tr');
		headers.forEach(header => {
			const td       = document.createElement('td');
			td.textContent = row[header] ?? '';
			tr.appendChild(td);
		});
		tbody.appendChild(tr);
	});
	table.appendChild(tbody);
}

// ============================================================
// MISE À JOUR DU TABLEAU AVEC PAGINATION
// ============================================================
function updateTable() {
	const start    = (currentPage - 1) * LIMITE_LIGNES;
	const end      = start + LIMITE_LIGNES;
	const pageData = excelData.slice(start, end);

	renderTable(pageData);

	const totalPages = Math.ceil(excelData.length / LIMITE_LIGNES) || 1;

	// Bouton de confirmation
	confirmBtnContainer.innerHTML = `
		<button class="btn btn-primary" id="confirm-btn">
			Confirmer l'importation (${excelData.length} lignes)
		</button>
	`;

	paginationBar.innerHTML = `
		<button class="btn btn-secondary" id="prevPage" ${currentPage === 1 ? 'disabled' : ''}>
			← Précédent
		</button>
		<span id="pageInfo" style="font-size:0.85rem;color:var(--muted);">
			Page ${currentPage} / ${totalPages}
		</span>
		<button class="btn btn-secondary" id="nextPage" ${currentPage >= totalPages ? 'disabled' : ''}>
			Suivant →
		</button>
	`;
}

// ============================================================
// PAGINATION
// ============================================================
paginationBar.addEventListener('click', (e) => {
	const totalPages = Math.ceil(excelData.length / LIMITE_LIGNES);

	if (e.target.id === 'prevPage' && currentPage > 1) {
		currentPage--;
		updateTable();
	} else if (e.target.id === 'nextPage' && currentPage < totalPages) {
		currentPage++;
		updateTable();
	}
});

// ============================================================
// CONFIRMATION ET IMPORT
// ============================================================
confirmBtnContainer.addEventListener('click', async (e) => {
	if (!e.target || e.target.id !== 'confirm-btn') return;

	if (!excelData || excelData.length === 0) {
		alert("Veuillez d'abord choisir un fichier.");
		return;
	}

	const anneeSelect      = document.getElementById('annee-select');
	const selectedYearText = anneeSelect.options[anneeSelect.selectedIndex].text;

	if (!confirm(`Voulez-vous importer ${excelData.length} lignes pour l'année scolaire ${selectedYearText} ?`)) {
		return;
	}

	const ancienRapport = document.getElementById('rapport-import');
	if (ancienRapport) ancienRapport.remove();

	loadingOverlay.style.display = 'flex';
	traitementText.textContent   = 'Envoi en cours...';

	try {
		const response = await fetch('/import.php', {
			method:  'POST',
			headers: { 'Content-Type': 'application/json' },
			body:    JSON.stringify({
				excelData: excelData,
				annee:     anneeSelect.value,
			}),
		});

		const result = await response.json();
		loadingOverlay.style.display = 'none';

		if (result.success) {
			afficherRapportImport(result);
			mettreAJourInformation({
				nomFichier: document.getElementById('file-name')?.textContent || '',
				nbLignes:   result.lignesImportees,
				annee:      anneeSelect.value,
			});
		} else {
			alert('Erreur : ' + result.error);
		}

	} catch (error) {
		loadingOverlay.style.display = 'none';
		console.error("Erreur d'envoi :", error);
		alert('Erreur lors de la communication avec le serveur.');
	}
});

// ============================================================
// RAPPORT D'IMPORT
// ============================================================
function afficherRapportImport(result) {
	const nbIgnorees  = result.nbIgnorees      ?? 0;
	const nbImportees = result.lignesImportees ?? 0;
	const nbFichier   = excelData.length;

	let html = `
		<div id="rapport-import" style="margin-top:1.5rem;">
			<div style="
				padding: 12px 16px;
				background: var(--white);
				border: 1.5px solid var(--navy);
				border-radius: ${nbIgnorees > 0 ? '8px 8px 0 0' : '8px'};
				display: flex;
				align-items: center;
				gap: 16px;
				flex-wrap: wrap;
			">
				<span style="font-size:0.85rem;font-weight:600;">
					✅ ${result.message}
				</span>
				<span style="font-size:0.8rem;color:var(--muted);">
					Fichier : <strong>${nbFichier}</strong> lignes
					&nbsp;|&nbsp;
					Importées : <strong style="color:#3b6d11;">${nbImportees}</strong>
					&nbsp;|&nbsp;
					Ignorées : <strong style="color:${nbIgnorees > 0 ? 'var(--red)' : '#3b6d11'};">${nbIgnorees}</strong>
				</span>
			</div>
	`;

	if (nbIgnorees > 0) {
		html += `
			<div style="
				max-height: 320px;
				overflow-y: auto;
				border: 1.5px solid var(--navy);
				border-top: none;
				border-radius: 0 0 8px 8px;
			">
				<table style="width:100%;border-collapse:collapse;font-size:0.78rem;">
					<thead>
						<tr style="background:var(--blue-light);position:sticky;top:0;z-index:1;">
							<th style="padding:8px 12px;text-align:left;font-size:0.72rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--navy);">
								Ligne Excel
							</th>
							<th style="padding:8px 12px;text-align:left;font-size:0.72rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--navy);">
								Candidat
							</th>
							<th style="padding:8px 12px;text-align:left;font-size:0.72rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--navy);">
								Raison(s)
							</th>
						</tr>
					</thead>
					<tbody>
		`;

		result.lignesIgnorees.forEach((l, index) => {
			const bgColor = index % 2 === 0 ? 'var(--white)' : 'var(--blue-sky)';
			html += `
				<tr style="border-bottom:1px solid var(--blue-light);background:${bgColor};">
					<td style="padding:6px 12px;color:var(--muted);font-weight:600;">
						${l.ligne}
					</td>
					<td style="padding:6px 12px;">
						${escapeHtml(l.nom)}
					</td>
					<td style="padding:6px 12px;color:var(--red);">
						${l.erreurs.map(e => `<span>• ${escapeHtml(e)}</span>`).join('<br>')}
					</td>
				</tr>
			`;
		});

		html += `
					</tbody>
				</table>
			</div>
		`;
	}

	html += `</div>`;

	confirmBtnContainer.insertAdjacentHTML('afterend', html);
}

// ============================================================
// SÉLECTION DE L'ANNÉE
// ============================================================
document.getElementById('annee-select').addEventListener('change', () => {
	const ancienRapport = document.getElementById('rapport-import');
	if (ancienRapport) ancienRapport.remove();
});

// ============================================================
// UTILITAIRES
// ============================================================
function escapeHtml(str) {
	if (!str) return '';
	return String(str)
		.replace(/&/g,  '&amp;')
		.replace(/</g,  '&lt;')
		.replace(/>/g,  '&gt;')
		.replace(/"/g,  '&quot;')
		.replace(/'/g,  '&#39;');
}

function renderFileList(fichiers) {
	const container = document.getElementById('liste-fichiers-container');
	if (!container) return;

	if (!fichiers || fichiers.length === 0) {
		container.innerHTML = `<div style="padding:40px; text-align:center; color:var(--muted);">Aucun fichier dans la base de données.</div>`;
		return;
	}

	container.innerHTML = fichiers.map(f => `
		<div class="file-list-item">
			<div class="file-info">
				<span class="file-name">${escapeHtml(f.nom)}</span>
				<span class="file-year">${f.annee}</span>
			</div>
			<div class="file-actions">
				<button class="btn-text" id="voir-${f.id}">voir</button>
				<span>|</span>
				<button class="btn-text btn-text-danger" id="supr-${f.id}">supr</button>
			</div>
		</div>
	`).join('');
	
}

const btnVoir = document.getElementById('liste-fichiers-container');
btnVoir.addEventListener('click', (e) => {

});

const btnSupprimerFichier = document.getElementById('liste-fichiers-container');
btnSupprimerFichier.addEventListener('click', (e) => {
	if (e.target.classList.contains('btn-text-danger')) {
		const idFichier = e.target.id.split('-')[1];
		supprimerFichier(idFichier);
	}
});

const btnsupprimerTout = document.getElementById('delete-all-btn');
btnsupprimerTout.addEventListener('click', supprimerTout);


async function supprimerTout() {
	if (!confirm('⚠️ ATTENTION — Supprimer TOUS les candidats et fichiers de la base de données ?\n\nCette action est irréversible.')) return;
	if (!confirm('Confirmer une seconde fois : supprimer TOUTE la base de données ?')) return;

	loadingOverlay.style.display = 'flex';
	traitementText.textContent   = 'Suppression totale en cours...';

	try {
		const res = await fetch('/delete.php?action=all', { method: 'POST' });
		const data = await res.json();
		loadingOverlay.style.display = 'none';

		if (data.success) {
			allFichiers = [];
			renderFileList(allFichiers);
			mettreAJourInformation({});
			alert('✅ Base de données vidée avec succès.');
		} else {
			alert('Erreur : ' + data.error);
		}
	} catch (err) {
		loadingOverlay.style.display = 'none';
		alert('Erreur de communication avec le serveur.');
	}
}

async function supprimerFichier(idFichier) {
	const id = parseInt(idFichier);
	
	if (!confirm('⚠️ Supprimer ce fichier et tous les candidats associés ?\n\nCette action est irréversible.')) return;
	
	loadingOverlay.style.display = 'flex';
	traitementText.textContent   = 'Suppression en cours...';
	
	try {
		const res = await fetch(`/delete.php?action=one`, {
			method:  'POST',
			headers: { 'Content-Type': 'application/json' },
			body:    JSON.stringify({ id: id }),  // ← manquait dans ton code
		});
		const data = await res.json();
		loadingOverlay.style.display = 'none';
		
		if (data.success) {
			allFichiers = allFichiers.filter(f => parseInt(f.id) !== id);  // ← comparaison typée
			renderFileList(allFichiers);
			alert('✅ Fichier supprimé avec succès.');
		} else {
			alert('Erreur : ' + data.error);
		}
	} catch (err) {
		loadingOverlay.style.display = 'none';
		alert('Erreur de communication avec le serveur.');
	}
}


// ============================================================
// INITIALISATION - DES - PARTIES 
// ============================================================
const btnImporter = document.getElementById('import-btn');
const btnSupprimer = document.getElementById('delete-btn');

const zoneFichier = document.getElementById('zone-fichier');
const zoneTableau = document.getElementById('zone-tableau');
const zoneListe   = document.getElementById('zone-liste-fichiers');

btnImporter.addEventListener('click', () => {

	zoneFichier.style.display = 'block';
	zoneTableau.style.display = 'block';
	zoneListe.style.display = 'none';
	btnSupprimer.classList.replace('btn-primary', 'btn-secondary');
	btnImporter.classList.replace('btn-secondary', 'btn-primary');
	
});

btnSupprimer.addEventListener('click', () => {
	zoneFichier.style.display = 'none';
	zoneTableau.style.display = 'none';
	zoneListe.style.display = 'block';
	btnImporter.classList.replace('btn-primary', 'btn-secondary');
	btnSupprimer.classList.replace('btn-secondary', 'btn-primary');

	// S'assurer que la liste est à jour quand on clique sur l'onglet "Supprimer"
	await fetchAndRenderAllFiles();
});
