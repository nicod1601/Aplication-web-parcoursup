const anneeSelect= document.getElementById( 'annee-select' );
const btnAnnee   = document.getElementById( 'btnAnnee'     );

tableauVide();

function tableauVide() {
	// On remet le tableau vide dans le placeholder, sans le supprimer
	const placeholder = document.querySelector('.content-placeholder');
	placeholder.innerHTML = `
		<table id="tableau-candidats" class="table table-striped"></table>
		<p id="msg-vide" style="text-align:center; padding:30px; color:gray; font-style:italic; font-size:1.2em;">
			Aucune donnée à afficher
		</p>
	`;
}

window.addEventListener( 'load', async () => {
	try
	{
		const reponse = await fetch(`/loadTableau.php` );

		if ( ! reponse.ok )
			throw new Error(`Erreur lors du chargement de la page`);

		const data = await reponse.json();

		/* Mise à jour de la barre de sélection et du bouton */
		mettreAJourPage( data );
	}
	catch (error)
	{
		console.error('Erreur lors de l\'initialisation:', error);
		alert('Impossible de se connecter au serveur. Assurez-vous que le backend est lancé sur http://localhost:8000');
	}
});

btnAnnee.addEventListener( 'click', async  () => {
	const annee = document.getElementById( 'annee-select' ).value;

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

		/* MISE À JOUR DES DONNÉES */
		mettreAJourStats( data.statistiques );
		mettreAJourTab( data.candidats );
	}
	catch (error)
	{
		console.error('Erreur lors de l\'initialisation:', error);
		alert('Impossible de se connecter au serveur. Assurez-vous que le backend est lancé sur http://localhost:8000');
	}
});

async function mettreAJourPage(data)
{
	if ( ! data.annees ) return;


	anneeSelect.innerHTML = ``;

	data.annees.forEach( annee => {
		anneeSelect.innerHTML = `<option value=${annee.value}>${annee.value}</option>`
	});

	btnAnnee.disabled = false;
}

async function mettreAJourStats( statistiques )
{
	console.log( statistiques );

	const cardDiplome = document.getElementById( 'card-diplome' );
	const cardTotal   = document.getElementById( 'card-total'   );
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
	const tableau = document.getElementById('tableau-candidats');
	tableau.innerHTML =`
		<thead>
			<td>Code du candidat</td>
			<td>Nom du candidat</td>
			<td>Prénom du candidat</td>
			<td>Civilité du candidat</td>
			<td>Profil du candidat</td>
		</thead>
	`

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

	barreRch.addEventListener('input', Recherche);

	function Recherche() {
		const query = barreRch.value.toLowerCase();
		const ligne = tableau.getElementsByTagName('tr');

		filtreLigne = Array.from(ligne).slice(1);

		filtreLigne.forEach(l => {
			const nom = l.cells[1].textContent.toLowerCase();
			const prenom = l.cells[2].textContent.toLowerCase();
			const civilite = l.cells[3].textContent.toLowerCase();
			const profil = l.cells[4].textContent.toLowerCase();
			if (nom.includes(query) || prenom.includes(query) || civilite.includes(query) || profil.includes(query)) {
				l.style.display = '';
			} else {
				l.style.display = 'none';
			}
		});
		
	}
}