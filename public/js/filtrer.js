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

const btnAnnuler   = document.getElementById( 'btnAnnuler'   );
const btnConfirmer = document.getElementById( 'btnConfirmer' );


window.addEventListener( 'load', async () => {
    // Gestion de l'affichage des valeurs des sliders
    const sliders = [
        { min: 'noteGlobale-min', max: 'noteGlobale-max' },
        { min: 'noteFicheAvenir-min', max: 'noteFicheAvenir-max' }
    ];

    sliders.forEach(group => {
        const minInput = document.getElementById(group.min);
        const maxInput = document.getElementById(group.max);

        // On cible les span qui affichent la valeur
        const displayMin = minInput.parentElement.previousElementSibling;
        const displayMax = maxInput.parentElement.nextElementSibling;

        minInput.addEventListener('input', () => { displayMin.textContent = minInput.value; });
        maxInput.addEventListener('input', () => { displayMax.textContent = maxInput.value; });
    });

    const selects = document.getElementsByTagName( 'select' );
    for (let cpt = 0; cpt < selects.length ; cpt++)
    {
        const select = selects.item( cpt );
        addOption( '-----Sélectionner-----', select );
    }
});

btnAnnuler.addEventListener( 'click', () => {
    window.location.href = '/tableau.php';
});

function addOption( value, parent )
{
    if (! value && value !== "") return;

    const option = document.createElement( 'option' );
    option.value = value;
    option.textContent = value;

    if ( value === "-----Sélectionner-----" )
    {
        option.disabled = true;
        option.selected = true;
    }

    parent.appendChild( option );
}