document.querySelector("form").addEventListener("submit", (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        alert("Veuillez remplir tous les champs du formulaire.");
        return;
    }

    fetch('/connexion.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())

    .then(data => {
        if (data.success) {
            window.location.href = '/platforme.php';
        } else {
            alert("Email ou mot de passe incorrect.");
        }
    })
    .catch(error => console.error('Error:', error));

})