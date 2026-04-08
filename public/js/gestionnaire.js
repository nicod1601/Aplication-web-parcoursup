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
const REQUIRED_HEADERS = [
	"Candidat - Code",
	"Candidat - Nom",
	"Candidat - Prénom",
	"Civilité",
	"Profil Candidat - Libellé",
	"Candidat boursier - Code",
	"Nom Etablissement origine 2024/2025",
	"Commune Etablissement origine - Libellé 2024/2025",
	"Commune Etablissement origine - CodePostal 2024/2025",
	"Département Etablissement origine - Libellé 2024/2025",
	"Pays Etablissement origine - Libellé 2024/2025",
	"Type Diplôme - Code",
	"Type Diplôme - Libellé",
	"Série Diplôme - Code",
	"Série Diplôme - Libellé",
	"Combinaison des enseignements de spécialité en Terminale",
	"Enseignement De spécialité abandonné en Première",
	"Note Globale Calculée",
	"Note Fiche Avenir",
	"Note Lycée calculée"
];
const LIMITE_LIGNES = 25;
let excelData   = [];
let currentPage = 1;

// Données du fichier actuellement visualisé en mode "voir"
let voirFichierId   = null;
let voirCandidats   = [];
let voirCurrentPage = 1;
const VOIR_ROWS     = 25;

renderTable([]);

// ============================================================
// CARTE INFORMATION — Mise à jour
// ============================================================
function mettreAJourInformation({ nomFichier = null, nbLignes = null, annee = null, nbFichiers = null } = {}) {
	const el = document.getElementById('dossier-count');
	if (!el) return;

	if (nbFichiers !== null) {
		el.innerHTML = `
			<div class="info-card">
				<div class="info-item">
					<span class="info-icon info-icon--file">📂</span>
					<div>
						<div class="info-label">Base de données</div>
						<div class="info-value">${nbFichiers} fichier${nbFichiers > 1 ? 's' : ''} enregistré${nbFichiers > 1 ? 's' : ''}</div>
					</div>
				</div>
			</div>
		`;
		return;
	}

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
	return [...anneesTrouvees][0].replace('/', '-');
}

// ============================================================
// LECTURE DU FICHIER EXCEL
// ============================================================
fileInput.addEventListener('change', (e) => {
	const file = e.target.files[0];
	if (!file) return;

	// Vérification de l'extension du fichier
	const fileName = file.name.toLowerCase();
	if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
		alert('Seuls les fichiers Excel (.xlsx, .xls) sont acceptés.');
		fileInput.value = '';
		mettreAJourInformation();
		return;
	}

	const reader = new FileReader();

	loadingOverlay.style.display = 'flex';
	traitementText.textContent   = 'Lecture du fichier en cours...';

	reader.onload = (event) => {
		const data     = new Uint8Array(event.target.result);
		const workbook = XLSX.read(data, { type: 'array' });

		const firstSheetName = workbook.SheetNames[0];
		const worksheet      = workbook.Sheets[firstSheetName];

		excelData   = XLSX.utils.sheet_to_json(worksheet);

		// Vérification des en-têtes obligatoires
		if (excelData.length > 0) {
			const headers = Object.keys(excelData[0]);
			const missing = REQUIRED_HEADERS.filter(h => !headers.includes(h));
			if (missing.length > 0) {
				loadingOverlay.style.display = 'none';
				alert("Le fichier Excel ne possède pas les colonnes requises :\n- " + missing.join('\n- '));
				fileInput.value = '';
				excelData = [];
				updateTable();
				mettreAJourInformation();
				return;
			}
		}

		currentPage = 1;
		updateTable();

		const headers    = excelData.length > 0 ? Object.keys(excelData[0]) : [];
		const annee      = detecterAnnee(headers);
		const nomFichier = file.name;
		const nbLignes   = excelData.length;

		mettreAJourInformation({ nomFichier, nbLignes, annee });

		if (annee) {
			const anneeSelect = document.getElementById('annee-select');
			const anneeNorm   = annee.replace('/', '-');
			for (let i = 0; i < anneeSelect.options.length; i++) {
				if (anneeSelect.options[i].value === anneeNorm) {
					anneeSelect.selectedIndex = i;
					break;
				}
			}
		}

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
// RENDU DU TABLEAU (import Excel)
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
// PAGINATION (import Excel)
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

		if (result.success) {
			// --- ANIMATION DE SUCCÈS ---
			const spinner = loadingOverlay.querySelector('.spinner');
			const loadingBox = loadingOverlay.querySelector('.loading-box');
			
			// On cache le spinner
			if (spinner) spinner.style.display = 'none';
			
			// On crée et affiche le V vert
			let check = loadingBox.querySelector('.success-checkmark');
			if (!check) {
				check = document.createElement('div');
				check.className = 'success-checkmark';
				check.innerHTML = '<i class="bi bi-check-lg"></i>';
				loadingBox.prepend(check);
			}
			check.style.display = 'block';
			traitementText.textContent = 'Enregistré avec succès !';

			// Petit délai pour laisser l'utilisateur voir le "V"
			await new Promise(resolve => setTimeout(resolve, 1500));

			loadingOverlay.style.display = 'none';
			afficherRapportImport(result);

			// ── Mise à jour de la liste des fichiers après import ──
			const anneeImportee = anneeSelect.value;
			const nomFichierImporte = document.getElementById('file-name')?.textContent || `Import ${anneeImportee}`;

			// Vérifie si ce fichier existe déjà dans allFichiers
			const existe = allFichiers.some(f => f.annee === anneeImportee);
			if (!existe) {
				await rechargerListeFichiers();
			}

			sessionStorage.removeItem(`carte_${anneeImportee}`);

			mettreAJourInformation({
				nomFichier: nomFichierImporte,
				nbLignes:   result.lignesImportees,
				annee:      anneeImportee,
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
// RECHARGEMENT DE LA LISTE DES FICHIERS (depuis le serveur)
// ============================================================
async function rechargerListeFichiers() {
	try {
		const res  = await fetch('/gestionnaire_data.php');
		const data = await res.json();
		if (data.success && Array.isArray(data.fichiers)) {
			allFichiers = data.fichiers;
		}
	} catch (err) {
		console.warn('Impossible de recharger la liste des fichiers :', err);
	}
}

// ============================================================
// RAPPORT D'IMPORT
// ============================================================
function afficherRapportImport(result) {
	const nbIgnorees  = result.nbIgnorees      ?? 0;
	const nbImportees = result.lignesImportees ?? 0;
	const nbFichier   = excelData.length;

	let message = "";
	let bgColor = "";

	if (nbIgnorees === 0 && nbImportees === nbFichier) {
		message = "✅ Importation réussie : toutes les lignes ont été importées.";
		bgColor = "#d4edda"; // Vert succès
	} else {
		message = `⚠️ Attention : ${nbIgnorees} ligne(s) ont été ignorées sur ${nbFichier}. Le fichier n'est pas totalement conforme.`;
		bgColor = "#f8d7da"; // Rouge erreur
	}

	const html = `
		<div id="rapport-import" style="margin-top:1.5rem; padding: 15px; border-radius: 8px; background-color: ${bgColor}; border: 1px solid var(--navy); font-weight: 600;">
			${message}
		</div>
	`;
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

// ============================================================
// RENDU DE LA LISTE DES FICHIERS
// ============================================================
function renderFileList(fichiers) {
	const container = document.getElementById('liste-fichiers-container');
	if (!container) return;

	if (!fichiers || fichiers.length === 0) {
		container.innerHTML = `<div style="padding:40px;text-align:center;color:var(--muted);">Aucun fichier dans la base de données.</div>`;
		return;
	}

	container.innerHTML = fichiers.map(f => `
		<div class="file-list-item" data-id="${f.id}">
			<div class="file-info">
				<span class="file-name">${escapeHtml(f.nom)}</span>
				<span class="file-year">${f.annee}</span>
			</div>
			<div class="file-actions">
				<button class="btn-text btn-voir" data-id="${f.id}" data-nom="${escapeHtml(f.nom)}" data-annee="${escapeHtml(f.annee)}">👁️</button>
				<span>|</span>
				<button class="btn-text btn-text-danger btn-supr" data-id="${f.id}">🗑️</button>
			</div>
		</div>
	`).join('');
}

// ============================================================
// ZONE "VOIR" — Tableau des candidats d'un fichier
// ============================================================
function afficherZoneVoir(idFichier, nomFichier, annee) {
	// Masque la liste, affiche la zone tableau
	document.getElementById('zone-liste-fichiers').style.display = 'none';

	let zoneVoir = document.getElementById('zone-voir');
	if (!zoneVoir) {
		zoneVoir = document.createElement('section');
		zoneVoir.id        = 'zone-voir';
		zoneVoir.className = 'page-body';
		document.querySelector('.main-content').appendChild(zoneVoir);
	}
	zoneVoir.style.display = 'block';

	zoneVoir.innerHTML = `
		<div class="hero-sub" style="margin-bottom:1rem;">
			<button class="btn btn-secondary" id="btn-retour-liste" style="font-size:0.75rem;padding:4px 12px;">
				← Retour
			</button>
			<span style="margin-left:12px;">
				${escapeHtml(nomFichier)} — Année ${escapeHtml(annee)}
			</span>
		</div>

		<div class="content-placeholder" style="overflow-x:auto;max-height:520px;border:1px solid #d4ddf7;">
			<table id="voir-table" class="table table-striped" style="width:100%;border-collapse:collapse;font-size:12px;">
				<thead>
					<tr id="voir-thead"></tr>
				</thead>
				<tbody id="voir-tbody">
					<tr><td colspan="15" style="text-align:center;padding:30px;color:gray;">Chargement...</td></tr>
				</tbody>
			</table>
		</div>
		<div class="pagination-bar" id="voir-pagination" style="margin-top:1.5rem;"></div>
	`;

	document.getElementById('btn-retour-liste').addEventListener('click', () => {
		zoneVoir.style.display = 'none';
		document.getElementById('zone-liste-fichiers').style.display = 'block';
	});

	voirFichierId   = idFichier;
	voirCurrentPage = 1;
	chargerCandidatsFichier(idFichier);
}

async function chargerCandidatsFichier(idFichier) {
	try {
		const res  = await fetch(`/gestionnaire_candidats.php?id=${idFichier}`);
		const data = await res.json();

		if (!data.success) {
			document.getElementById('voir-tbody').innerHTML = `
				<tr><td colspan="15" style="text-align:center;padding:30px;color:var(--red);">
					Erreur : ${escapeHtml(data.error || 'Impossible de charger les données')}
				</td></tr>
			`;
			return;
		}

		voirCandidats = data.candidats || [];
		renderVoirTable();

	} catch (err) {
		console.error('Erreur chargement candidats :', err);
		document.getElementById('voir-tbody').innerHTML = `
			<tr><td colspan="15" style="text-align:center;padding:30px;color:var(--red);">
				Erreur de connexion au serveur.
			</td></tr>
		`;
	}
}

function renderVoirTable() {
	const thead = document.getElementById('voir-thead');
	const tbody = document.getElementById('voir-tbody');
	if (!thead || !tbody) return;

	const colonnes = [
		{ key: 'codecand',       label: 'Code' },
		{ key: 'nomcand',        label: 'Nom' },
		{ key: 'prenomcand',     label: 'Prénom' },
		{ key: 'civilite',       label: 'Civilité' },
		{ key: 'profilcand',     label: 'Profil' },
		{ key: 'nvbourscand',    label: 'Bourse' },
		{ key: 'codeseriedip',   label: 'Série' },
		{ key: 'libseriedip',    label: 'Libellé série' },
		{ key: 'nometab',        label: 'Établissement' },
		{ key: 'nomcommu',       label: 'Commune' },
		{ key: 'nomdept',        label: 'Département' },
		{ key: 'noteglobale',    label: 'Note globale' },
		{ key: 'noteficheavenir',label: 'Fiche avenir' },
		{ key: 'notelycee',      label: 'Note lycée' },
		{ key: 'notedossier',    label: 'Dossier' },
	];

	// En-tête (une seule fois)
	if (!thead.hasChildNodes()) {
		const thStyle = 'padding:9px 12px;text-align:left;font-weight:600;font-size:11px;letter-spacing:.05em;text-transform:uppercase;color:#185FA5;background:#E6F1FB;white-space:nowrap;border:1px solid #c5d8f5;';
		thead.innerHTML = colonnes.map(c => `<th style="${thStyle}">${c.label}</th>`).join('');
	}

	if (voirCandidats.length === 0) {
		tbody.innerHTML = `<tr><td colspan="${colonnes.length}" style="text-align:center;padding:30px;color:gray;">Aucun candidat dans ce fichier.</td></tr>`;
		renderVoirPagination();
		return;
	}

	const start    = (voirCurrentPage - 1) * VOIR_ROWS;
	const pageData = voirCandidats.slice(start, start + VOIR_ROWS);
	const tdStyle  = 'padding:7px 12px;border:1px solid #e8eef8;white-space:nowrap;max-width:220px;overflow:hidden;text-overflow:ellipsis;';

	tbody.innerHTML = pageData.map(c => `
		<tr>
			${colonnes.map(col => `<td style="${tdStyle}">${escapeHtml(String(c[col.key] ?? ''))}</td>`).join('')}
		</tr>
	`).join('');

	renderVoirPagination();
}

function renderVoirPagination() {
	const bar        = document.getElementById('voir-pagination');
	if (!bar) return;
	const totalPages = Math.ceil(voirCandidats.length / VOIR_ROWS) || 1;

	bar.innerHTML = `
		<button class="btn btn-secondary" id="voir-prev" ${voirCurrentPage === 1 ? 'disabled' : ''}>← Précédent</button>
		<span style="font-size:0.85rem;color:var(--muted);margin:0 15px;">
			Page ${voirCurrentPage} / ${totalPages} — ${voirCandidats.length} candidat(s)
		</span>
		<button class="btn btn-secondary" id="voir-next" ${voirCurrentPage >= totalPages ? 'disabled' : ''}>Suivant →</button>
	`;

	document.getElementById('voir-prev').onclick = () => {
		if (voirCurrentPage > 1) { voirCurrentPage--; renderVoirTable(); }
	};
	document.getElementById('voir-next').onclick = () => {
		if (voirCurrentPage < totalPages) { voirCurrentPage++; renderVoirTable(); }
	};
}

// ============================================================
// DÉLÉGATION D'ÉVÉNEMENTS — Liste des fichiers
// ============================================================
const listeFichiersContainer = document.getElementById('liste-fichiers-container');

listeFichiersContainer.addEventListener('click', (e) => {
	// Bouton "voir"
	if (e.target.classList.contains('btn-voir')) {
		const id    = e.target.dataset.id;
		const nom   = e.target.dataset.nom;
		const annee = e.target.dataset.annee;
		afficherZoneVoir(id, nom, annee);
		return;
	}

	// Bouton "supr"
	if (e.target.classList.contains('btn-supr')) {
		const id = e.target.dataset.id;
		supprimerFichier(id);
	}
});

// ============================================================
// SUPPRIMER TOUT
// ============================================================
const btnsupprimerTout = document.getElementById('delete-all-btn');
btnsupprimerTout.addEventListener('click', supprimerTout);

async function supprimerTout() {
	if (!confirm('⚠️ ATTENTION — Supprimer TOUS les candidats et fichiers de la base de données ?\n\nCette action est irréversible.')) return;
	if (!confirm('Confirmer une seconde fois : supprimer TOUTE la base de données ?')) return;

	loadingOverlay.style.display = 'flex';
	traitementText.textContent   = 'Suppression totale en cours...';

	try {
		const res  = await fetch('/delete.php?action=all', { method: 'POST' });
		const data = await res.json();
		loadingOverlay.style.display = 'none';

		if (data.success) {
			// Nettoyer tout le cache de la carte car tout est supprimé
			Object.keys(sessionStorage).forEach(key => {
				if (key.startsWith('carte_')) sessionStorage.removeItem(key);
			});

			allFichiers = [];
			renderFileList(allFichiers);
			mettreAJourInformation({ nbFichiers: 0 });
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
		const res  = await fetch(`/delete.php?action=one`, {
			method:  'POST',
			headers: { 'Content-Type': 'application/json' },
			body:    JSON.stringify({ id }),
		});
		const data = await res.json();
		loadingOverlay.style.display = 'none';

		if (data.success) {
			// Trouver l'année du fichier supprimé pour vider son cache spécifique
			const fichierSupprime = allFichiers.find(f => parseInt(f.id) === id);
			if (fichierSupprime) {
				sessionStorage.removeItem(`carte_${fichierSupprime.annee}`);
			}

			allFichiers = allFichiers.filter(f => parseInt(f.id) !== id);
			renderFileList(allFichiers);
			mettreAJourInformation({ nbFichiers: allFichiers.length });
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
// INITIALISATION DES PARTIES
// ============================================================
const btnImporter  = document.getElementById('import-btn');
const btnSupprimer = document.getElementById('delete-btn');

const zoneFichier = document.getElementById('zone-fichier');
const zoneTableau = document.getElementById('zone-tableau');
const zoneListe   = document.getElementById('zone-liste-fichiers');

btnImporter.addEventListener('click', () => {
	zoneFichier.style.display = 'block';
	zoneTableau.style.display = 'block';
	zoneListe.style.display   = 'none';
	const zoneVoir = document.getElementById('zone-voir');
	if (zoneVoir) zoneVoir.style.display = 'none';
	btnSupprimer.classList.replace('btn-primary', 'btn-secondary');
	btnImporter.classList.replace('btn-secondary', 'btn-primary');

	// Restaurer l'affichage des infos du fichier en cours d'import ou vider la carte
	if (excelData && excelData.length > 0) {
		const headers = Object.keys(excelData[0]);
		mettreAJourInformation({
			nomFichier: fileInput.files[0]?.name || "Fichier importé",
			nbLignes: excelData.length,
			annee: detecterAnnee(headers)
		});
	} else {
		mettreAJourInformation();
	}
});

btnSupprimer.addEventListener('click', async () => {
	zoneFichier.style.display = 'none';
	zoneTableau.style.display = 'none';
	zoneListe.style.display   = 'block';
	const zoneVoir = document.getElementById('zone-voir');
	if (zoneVoir) zoneVoir.style.display = 'none';
	btnImporter.classList.replace('btn-primary', 'btn-secondary');
	btnSupprimer.classList.replace('btn-secondary', 'btn-primary');

	// Rechargement frais des fichiers depuis la BDD
	loadingOverlay.style.display = 'flex';
	traitementText.textContent   = 'Chargement des fichiers...';
	await rechargerListeFichiers();
	loadingOverlay.style.display = 'none';

	renderFileList(allFichiers);
	mettreAJourInformation({ nbFichiers: allFichiers.length });
});