const anneeSelect= document.getElementById( 'annee-select' );
const btnAnnee   = document.getElementById( 'btnAnnee'     );
const btnExport  = document.getElementById( 'btnExporter'  );

const btnFiltrer = document.getElementById( 'btnFiltrer' );

let groupeCache = null;
let modeGrouper  = false;
let allCandidats = [];
let filteredCandidats = [];
let currentPage = 1;
const rowsPerPage = 25;

window.addEventListener( 'load', async () => {
	try
	{
		/* Mise à jour des années de promotion disponibles */
		const reponse = await fetch(`/loadTableau.php`);

		if (! reponse.ok )
			throw new Error(`Erreur lors du chargement de la page`);

		const data = await reponse.json();
		mettreAJourPage(data);


		const cached = sessionStorage.getItem('groupes_cache');
		if (cached)
			groupeCache = JSON.parse(cached);


		/* Gestion des filtres */
		const filtresAppliques = sessionStorage.getItem('filtresAppliques');

		if (filtresAppliques)
		{
			sessionStorage.removeItem('filtresAppliques');

			const reponse = await fetch('/sessionCandidats.php');
			const data    = await reponse.json();

			if (data.candidats) mettreAJourTab(data.candidats);
		}

		/* Gestion des statistiques lors d'un retour sur la page */
		if ( sessionStorage.getItem('statistiques') )
		{
			const statistiques = JSON.parse(sessionStorage.getItem('statistiques'));
			mettreAJourStats(statistiques);
		}

		if ( sessionStorage.getItem('candidats') )
		{
			const candidats = JSON.parse(sessionStorage.getItem('candidats'));
			mettreAJourTab(candidats);
		}

		if ( sessionStorage.getItem('btnFiltrer-disabled') )
		{
			const btnFiltrerDisabled = JSON.parse(sessionStorage.getItem('btnFiltrer-disabled'));
			btnFiltrer.disabled = btnFiltrerDisabled;
		}
	}
	catch (error)
	{
		console.error('Erreur lors du chargement de la page :', error);
		alert('Erreur lors du chargement de la page');
	}
});

btnAnnee.addEventListener( 'click', async  () => {
	const annee = document.getElementById( 'annee-select' ).value;

	modeGrouper  = false;
	groupeCache = null;
	sessionStorage.removeItem('groupes_cache');

	try
	{
		const reponse = await fetch(`/stats.php?annee=${encodeURIComponent(annee)}`, {
			method: 'GET',
			headers: {
				'Authorization': `Bearer appli-secret-token`,
				'Content-Type': 'application/json'
			}
		});

		if ( ! reponse.ok )
			throw new Error(`Erreur lors du chargement des données`);

		const data = await reponse.json();


		sessionStorage.removeItem( 'statistiques' );
		mettreAJourStats( data.statistiques );
		sessionStorage.setItem( 'statistiques', JSON.stringify(data.statistiques) );

		sessionStorage.removeItem( 'candidats' );
		mettreAJourTab( data.candidats );
		sessionStorage.setItem( 'candidats', JSON.stringify(data.candidats) );

		btnFiltrer.disabled = false;
		sessionStorage.setItem( 'btnFiltrer-disabled', JSON.stringify( false ) );

		btnExport.disabled = false;
	}
	catch (error)
	{
		console.error('Erreur lors de l\'initialisation:', error);
		alert('Impossible de se connecter au serveur. Assurez-vous que le backend est lancé sur http://localhost:8000');
	}
});

btnFiltrer.addEventListener( 'click', () => {
	window.location.href = `../filtrer.php`;
})

function mettreAJourPage(data)
{
	if ( ! data.annees ) return;


	anneeSelect.innerHTML = ``;

	data.annees.forEach(annee => {
		anneeSelect.innerHTML += `<option value="${annee.value}">${annee.value}</option>`;
	});

	btnAnnee.disabled = false;
}

function mettreAJourStats( statistiques )
{
	const cardDiplome = document.getElementById( 'card-diplome' );
	const cardGenre   = document.getElementById( 'card-genre'   );
	const nbCandTotal = document.getElementById( 'nbCandTotal'  );

	// Nombre total de candidat(s) importé(s)
	nbCandTotal.textContent = statistiques.totalCand;

	// Mise à jour de la section sur les diplômes
	const tabDiplome = {};
	cardDiplome.innerHTML = ``;
	statistiques.diplomes.forEach(d => {
		tabDiplome[d.codeseriedip] = d.total

		const div = document.createElement( 'div' );
		div.classList.add( 'stat-item' );
		div.innerHTML = `
			<h2>${(tabDiplome[d.codeseriedip] > 0 ? tabDiplome[d.codeseriedip] : '-') ?? '-'}</h2>
			<p>${d.codeseriedip}</p>
		`;
		cardDiplome.appendChild( div );
	});

	// Mise à jour de la section sur le genre
	const tabGenre = {};
	cardGenre.innerHTML = ``;
	statistiques.genres.forEach(g => {
		tabGenre[g.civilite] = g.total

		const div = document.createElement( 'div' );
		div.classList.add( 'stat-item' );
		div.innerHTML = `
			<h2>${(tabGenre[g.civilite] > 0 ? tabGenre[g.civilite] : '-') ?? '-'}</h2>
			<p>${g.civilite }</p>
		`;
		cardGenre.appendChild( div );
	});
}

function mettreAJourTab(candidats)
{
	// Initialisation des données globales pour la pagination et la recherche
	allCandidats = candidats || [];
	filteredCandidats = [...allCandidats];
	currentPage = 1;
	renderTable();
}

function renderTable() {
	const tableauDonnees = document.getElementById('tableau-data');
	if (!tableauDonnees) return;
	
	tableauDonnees.innerHTML = '';

	if (filteredCandidats.length === 0) {
		tableauDonnees.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:30px;color:gray;">Aucun candidat trouvé</td></tr>`;
		updatePagination();
		return;
	}

	// Calcul de la tranche de données à afficher (Pagination)
	const start = (currentPage - 1) * rowsPerPage;
	const end = start + rowsPerPage;
	const pageData = filteredCandidats.slice(start, end);

	pageData.forEach(c => {
		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td>${escapeHtml(String(c.codecand))}</td>
			<td>${escapeHtml(c.nomcand)}</td>
			<td>${escapeHtml(c.prenomcand)}</td>
			<td>${escapeHtml(c.civilite)}</td>
			<td>${escapeHtml(c.profilcand)}</td>
		`;
		tableauDonnees.appendChild(tr);
	});

	updatePagination();
}

function updatePagination() {
	const paginationBar = document.getElementById('paginationBar');
	if (!paginationBar) return;

	paginationBar.style.display = 'flex';

	const totalPages = Math.ceil(filteredCandidats.length / rowsPerPage) || 1;
	paginationBar.innerHTML = `
		<button class="btn btn-secondary" id="prevPage" ${currentPage === 1 ? 'disabled' : ''}>← Précédent</button>
		<span id="pageInfo" style="margin: 0 15px;">Page ${currentPage} / ${totalPages}</span>
		<button class="btn btn-secondary" id="nextPage" ${currentPage >= totalPages ? 'disabled' : ''}>Suivant →</button>
	`;

	document.getElementById('prevPage').onclick = () => { if(currentPage > 1) { currentPage--; renderTable(); } };
	document.getElementById('nextPage').onclick = () => { if(currentPage < totalPages) { currentPage++; renderTable(); } };
}

const barreRch = document.getElementById('barre-recherche');

if (barreRch)
	barreRch.addEventListener('input', Recherche);

function Recherche() {
	const query  = barreRch.value.toLowerCase();

	filteredCandidats = allCandidats.filter(c => {
		return (
			(c.nomcand?.toLowerCase().includes(query)) ||
			(c.prenomcand?.toLowerCase().includes(query)) ||
			(c.civilite?.toLowerCase().includes(query)) ||
			(c.profilcand?.toLowerCase().includes(query)) ||
			(c.codecand?.toString().includes(query))
		);
	});

	currentPage = 1;
	renderTable();
}

const btnGroupe = document.getElementById('btnGrouper');

btnGroupe.addEventListener('click', async() => {
	const annee = anneeSelect.value;

	if(groupeCache && groupeCache.annee === annee)
	{
		modeGrouper = !modeGrouper;

		if (modeGrouper)
			afficherGroupes(groupeCache.groupes);
		else
			btnAnnee.click();

		return;
	}

	try {
		const chargement = document.getElementById('loading-overlay');

		const reponse = await fetch(`/groupes.php?annee=${encodeURIComponent(annee)}`);
		if (!reponse.ok) throw new Error(`Erreur lors du chargement des données`);
		const data = await reponse.json();

		if(!data.success){
			alert('Erreur lors du regroupement des données');
			return;
		}

		groupeCache = { annee: annee, groupes: data.groupes };
		sessionStorage.setItem('groupes_cache', JSON.stringify(groupeCache));
		modeGrouper = true;
		afficherGroupes(data.groupes);

	} catch (error) {
		console.error('Erreur lors du regroupement:', error);
		alert('Impossible de se connecter au serveur. Assurez-vous que le backend est lancé sur http://localhost:8000');
	}
});

function afficherGroupes(groupes) {
	// On masque la pagination car les groupes affichent tout d'un coup
	const paginationBar = document.getElementById('paginationBar');
	if (paginationBar) paginationBar.style.display = 'none';

	const emplacementTab = document.querySelector('.content-placeholder');
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
emplacementTab.innerHTML = html;

}

function escapeHtml(str) {
	if (!str) return '';
	return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function downloadExcel() {
	const response = await fetch('/export.php');
	const data = await response.json();

	if (!response.ok) {
		throw new Error(data?.error || 'Erreur export serveur');
	}
	if (!Array.isArray(data)) {
		throw new Error('Format export invalide: tableau attendu');
	}

	const worksheet = XLSX.utils.json_to_sheet(data);
	const workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(workbook, worksheet, "Candidats");
	XLSX.writeFile(workbook, "Export_Candidats.xlsx");
}


document.getElementById('btnExporter').addEventListener('click', downloadExcel);