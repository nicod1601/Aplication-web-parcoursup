const anneeSelect = document.getElementById('annee-select');
const btnAnnee    = document.getElementById('btnAnnee');

// ---- État global ----
let groupesCache = null; // stockage temporaire en mémoire (sessionStorage aussi utilisé)
let modeGrouper  = false;

tableauVide();

// ============================================================
// INITIALISATION
// ============================================================

function tableauVide() {
	const placeholder = document.querySelector('.content-placeholder');
	placeholder.innerHTML = `
		<table id="tableau-candidats" class="table table-striped"></table>
		<p id="msg-vide" style="text-align:center; padding:30px; color:gray; font-style:italic; font-size:1.2em;">
			Aucune donnée à afficher
		</p>
	`;
}

window.addEventListener('load', async () => {
	try {
		const reponse = await fetch('/loadTableau.php');
		if (!reponse.ok) throw new Error('Erreur chargement');
		const data = await reponse.json();
		mettreAJourPage(data);

		// Si des groupes étaient déjà en session, on les restaure
		const cached = sessionStorage.getItem('groupes_cache');
		if (cached) {
			groupesCache = JSON.parse(cached);
		}
	} catch (error) {
		console.error('Erreur initialisation:', error);
		alert('Impossible de se connecter au serveur.');
	}
});

// ============================================================
// SÉLECTION ANNÉE
// ============================================================

btnAnnee.addEventListener('click', async () => {
	const annee = anneeSelect.value;
	modeGrouper  = false;
	groupesCache = null;
	sessionStorage.removeItem('groupes_cache');

	try {
		const reponse = await fetch(`/stats.php?annee=${encodeURIComponent(annee)}`, {
			method: 'GET',
			headers: {
				'Authorization': 'Bearer appli-secret-token',
				'Content-Type': 'application/json'
			}
		});
		if (!reponse.ok) throw new Error('Erreur chargement stats');
		const data = await reponse.json();

		mettreAJourStats(data.statistiques);
		mettreAJourTab(data.candidats);
	} catch (error) {
		console.error('Erreur stats:', error);
		alert('Impossible de charger les données.');
	}
});

// ============================================================
// BOUTON GROUPER
// ============================================================

const btnGrouper = document.getElementById('btnGrouper');
	btnGrouper.addEventListener('click', async () => {
		const annee = anneeSelect.value;

		if (!annee || annee === 'null') {
			alert('Veuillez d\'abord sélectionner une année et valider.');
			return;
		}

		// Si les groupes sont déjà en cache pour cette année, on bascule l'affichage
		if (groupesCache && groupesCache.annee === annee) {
			modeGrouper = !modeGrouper;
			if (modeGrouper) {
				afficherGroupes(groupesCache.groupes);
			} else {
				// Retour au tableau normal
				btnAnnee.click();
			}
			return;
		}

		try {
			const overlay = document.getElementById('loading-overlay');

			// Appel API
			const reponse = await fetch(`/groupes.php?annee=${encodeURIComponent(annee)}`);
			if (!reponse.ok) throw new Error('Erreur chargement groupes');
			const data = await reponse.json();

			if (!data.success) {
				alert('Erreur : ' + data.error);
				return;
			}

			// Stockage temporaire (mémoire + sessionStorage)
			groupesCache = { annee: annee, groupes: data.groupes };
			sessionStorage.setItem('groupes_cache', JSON.stringify(groupesCache));

			modeGrouper = true;
			afficherGroupes(data.groupes);

		} catch (error) {
			console.error('Erreur grouper:', error);
			alert('Impossible de charger les groupes.');
		}
	});

// ============================================================
// AFFICHAGE DES GROUPES
// ============================================================

function afficherGroupes(groupes) {
	const placeholder = document.querySelector('.content-placeholder');

	let html = `
		<table id="tableau-candidats" class="table table-striped">
			<thead>
				<tr>
					<th>Série de bac</th>
					<th>Combinaison des spécialités</th>
					<th>Total vœux</th>
					<th>Filles</th>
					<th>Garçons</th>
					<th>Boursiers</th>
					<th>Non Boursiers</th>
				</tr>
			</thead>
			<tbody>
	`;

	groupes.forEach(groupe => {
		// Lignes détail (combinaisons)
		groupe.combinaisons.forEach((comb, index) => {
			html += `
				<tr class="groupe-row" data-serie="${escapeHtml(groupe.serie)}">
					${index === 0 ? `<td rowspan="${groupe.combinaisons.length}" class="td-serie">${escapeHtml(groupe.serie)}</td>` : ''}
					<td>${escapeHtml(comb.combinaison)}</td>
					<td>${comb.total}</td>
					<td>${comb.filles}</td>
					<td>${comb.garcons}</td>
					<td>${comb.boursiers}</td>
					<td>${comb.nonBoursiers}</td>
				</tr>
			`;
		});

		// Ligne total du groupe
		html += `
			<tr class="groupe-total-row">
				<td colspan="2"><strong>Total ${escapeHtml(groupe.serie)}</strong></td>
				<td><strong>${groupe.total}</strong></td>
				<td><strong>${groupe.filles}</strong></td>
				<td><strong>${groupe.garcons}</strong></td>
				<td><strong>${groupe.boursiers}</strong></td>
				<td><strong>${groupe.nonBoursiers}</strong></td>
			</tr>
		`;
	});

	html += `</tbody></table>`;

	placeholder.innerHTML = html;

	// Recherche dans le mode grouper
	const barreRch = document.getElementById('barre-recherche');
	if (barreRch) {
		barreRch.addEventListener('input', () => {
			const query = barreRch.value.toLowerCase();
			document.querySelectorAll('.groupe-row').forEach(tr => {
				const texte = tr.textContent.toLowerCase();
				tr.style.display = texte.includes(query) ? '' : 'none';
			});
			document.querySelectorAll('.groupe-total-row').forEach(tr => {
				tr.style.display = '';
			});
		});
	}
}

// ============================================================
// MISE À JOUR PAGE / STATS / TABLEAU NORMAL
// ============================================================

function mettreAJourPage(data) {
	if (!data.annees) return;

	anneeSelect.innerHTML = '';
	data.annees.forEach(annee => {
		const opt = document.createElement('option');
		opt.value = annee.value;
		opt.textContent = annee.value;
		anneeSelect.appendChild(opt);
	});

	btnAnnee.disabled = false;
}

function mettreAJourStats(statistiques) {
	const cardDiplome = document.getElementById('card-diplome');
	const cardGenre   = document.getElementById('card-genre');
	const nbCandTotal = document.getElementById('nbCandTotal');

	nbCandTotal.textContent = statistiques.totalCand;

	cardDiplome.innerHTML = '';
	statistiques.diplomes.forEach(d => {
		const div = document.createElement('div');
		div.classList.add('stat-item');
		div.innerHTML = `<h2>${d.total > 0 ? d.total : '-'}</h2><p>${d.codeseriedip}</p>`;
		cardDiplome.appendChild(div);
	});

	cardGenre.innerHTML = '';
	statistiques.genres.forEach(g => {
		const div = document.createElement('div');
		div.classList.add('stat-item');
		div.innerHTML = `<h2>${g.total > 0 ? g.total : '-'}</h2><p>${g.civilite}</p>`;
		cardGenre.appendChild(div);
	});
}

function mettreAJourTab(candidats) {
	const placeholder = document.querySelector('.content-placeholder');
	placeholder.innerHTML = `<table id="tableau-candidats" class="table table-striped"></table>`;
	const tableau = document.getElementById('tableau-candidats');

	tableau.innerHTML = `
		<thead>
			<tr>
				<th>Code candidat</th>
				<th>Nom</th>
				<th>Prénom</th>
				<th>Civilité</th>
				<th>Profil</th>
			</tr>
		</thead>
	`;

	candidats.forEach(c => {
		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td>${c.codecand}</td>
			<td>${c.nomcand}</td>
			<td>${c.prenomcand}</td>
			<td>${c.civilite}</td>
			<td>${c.profilcand}</td>
		`;
		tableau.appendChild(tr);
	});

	const barreRch = document.getElementById('barre-recherche');
	if (barreRch) {
		barreRch.addEventListener('input', () => {
			const query = barreRch.value.toLowerCase();
			Array.from(tableau.getElementsByTagName('tr')).slice(1).forEach(tr => {
				const texte = tr.textContent.toLowerCase();
				tr.style.display = texte.includes(query) ? '' : 'none';
			});
		});
	}
}

// ============================================================
// UTILITAIRES
// ============================================================


function escapeHtml(str) {
	if (!str) return '';
	return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}