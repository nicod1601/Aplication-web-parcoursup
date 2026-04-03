const menuItems = document.querySelectorAll('.menu-item');
if(menuItems[4]) menuItems[4].classList.add('active');

menuItems.forEach(item => {
    item.addEventListener('click', () => {
        menuItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const page = item.getAttribute('href').substring(1);
        window.location.href = `../../public/${page}`;
    });
});

const tabButtons = document.querySelectorAll('.tab-button');
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
    });
});

// --- Générateur de mot de passe ---
document.querySelector('.btn-password-generate')?.addEventListener('click', function() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const inputPass = document.querySelector('input[name="mot_de_passe"]');
    inputPass.value = password;
    inputPass.type = 'text';
});

// ============================================================
// LOGIQUE DE CRÉATION DE COMPTE (BATCH PROCESSING)
// ============================================================

let pendingAccounts = [];

document.querySelector('.btn-primary[type="button"]')?.addEventListener('click', function() {
    const nom = document.querySelector('input[name="nom"]').value;
    const prenom = document.querySelector('input[name="prenom"]').value;
    const email = document.querySelector('input[name="email"]').value;
    const pass = document.querySelector('input[name="mot_de_passe"]').value;

    if (!nom || !prenom || !email || !pass) {
        alert("Veuillez remplir tous les champs du formulaire.");
        return;
    }

    const isAdmin = false;

    pendingAccounts.push({
        nomCompte: nom,
        prenomCompte: prenom,
        emailCompte: email,
        passCompte: pass,
        isAdmin: isAdmin
    });

    renderTable(); // Met à jour l'affichage
    document.getElementById('createAccountForm').reset();
    document.querySelector('input[name="mot_de_passe"]').type = 'password';
});

// 2. Fonction pour dessiner les lignes dans le tableau HTML
function renderTable() {
    const tbody = document.querySelector('.accounts-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    pendingAccounts.forEach((acc, index) => {
        const row = `
                <tr>
                    <td>${acc.nomCompte}</td>
                    <td>${acc.prenomCompte}</td>
                    <td>${acc.emailCompte}</td>
                    <td>••••••••</td>
                    <td>
                        <input type="checkbox" class="admin-checkbox" data-index="${index}" ${acc.isAdmin ? 'checked' : ''}>
                    </td>
                    <td>
                        <button type="button" class="btn-outline" onclick="removeAccount(${index})">✖ Retirer</button>
                    </td>
                </tr>
            `;
        tbody.innerHTML += row;
    });

    document.querySelectorAll('.admin-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const index = parseInt(this.dataset.index);
            pendingAccounts[index].isAdmin = this.checked;
        });
    });
}


// Retirer un compte de la liste avant l'envoi
window.removeAccount = function(index) {
    pendingAccounts.splice(index, 1);
    renderTable();
};

// 4. Bouton "Enregistrer" : Envoie TOUT le tableau au PHP
document.querySelector('.action-button-center .btn-primary')?.addEventListener('click', async function() {
    if (pendingAccounts.length === 0) {
        alert("Le tableau est vide. Ajoutez des comptes avant d'enregistrer.");
        return;
    }

    try {
        const response = await fetch('/creation.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pendingAccounts)
        });

        const result = await response.json();

        if (result.success) {
            alert(pendingAccounts.length + ' compte(s) créé(s) avec succès !');
            pendingAccounts = [];
            renderTable();
        } else {
            alert('Erreur technique : ' + result.error);
        }
    } catch (error) {
        console.error(error);
        alert('Erreur de communication avec le serveur (vérifiez votre tunnel SSH).');
    }
});

// Désactiver le submit classique du formulaire pour éviter les rechargements accidentels
document.getElementById('createAccountForm')?.addEventListener('submit', (e) => e.preventDefault());