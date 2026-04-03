const TYPE_BAC_1 = `
    <div class="filter-field">
        <label class="filter-label">Spécialités de terminale n°1 :</label>
        <select name="speTerm1" id="spe-term-1" class="filter-select">
        </select>
    </div>
    <div class="filter-field">
        <label class="filter-label">Spécialités de terminale n°2 :</label>
        <select name="speTerm2" id="spe-term-2" class="filter-select">
        </select>
    </div>
    <div class="filter-field">
        <label class="filter-label">Spécialité abandonnée en première :</label>
        <select name="speAbandonnee" id="spe-aban-prem" class="filter-select">
        </select>
    </div>
`;

const TYPE_BAC_2 = `
    <div class="filter-field">
        <label class="filter-label">Spécialité :</label>
        <select name="specialite" id="specialite" class="filter-select">
        </select>
    </div>
`;

const typeBacSelect       = document.getElementById( 'typeBac-select' );
const civiliteSelect      = document.getElementById( 'civilite-select' );
const bourseSelect        = document.getElementById( 'bourse-select' );
const etablissementSelect = document.getElementById( 'etablissement-select' );
const communeSelect       = document.getElementById( 'commune-select' );
const departementSelect   = document.getElementById( 'departement-select' );
const paysSelect          = document.getElementById( 'pays-select' );

const cardTypeBac = document.getElementById( 'cardBac' );

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

        majCardBaccalaureat ( data.baccalaureats  );
        majCardCivilite     ( data.civilites      );
        majCardEtablissement( data.etablissements );
    }
    catch (error)
    {
        console.error('Erreur lors de la récupération des données : ', error);
        alert('Erreur lors de la récupération des données');
    }
});

typeBacSelect.addEventListener( 'change', async () => {
   const typeBac = typeBacSelect.value;

   console.log( "Test d'événement" );

   try
   {
       const reponse = await fetch(`/filtrerSelect.php?typeBac=${encodeURIComponent(typeBac)}`, {
           method: 'GET',
           headers: {
               'Authorization': `Bearer appli-secret-token`,
               'Content-Type': 'application/json'
           }
       });

       if ( ! reponse.ok )
           throw new Error(`Erreur lors du chargement de la page`);

       const data = await reponse.json();

       console.log( data );

       majCardBaccalaureat( data.baccalaureats );
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

// Selects en cascade établissement → commune → département → pays
etablissementSelect.addEventListener('change', async () => {
    await majSelectsCascade({ etablissement: etablissementSelect.value });
});

communeSelect.addEventListener('change', async () => {
    await majSelectsCascade({ commune: communeSelect.value });
});

departementSelect.addEventListener('change', async () => {
    await majSelectsCascade({ departement: departementSelect.value });
});

async function majSelectsCascade(filtres)
{
    const params = new URLSearchParams(filtres);
    const reponse = await fetch(`/filtrerSelect.php?${params}`);
    const data    = await reponse.json();

    if (data.communes)     peupler(communeSelect,      data.communes,     'nomcommu');
    if (data.departements) peupler(departementSelect,  data.departements, 'nomdept');
    if (data.pays)         peupler(paysSelect,         data.pays,         'pays');
}

function peupler(select, items, cle)
{
    select.innerHTML = '<option value="">--</option>';
    items.forEach(item => addOption(item[cle], select));

    // Si un seul choix → sélection automatique
    if (items.length === 1) select.value = items[0][cle];
}

// Bouton Confirmer
btnConfirmer.addEventListener('click', async () => {

    const filtres = {
        typeBac:          typeBacSelect.value          || null,
        speTerm1:         document.getElementById('spe-term-1')?.value    || null,
        speTerm2:         document.getElementById('spe-term-2')?.value    || null,
        speAbandon:       document.getElementById('spe-aban-prem')?.value || null,
        specialite:       document.getElementById('specialite')?.value    || null,
        noteGlobaleMin:   document.getElementById('noteGlobale-min').value,
        noteGlobaleMax:   document.getElementById('noteGlobale-max').value,
        noteFicAvenirMin: document.getElementById('noteFicheAvenir-min').value,
        noteFicAvenirMax: document.getElementById('noteFicheAvenir-max').value,
        civilite:         civiliteSelect.value      || null,
        nvBourse:         bourseSelect.value        || null,
        etablissement:    etablissementSelect.value || null,
        commune:          communeSelect.value       || null,
        departement:      departementSelect.value   || null,
        pays:             paysSelect.value          || null,
    };

    try {
        const reponse = await fetch('/filtrer.php', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer appli-secret-token',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(filtres)
        });

        const data = await reponse.json();

        if (data.erreur) {
            alert(data.erreur);
            return;
        }

        // Filtres appliqués → retour sur le tableau
        sessionStorage.setItem('filtresAppliques', 'true');
        window.location.href = '/tableau.php';

    } catch (error) {
        console.error('Erreur filtrage :', error);
    }
});

function majCardBaccalaureat( baccalaureats )
{
    if ( baccalaureats.typeBac )
        baccalaureats.typeBac.forEach( bac => {
            addOption( bac.codeseriedip, typeBacSelect );
        });

    if ( baccalaureats.enseignementsSpecialites )
    {
        cardTypeBac.innerHTML += TYPE_BAC_1;

        const speTerm1Select      = document.getElementById( 'spe-term-1'    );
        const speTerm2Select      = document.getElementById( 'spe-term-2'    );
        const speAbandonneeSelect = document.getElementById( 'spe-aban-prem' );

        baccalaureats.enseignementsSpecialites.forEach( ensSpe => {
                addOption( ensSpe.libensspe, speTerm1Select      );
                addOption( ensSpe.libensspe, speTerm2Select      );
                addOption( ensSpe.libensspe, speAbandonneeSelect );
        });
    }

    if ( baccalaureats.specialites )
    {
        cardTypeBac.innerHTML += TYPE_BAC_2;

        const specialitesSelect = document.getElementById( 'specialite' );

        baccalaureats.specialites.forEach( spe => {
                addOption( spe.libspe, specialitesSelect );
        })
    }
}

function majCardCivilite( civilites )
{
    civilites.civilite.forEach( civ => {
        addOption( civ.civilite, civiliteSelect );
    });

    civilites.bourse.forEach( brs => {
        addOption( brs.nvbourscand, bourseSelect );
    });
}

function majCardEtablissement( etablissements )
{
    etablissements.etablissement.forEach( eta => {
        addOption( eta.nometab, etablissementSelect );
    });

    etablissements.commune.forEach( commu => {
        addOption( commu.nomcommu, communeSelect );
    });

    etablissements.departement.forEach( dept => {
        addOption( dept.nomdept, departementSelect );
    });

    etablissements.pays.forEach( pays => {
        addOption( pays.pays, paysSelect );
    });
}

function addOption( value, parent )
{
    if (! value && value !== "") return; // Évite les undefined

    const option = document.createElement( 'option' );
    option.value = value;
    option.textContent = value;

    if ( value === "" ) option.selected = true;
    parent.appendChild( option );
}