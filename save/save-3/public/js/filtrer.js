const TYPE_BAC_1 = `
    <div class="filter-field">
        <label class="filter-label">Spécialités de terminale n°1 :</label>
        <select id="spe-term-1" class="filter-select">
        </select>
    </div>
    <div class="filter-field">
        <label class="filter-label">Spécialités de terminale n°2 :</label>
        <select id="spe-term-2" class="filter-select">
        </select>
    </div>
    <div class="filter-field">
        <label class="filter-label">Spécialité abandonnée en première :</label>
        <select id="spe-aban-prem" class="filter-select">
        </select>
    </div>
`;

const TYPE_BAC_2 = `
    <div class="filter-field">
        <label class="filter-label">Spécialité :</label>
        <select id="specialite" class="filter-select">
        </select>
    </div>
`

const btnAnnuler   = document.getElementById( 'btnAnnuler'   );
const btnConfirmer = document.getElementById( 'btnConfirmer' );

window.addEventListener( 'load', async () => {
    try
    {
        /* Mise à jour des données pour le filtrage */
        const reponse = await fetch(`/filtrer_data.php` );

        if ( ! reponse.ok )
            throw new Error(`Erreur lors du chargement de la page`);

        const data = await reponse.json();

        console.log( data );
    }
    catch (error)
    {
        console.error('Erreur lors de la récupération des données : ', error);
        alert('Erreur lors de la récupération des données');
    }
});


btnAnnuler.addEventListener( 'click', () => {
    window.location.href = '/tableau.php';
});

btnConfirmer.addEventListener( 'click', async () => {
    const filtres = {
        typeBac:          document.getElementById('typeBac-select').value,
        noteGlobaleMin:   document.getElementById('noteGlobale-min').value,
        noteGlobaleMax:   document.getElementById('noteGlobale-max').value,
        noteFicAvenirMin: document.getElementById('noteFicheAvenir-min').value,
        noteFicAvenirMax: document.getElementById('noteFicheAvenir-max').value,
        civilite:         document.getElementById('civilite-select').value,
        nvBourse:         document.getElementById('bourse-select').value,
        etablissement:    document.getElementById('etablissement-select').value,
        commune:          document.getElementById('commune-select').value,
        departement:      document.getElementById('departement-select').value,
        pays:             document.getElementById('pays-select').value,
    };
});