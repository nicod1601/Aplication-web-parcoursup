const anneeSelect= document.getElementById( 'annee-select' );

const btnAnnee   = document.getElementById( 'btnAnnee'     );
const btnMAJ = document.getElementById( 'btnMAJ' );

const btnFiltrer = document.getElementById( 'btnFiltrer'   );
const btnGrouper = document.getElementById( 'btnGrouper'   );
const btnEnregistrer = document.getElementById( 'btnEnregistrer' );
const btnExport  = document.getElementById( 'btnExporter'  );


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
		mettreAJourDate(data);


		const cached = sessionStorage.getItem('groupes_cache');
		if (cached)
			groupeCache = JSON.parse(cached);


		/* Gestion de données lors d'un retour sur la page */
		if ( sessionStorage.getItem('statistiques') )
			mettreAJourStats( JSON.parse(sessionStorage.getItem('statistiques')) );

		if ( sessionStorage.getItem('candidats') )
			mettreAJourTab(JSON.parse(sessionStorage.getItem('candidats')));

		if ( sessionStorage.getItem('btnFiltrer-disabled') )
			btnFiltrer.disabled = JSON.parse(sessionStorage.getItem('btnFiltrer-disabled'));

		if ( sessionStorage.getItem( 'btnGrouper-disabled') )
			btnGrouper.disabled = JSON.parse(sessionStorage.getItem('btnGrouper-disabled'));

		if ( sessionStorage.getItem('btnExport-disabled') )
			btnExport.disabled = JSON.parse(sessionStorage.getItem('btnExport-disabled'));

		if ( sessionStorage.getItem('btnAnnee-disabled') )
			btnAnnee.disabled = JSON.parse(sessionStorage.getItem('btnAnnee-disabled'));

		if ( sessionStorage.getItem('btnMAJ-disabled') )
			btnMAJ.disabled = JSON.parse(sessionStorage.getItem('btnMAJ-disabled'));
	}
	catch (error)
	{
		console.error('Erreur lors du chargement de la page :', error);
		alert('Erreur lors du chargement de la page');
	}
});

btnAnnee.addEventListener( 'click', recupererDonnees);

btnMAJ.addEventListener( 'click', recupererDonnees );

btnGrouper.addEventListener( 'click', () => {
	window.location.href = `../groupe.php`;
});

btnFiltrer.addEventListener( 'click', () => {
	window.location.href = `../filtrer.php`;
})

anneeSelect.addEventListener( 'change', () => {
	btnAnnee.disabled = false;
	btnMAJ.disabled = true;
});

function mettreAJourDate(data)
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
	allCandidats = candidats || [];
	filteredCandidats = [...allCandidats];
	currentPage = 1;
	renderTable();
}

function renderTable()
{
	/* Initialisation du corps du tableau */
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
			<td>${escapeHtml(c.civilite)}</td>
			<td>${escapeHtml(c.profilcand)}</td>
			<td>${escapeHtml(c.nometab)}</td>
			<td>${escapeHtml(c.nomcommu)}</td>
			<td>${escapeHtml(c.nomdept)}</td>
			<td>${escapeHtml(c.pays)}</td>
			<td>${escapeHtml(c.codeseriedip)}</td>
			<td>${escapeHtml(c.libseriedip)}</td>
			<td>${escapeHtml(c.libSpe)}</td>
		`;

		const td = document.createElement( 'td' );

		if ( c.speterm1 )
		{
			td.innerHTML = `<td>${escapeHtml(c.speterm1)} / ${escapeHtml(c.speterm2)}`;

			if ( c.speterm3 )
				td.innerHTML += `${escapeHtml(c.speterm3)}</td>`
		}

		tr.appendChild( td );

		tr.innerHTML += `
			<td>${escapeHtml(c.speabandon)}</td>
			<td>${escapeHtml(c.noteglobale)}</td>
			<td>${escapeHtml(c.noteficheavenir)}</td>
			<td>${escapeHtml(c.notelycee)}</td>
			<td>${escapeHtml(c.notedossier)}</td>
			<td>${escapeHtml(c.commentaire)}</td>
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

function escapeHtml(str) {
	if (!str) return '';
	return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

document.getElementById('btnExporter').addEventListener('click', downloadExcel);

async function downloadExcel() {
	const annee = document.getElementById( 'annee-select' ).value;

	const response = await fetch(`/export.php?annee=${encodeURIComponent(annee)}`);
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

async function recupererDonnees()
{
	const annee = anneeSelect.value;

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

		sessionStorage.removeItem( 'btnFiltrer-disabled' );
		btnFiltrer.disabled = false;
		sessionStorage.setItem( 'btnFiltrer-disabled', JSON.stringify( btnFiltrer.disabled ) );

		sessionStorage.removeItem( 'btnGrouper-disabled' );
		btnGrouper.disabled = false;
		sessionStorage.setItem( 'btnGrouper-disabled', JSON.stringify( btnGrouper.disabled ) )

		sessionStorage.removeItem( 'btnExport-disabled' );
		btnExport.disabled = false;
		sessionStorage.setItem( 'btnExport-disabled', JSON.stringify( btnExport.disabled ) );

		sessionStorage.removeItem( 'btnAnnee-disabled' );
		btnAnnee.disabled = true;
		sessionStorage.setItem( 'btnAnnee-disabled', JSON.stringify( btnAnnee.disabled ) );

		sessionStorage.removeItem( 'btnMAJ-disabled' );
		btnMAJ.disabled = false;
		sessionStorage.setItem( 'btnMAJ-disabled', JSON.stringify( btnMAJ.disabled ) );
	}
	catch (error)
	{
		console.error('Erreur lors de l\'initialisation:', error);
		alert('Impossible de se connecter au serveur. Assurez-vous que le backend est lancé sur http://localhost:8000');
	}
}