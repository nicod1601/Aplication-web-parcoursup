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
const ROWS_PER_PAGE = 5;
let currentPage = 1;

document.querySelector('.btn-primary[type="button"]')?.addEventListener('click', function() {
    const nom = document.querySelector('input[name="nom"]').value;
    const prenom = document.querySelector('input[name="prenom"]').value;
    const email = document.querySelector('input[name="email"]').value;
    const pass = document.querySelector('input[name="mot_de_passe"]').value;
    const validation = validateAccountInput(nom, prenom, email, pass);

    if (!validation.isValid) {
        alert(validation.errors.join('\n'));
        return;
    }

    const { nom: nomValid, prenom: prenomValid, email: emailValid, pass: passValid } = validation.values;

    pendingAccounts.push({
        nomCompte: nomValid,
        prenomCompte: prenomValid,
        emailCompte: emailValid,
        passCompte: passValid,
        isAdmin: false
    });

    const totalPages = Math.max(1, Math.ceil(pendingAccounts.length / ROWS_PER_PAGE));
    currentPage = totalPages;
    renderTable();
    document.getElementById('createAccountForm').reset();
    document.querySelector('input[name="mot_de_passe"]').type = 'password';
});

function renderTable() {
    const tbody = document.querySelector('.accounts-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    const totalPages = Math.max(1, Math.ceil(pendingAccounts.length / ROWS_PER_PAGE));
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    const end = start + ROWS_PER_PAGE;
    const paginatedItems = pendingAccounts.slice(start, end);

    paginatedItems.forEach((acc, relativeIndex) => {
        const absoluteIndex = start + relativeIndex;

        const row = `
                <tr>
                    <td>${acc.nomCompte}</td>
                    <td>${acc.prenomCompte}</td>
                    <td>${acc.emailCompte}</td>
                    <td>••••••••</td>
                    <td>
                        <input type="checkbox" class="admin-checkbox" data-index="${absoluteIndex}" ${acc.isAdmin ? 'checked' : ''}>
                    </td>
                    <td>
                        <button type="button" class="btn-outline" onclick="removeAccount(${absoluteIndex})">✖ Retirer</button>
                    </td>
                </tr>
            `;
        tbody.innerHTML += row;
    });

    // Re-bind checkbox events
    document.querySelectorAll('.admin-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const index = parseInt(this.dataset.index);
            pendingAccounts[index].isAdmin = this.checked;
        });
    });

    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const container = document.getElementById('pagination');
    if (!container) return;

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = `<button class="btn-outline" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">⟵ Previous</button>`;

    for (let page = 1; page <= totalPages; page++) {
        html += `<button class="btn-outline page-number ${page === currentPage ? 'active' : ''}" data-page="${page}">${page}</button>`;
    }

    html += `<button class="btn-outline" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">Next ⟶</button>`;

    container.innerHTML = html;

    container.querySelectorAll('button[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetPage = parseInt(btn.dataset.page, 10);
            if (!Number.isNaN(targetPage) && targetPage >= 1 && targetPage <= totalPages) {
                currentPage = targetPage;
                renderTable();
            }
        });
    });
}

window.removeAccount = function(index) {
    pendingAccounts.splice(index, 1);

    const totalPages = Math.max(1, Math.ceil(pendingAccounts.length / ROWS_PER_PAGE));
    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    renderTable();
};

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

document.getElementById('createAccountForm')?.addEventListener('submit', (e) => e.preventDefault());

function validateAccountInput(nom, prenom, email, pass) {
    const errors = [];

    const nomTrim = nom.trim();
    const prenomTrim = prenom.trim();
    const emailTrim = email.trim();

    const nameRegex = /^[\p{L}\s'-]{2,50}$/u;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

    if (!nameRegex.test(nomTrim)) {
        errors.push("Nom invalide (2-50 caractères, lettres/espaces/-/').");
    }

    if (!nameRegex.test(prenomTrim)) {
        errors.push("Prénom invalide (2-50 caractères, lettres/espaces/-/').");
    }

    if (!emailRegex.test(emailTrim)) {
        errors.push("Email invalide.");
    }

    if (!passRegex.test(pass)) {
        errors.push("Mot de passe invalide (8+ chars, majuscule, minuscule, chiffre, caractère spécial).");
    }

    return {
        isValid: errors.length === 0,
        errors,
        values: { nom: nomTrim, prenom: prenomTrim, email: emailTrim, pass }
    };
}
