function listeAnnee(){
	const annee = new Date().getFullYear();
	const anneeSelect = document.getElementById('annee-select');
	let options = '';
	for(let cpt = 0; cpt < 10; cpt++){
		const startYear = annee + cpt;
		const endYear = startYear + 1;
		options += `<option value="${startYear}-${endYear}">${startYear} - ${endYear}</option>`;
	}
	anneeSelect.innerHTML = options;
}

listeAnnee();

// Gestion du Menu
const menuItems = document.querySelectorAll('.menu-item');
menuItems[3].classList.add('active');

menuItems.forEach(item => {
	item.addEventListener('click', () => {
		menuItems.forEach(i => i.classList.remove('active'));
		item.classList.add('active');

		const page = item.getAttribute('href').substring(1);
		window.location.href = `../../public/${page}`;

	});
});

// TableauS
const fileInput = document.getElementById('file-input');
const confirmBtnContainer = document.getElementById('confirm-btn-container');
const table = document.getElementById('excel-table');
const LIMITE_LIGNES = 25;
const paginationBar = document.getElementById('paginationBar');
const traitementText = document.getElementById('traitement');
let excelData = [];
let currentPage = 1;

renderTable([]);

fileInput.addEventListener('change', (e) => {
	const file = e.target.files[0];
	const reader = new FileReader();

	document.getElementById('loading-overlay').style.display = 'flex';
	traitementText.textContent = 'Lecture du fichier en cours...';

	reader.onload = (event) => {
		const data = new Uint8Array(event.target.result);
		const workbook = XLSX.read(data, { type: 'array' });

		const firstSheetName = workbook.SheetNames[0];
		const worksheet = workbook.Sheets[firstSheetName];

		excelData = XLSX.utils.sheet_to_json(worksheet);
		currentPage = 1;
		updateTable();

		document.getElementById('loading-overlay').style.display = 'none';
	};

	reader.readAsArrayBuffer(file);
});

function renderTable(data){

	table.innerHTML = "";

	if(!data || data.length === 0) {
		table.innerHTML = `
			<thead>
				<tr><th colspan="100">AUCUNE DONNÉE</th></tr>
			</thead>
			<tbody>
				<tr>
					<td colspan="100" style="text-align:center; padding: 30px; color: gray; font-style: italic;">
						📭 Aucune donnée à afficher — importez un fichier Excel
					</td>
				</tr>
			</tbody>
		`;
		return;
	}

	const ligneTitre = document.createElement('tr');
	const titre = document.createElement('thead');

	const headers = Object.keys(data[0]);
	headers.forEach(header => {
		const th = document.createElement('th');
		th.textContent = header;
		ligneTitre.appendChild(th);
	});
	titre.appendChild(ligneTitre);
	table.appendChild(titre);

	const ligne = document.createElement('tbody');
	data.forEach(row => {
		const tr = document.createElement('tr');
		headers.forEach(header => {
			const td = document.createElement('td');
			td.textContent = row[header] || '';
			tr.appendChild(td);
		});
		ligne.appendChild(tr);
	});
	table.appendChild(ligne);

}

function paginationTable(data){
	if(data == null)return;
	const totalPage = Math.ceil(data.length / LIMITE_LIGNES);
	let numPage = 1;

}

function updateTable(){
	const start = (currentPage - 1) * LIMITE_LIGNES;
	const end = start + LIMITE_LIGNES;
	const pageData = excelData.slice(start, end);
	renderTable(pageData);

	const totalPages = Math.ceil(excelData.length / LIMITE_LIGNES) || 1;
	document.getElementById('dossier-count').textContent = `${excelData.length} dossiers enregistrés`;

	confirmBtnContainer.innerHTML = `<button class="btn btn-primary" id="confirm-btn">Confirmer l'importation</button>`;

	paginationBar.innerHTML = `
		<button class="btn btn-secondary" id="prevPage" ${currentPage === 1 ? 'disabled' : ''}>Précédent</button>
		<span id="pageInfo">Page ${currentPage} sur ${totalPages}</span>
		<button class="btn btn-secondary" id="nextPage" ${currentPage === totalPages ? 'disabled' : ''}>Suivant</button>
	`;
}

paginationBar.addEventListener('click', (e) => {
	if (e.target.id === 'prevPage' && currentPage > 1) {
		currentPage--; updateTable();
	} else if (e.target.id === 'nextPage' && currentPage < Math.ceil(excelData.length / LIMITE_LIGNES)) {
		currentPage++; updateTable();
	}
});

// Utilisation de la délégation d'événement sur le conteneur
confirmBtnContainer.addEventListener('click', async (e) => {
	if (e.target && e.target.id === 'confirm-btn') {

	if (!excelData || excelData.length === 0) {
		alert("Veuillez d'abord choisir un fichier.");
		return;
	}

	console.log("Données envoyées :", excelData.length, "lignes", excelData[0]);

	const anneeSelect = document.getElementById('annee-select');
	const selectedYearText = anneeSelect.options[anneeSelect.selectedIndex].text;

	if (!confirm(`Voulez-vous vraiment importer ${excelData.length} lignes pour l'année scolaire ${selectedYearText} ?`)) {
		return;
	}



	try {

		document.getElementById('loading-overlay').style.display = 'flex';
		traitementText.textContent = 'Envoi en cours...';

		const response = await fetch('/import.php', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				excelData: excelData,
				annee: document.getElementById('annee-select').value
			})
		});

		const result = await response.json();
		if (result.success) {
			document.getElementById('loading-overlay').style.display = 'none';
			alert("Succès : " + result.message);
		} else {
			alert("Erreur : " + result.error);
		}
	} catch (error) {
		console.error("Erreur d'envoi :", error);
		alert("Erreur lors de la communication avec le serveur.");
	}
	}
});


//selection Annee
const anneeSelect = document.getElementById('annee-select');
anneeSelect.addEventListener('change', () => {
	const selectedYear = anneeSelect.value;
	console.log("Année sélectionnée :", selectedYear);
});
