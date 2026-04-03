const anneeSelect= document.getElementById( 'annee-select' );
const btnAnnee   = document.getElementById( 'btnAnnee'     );

const btnFiltrer = document.getElementById( 'btnFiltrer' );

let groupeCache = null;
let modeGrouper  = false;

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

async function mettreAJourTab(candidats)
{
	const tableauDonnees = document.getElementById('tableau-data');
	tableauDonnees.innerHTML = ``;

	candidats.forEach(c => {
		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td>${c.codecand}</td>
			<td>${c.nomcand}</td>
			<td>${c.prenomcand}</td>
			<td>${c.civilite}</td>
			<td>${c.profilcand}</td>
		`;
		tableauDonnees.appendChild(tr);
	});
}

const barreRch = document.getElementById('barre-recherche');

if (barreRch)
	barreRch.addEventListener('input', Recherche);

function Recherche() {
	const tableau = document.getElementById('tableau-data'); // récupéré dynamiquement
	if (!tableau) return;

	const query  = barreRch.value.toLowerCase();
	const lignes = Array.from(tableau.getElementsByTagName('tr')).slice(1);

	lignes.forEach(l => {
		const nom      = l.cells[1]?.textContent.toLowerCase() ?? '';
		const prenom   = l.cells[2]?.textContent.toLowerCase() ?? '';
		const civilite = l.cells[3]?.textContent.toLowerCase() ?? '';
		const profil   = l.cells[4]?.textContent.toLowerCase() ?? '';

		l.style.display = (nom.includes(query) || prenom.includes(query) ||
			civilite.includes(query) || profil.includes(query))
			? '' : 'none';
	});
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