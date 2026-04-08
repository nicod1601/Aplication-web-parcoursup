window.addEventListener('load', async () => {
    try {
        const reponse = await fetch(`/groupe_data.php`);

        if (!reponse.ok)
            throw new Error(`Erreur lors du chargement des données`);

        const data = await reponse.json();

        /* Gestion des noms des groupes lors d'un retour sur la page */
        const nomsEnregistres = JSON.parse(sessionStorage.getItem('nomsGroupes')) || {};

        mettreAJourPage(data.groupes, nomsEnregistres);
    }
    catch (error) {
        console.error('Erreur lors de l\'initialisation des groupes:', error);
        alert('Impossible de récupérer la donnée des groupes');
    }
});

function mettreAJourPage(groupes, nomsEnregistres)
{
    groupes.forEach(groupe => {
        const cardGroupe = document.getElementById('card-groupe');
        const nomInitial = nomsEnregistres[groupe.codeseriedip] || `Groupe ${groupe.codeseriedip}`;


        cardGroupe.innerHTML += `
        <div class="card card-groupe-item" data-code="${groupe.codeseriedip}">
            <div class="card-header">
                <span class="header-title">Détails du Groupe ${groupe.codeseriedip}</span>
                <div class="dots-group">
                    <div class="dot-header"></div>
                    <div class="dot-header red"></div>
                    <div class="dot-header"></div>
                </div>
            </div>
            <div class="card-body-groupe">
                <div class="groupe-info">
                    <h3 class="nom-groupe-editable" contenteditable="true" data-code="${groupe.codeseriedip}" data-original="${nomInitial}">${nomInitial}</h3>
                    <span class="badge badge-navy badge-origine">Origine : ${groupe.codeseriedip}</span>
                </div>
            </div>  
            <div class="card-actions-groupe">
               <a href="groupe.php?codeSerieDip=${encodeURIComponent(groupe.codeseriedip)}" class="btn-outline btn-sm" style="text-decoration:none">
                    Voir les candidats
               </a>
            </div>
        </div>
        `;
    });

    const nomsEditables = document.querySelectorAll('.nom-groupe-editable');

    nomsEditables.forEach(nom => {
        nom.addEventListener('input', () => {
            let modificationReelle = false;

            // On scanne tous les titres pour voir s'il reste une modif quelque part
            nomsEditables.forEach(el => {
                const texteActuel = el.innerText.trim();
                const texteOriginal = el.getAttribute('data-original');

                if (texteActuel !== texteOriginal) {
                    modificationReelle = true;
                }
            });

            // Le bouton s'active seulement si une différence persiste
            btnEnregistrer.disabled = !modificationReelle;
        });

        nom.addEventListener( 'keypress', (e) => {
           if ( e.key === 'Enter')
               e.preventDefault();
        });
    });
}

const btnRetour = document.getElementById( 'btnRetour' );
btnRetour.addEventListener( 'click', () => {
    window.location.href = '../tableau.php'
});

btnEnregistrer.addEventListener('click', () => {
    const nomsEditables = document.querySelectorAll('.nom-groupe-editable');
    const nomsGroupes = JSON.parse(sessionStorage.getItem('nomsGroupes')) || {};

    nomsEditables.forEach(nom => {
        const code = nom.getAttribute('data-code');
        const nouveauTexte = nom.innerText.trim();

        nomsGroupes[code] = nouveauTexte;
        nom.setAttribute('data-original', nouveauTexte);
    });

    sessionStorage.setItem('nomsGroupes', JSON.stringify(nomsGroupes));
    btnEnregistrer.disabled = true;
});