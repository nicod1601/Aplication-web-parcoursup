window.addEventListener( 'load', async () => {
    try
    {
        const codeSerieDip = document.getElementById( 'codeSerieDip' ).textContent.trim();

        const reponse = await fetch(`/groupe_detail_data.php?codeSerieDip=${encodeURIComponent(codeSerieDip)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer appli-secret-token`,
                'Content-Type': 'application/json'
            }
        });

        if ( ! reponse.ok )
            throw new Error(`Erreur lors du chargement des données`);

        const data = await reponse.json();

        mettreAJourTab( data.candidats );
    }
    catch (error)
    {
        console.error('Erreur lors de l\'initialisation des groupes:', error);
        alert('Impossible de récupérer la donnée des groupes');
    }
});

let groupeCache = null;
let modeGrouper  = false;
let allCandidats = [];
let filteredCandidats = [];
let currentPage = 1;
const rowsPerPage = 25;

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
        tableauDonnees.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:30px;color:gray;">Aucun candidat trouvé</td></tr>`;
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
			<td>${escapeHtml(c.nomcand)} ${escapeHtml(c.prenomcand)}</td>
			<td>${escapeHtml(c.civilite)}</td>
			<td>${escapeHtml(c.profilcand)}</td>
			<td>${escapeHtml(c.codeseriedip)}</td>
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

function updatePagination()
{
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

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const btnRetour = document.getElementById( 'btnRetour' );

btnRetour.addEventListener('click', ()  => {
   window.location.href = '../groupe.php';
});

const errorMsg = document.getElementById('noteError');
const noteDossier = document.getElementById( 'noteDossierGroupe' );
const btnEnregistrer = document.getElementById( 'btnEnregistrer' );

noteDossier.addEventListener( 'input', () => {
    noteParsee = parseFloat( noteDossier.textContent );

    if ( noteDossier.textContent !== "" && noteParsee >= 0 && noteParsee <= 20 )
        btnEnregistrer.disabled = false;
    else
        btnEnregistrer.disabled = true;
});

noteDossier.addEventListener( 'keypress', (e) => {
    if ( e.key === 'Enter' )
        e.preventDefault();
})

btnEnregistrer.addEventListener( 'click', async () => {
    const codeSerieDip = document.getElementById( 'codeSerieDip' ).textContent.trim();
    const noteDossier = document.getElementById('noteDossierGroupe').textContent.trim();

    try
    {
        const reponse = await fetch(`/groupe_detail_update.php`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer appli-secret-token`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                codeSerieDip: codeSerieDip,
                noteDossierGroupe: noteDossier
            })
        });

        if ( ! reponse.ok )
            throw new Error(`Erreur lors du chargement des données`);
        else
            window.location.href = '../groupe.php';
    }
    catch (error)
    {
        console.error('Erreur lors de l\'initialisation des groupes:', error);
        alert('Impossible de récupérer la donnée des groupes');
    }
});