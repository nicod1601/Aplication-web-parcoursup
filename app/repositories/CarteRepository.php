<?php
// app/repositories/CarteRepository.php

require_once '../app/core/Repository.php';

class CarteRepository
{
	private $pdo;

	private const DEPT_COORDS = [
		'01' => [46.200, 5.227],   '02' => [49.567, 3.617],   '03' => [46.340, 3.169],
		'04' => [44.092, 6.236],   '05' => [44.661, 6.353],   '06' => [43.938, 7.122],
		'07' => [44.734, 4.464],   '08' => [49.771, 4.720],   '09' => [42.964, 1.606],
		'10' => [48.299, 4.074],   '11' => [43.135, 2.349],   '12' => [44.350, 2.574],
		'13' => [43.529, 5.447],   '14' => [49.105, -0.361],  '15' => [45.046, 2.633],
		'16' => [45.700, 0.161],   '17' => [45.750, -0.670],  '18' => [47.085, 2.398],
		'19' => [45.274, 1.775],   '21' => [47.316, 5.041],   '22' => [48.270, -2.993],
		'23' => [46.001, 2.178],   '24' => [45.183, 0.718],   '25' => [47.237, 6.022],
		'26' => [44.728, 5.064],   '27' => [49.070, 1.173],   '28' => [48.448, 1.489],
		'29' => [48.236, -3.990],  '2A' => [41.860, 8.984],   '2B' => [42.350, 9.189],
		'30' => [43.949, 4.136],   '31' => [43.589, 1.440],   '32' => [43.645, 0.589],
		'33' => [44.841, -0.580],  '34' => [43.614, 3.877],   '35' => [48.117, -1.678],
		'36' => [46.810, 1.695],   '37' => [47.394, 0.690],   '38' => [45.249, 5.698],
		'39' => [46.668, 5.558],   '40' => [43.893, -0.499],  '41' => [47.590, 1.336],
		'42' => [45.433, 4.387],   '43' => [45.043, 3.884],   '44' => [47.218, -1.554],
		'45' => [47.902, 1.909],   '46' => [44.661, 1.441],   '47' => [44.351, 0.634],
		'48' => [44.518, 3.499],   '49' => [47.467, -0.551],  '50' => [49.115, -1.319],
		'51' => [49.044, 4.024],   '52' => [48.111, 5.139],   '53' => [48.073, -0.770],
		'54' => [48.692, 6.184],   '55' => [49.160, 5.378],   '56' => [47.783, -2.751],
		'57' => [49.120, 6.749],   '58' => [47.058, 3.659],   '59' => [50.470, 3.062],
		'60' => [49.414, 2.083],   '61' => [48.558, 0.090],   '62' => [50.457, 2.643],
		'63' => [45.779, 3.082],   '64' => [43.289, -0.367],  '65' => [43.232, 0.078],
		'66' => [42.699, 2.895],   '67' => [48.582, 7.751],   '68' => [47.750, 7.339],
		'69' => [45.748, 4.846],   '70' => [47.627, 6.154],   '71' => [46.785, 4.858],
		'72' => [47.995, 0.192],   '73' => [45.577, 6.401],   '74' => [46.045, 6.401],
		'75' => [48.857, 2.347],   '76' => [49.443, 1.099],   '77' => [48.607, 2.898],
		'78' => [48.787, 1.969],   '79' => [46.323, -0.458],  '80' => [49.893, 2.296],
		'81' => [43.926, 2.148],   '82' => [44.022, 1.353],   '83' => [43.467, 6.221],
		'84' => [43.950, 5.036],   '85' => [46.670, -1.426],  '86' => [46.580, 0.340],
		'87' => [45.835, 1.262],   '88' => [48.200, 6.449],   '89' => [47.798, 3.572],
		'90' => [47.638, 6.863],   '91' => [48.630, 2.229],   '92' => [48.855, 2.209],
		'93' => [48.921, 2.482],   '94' => [48.777, 2.457],   '95' => [49.045, 2.113],
		'971' => [16.265, -61.551], '972' => [14.641, -61.024], '973' => [3.934, -53.126],
		'974' => [-21.115, 55.536], '976' => [-12.827, 45.166],
	];

	private const COUNTRY_COORDS = [
		'Maroc'           => [31.791702, -7.092620],
		'Algérie'         => [28.033886,  1.659626],
		'Tunisie'         => [33.886917,  9.537499],
		'Sénégal'         => [14.497401, -14.452362],
		'Cameroun'        => [ 3.848030,  11.502075],
		"Côte d'Ivoire"   => [ 7.539989,  -5.547080],
		'Madagascar'      => [-18.766947, 46.869107],
		'Congo'           => [-0.228021,  15.827659],
		'Guinée'          => [ 9.945587,  -9.696645],
		'Mali'            => [17.570692,  -3.996166],
		'Liban'           => [33.854721,  35.862285],
		'Belgique'        => [50.503887,   4.469936],
		'Suisse'          => [46.818188,   8.227512],
		'Luxembourg'      => [49.815273,   6.129583],
		'Espagne'         => [40.463667,  -3.749220],
		'Italie'          => [41.871940,  12.567380],
		'Portugal'        => [39.399872,  -8.224454],
		'Allemagne'       => [51.165691,  10.451526],
		'Royaume-Uni'     => [55.378051,  -3.435973],
		'États-Unis'      => [37.090240, -95.712891],
		'Canada'          => [56.130366, -106.346771],
		'Chine'           => [35.861660,  104.195397],
		'Japon'           => [36.204824,  138.252924],
		'Brésil'          => [-14.235004, -51.925280],
		'Mexique'         => [23.634501,  -102.552784],
		'Gabon'           => [-0.803689,   11.609444],
		'Togo'            => [ 8.619543,    0.824782],
		'Bénin'           => [ 9.307690,    2.315834],
		'Burkina Faso'    => [12.364637,   -1.561593],
		'Niger'           => [17.607789,    8.081666],
		'Tchad'           => [15.454166,   18.732207],
		'Mauritanie'      => [21.007890,  -10.940835],
		'Djibouti'        => [11.825138,   42.590275],
		'Comores'         => [-11.875001,  43.872219],
		'Maurice'         => [-20.348404,  57.552152],
		'Réunion'         => [-21.115141,  55.536384],
		'Syrie'           => [34.802075,   38.996815],
		'Maroc'           => [31.791702,   -7.092620],
		'Éthiopie'        => [ 9.145000,   40.489673],
		'Égypte'          => [26.820553,   30.802498],
		'Israël'          => [31.046051,   34.851612],
		'Arabie Saoudite' => [23.885942,   45.079162],
		'Émirats Arabes Unis' => [23.424076, 53.847818],
		'Russie'          => [61.524010,   105.318756],
		'Pologne'         => [51.919438,   19.145136],
		'Pays-Bas'        => [52.132633,    5.291266],
		'Autriche'        => [47.516231,   14.550072],
		'Grèce'           => [39.074208,   21.824312],
	];

	public function __construct()
	{
		$this->pdo = Repository::getInstance()->getPDO();
	}

	public function getCandidatsForCarte(int $anneeDeb, int $anneeFin): array
	{
		$stmt = $this->pdo->prepare("
			SELECT
				c.idCand,
				c.codeCand,
				c.nomCand,
				c.prenomCand,
				c.civilite,
				c.profilCand,
				c.noteGlobale,
				c.noteLycee,
				sd.libSerieDip,
				sd.codeSerieDip,
				l.nomCommu,
				l.nomDept,
				l.pays,
				e.codePost
			FROM Candidat c
			JOIN SerieDiplome sd ON c.idSerieDip = sd.idSerieDip
			JOIN Etablissement e ON c.idEtab = e.idEtab
			JOIN Localisation l ON e.idLoc = l.idLoc
			WHERE c.anneeDeb = :anneeDeb AND c.anneeFin = :anneeFin
			ORDER BY sd.libSerieDip
		");
		$stmt->execute([':anneeDeb' => $anneeDeb, ':anneeFin' => $anneeFin]);
		$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

		foreach ($rows as &$row) {
			$coords = $this->getCoords($row['codepost'] ?? '', $row['pays'] ?? 'France');
			$row['lat'] = $coords[0];
			$row['lng'] = $coords[1];
		}

		return $rows;
	}

	public function getSeriesForAnnee(int $anneeDeb, int $anneeFin): array
	{
		$stmt = $this->pdo->prepare("
			SELECT DISTINCT sd.codeSerieDip, sd.libSerieDip
			FROM Candidat c
			JOIN SerieDiplome sd ON c.idSerieDip = sd.idSerieDip
			WHERE c.anneeDeb = :anneeDeb AND c.anneeFin = :anneeFin
			ORDER BY sd.libSerieDip
		");
		$stmt->execute([':anneeDeb' => $anneeDeb, ':anneeFin' => $anneeFin]);
		return $stmt->fetchAll(PDO::FETCH_ASSOC);
	}

	private function getCoords(string $codePost, string $pays = 'France'): array
	{
		// Pays étranger
		if ($pays !== 'France') {
			$hash = crc32($codePost . $pays);
			$latOffset = (($hash % 100) / 100 - 0.5) * 2;
			$lngOffset = ((($hash >> 8) % 100) / 100 - 0.5) * 2;

			if (isset(self::COUNTRY_COORDS[$pays])) {
				return [
					self::COUNTRY_COORDS[$pays][0] + $latOffset,
					self::COUNTRY_COORDS[$pays][1] + $lngOffset,
				];
			}

			// Pays inconnu : centre du monde avec variation
			return [20.0 + $latOffset, 10.0 + $lngOffset];
		}

		// France
		if (empty($codePost)) return [46.603354, 1.888334];

		// DOM-TOM
		if (str_starts_with($codePost, '971')) return self::DEPT_COORDS['971'];
		if (str_starts_with($codePost, '972')) return self::DEPT_COORDS['972'];
		if (str_starts_with($codePost, '973')) return self::DEPT_COORDS['973'];
		if (str_starts_with($codePost, '974')) return self::DEPT_COORDS['974'];
		if (str_starts_with($codePost, '976')) return self::DEPT_COORDS['976'];

		// Corse
		if (str_starts_with($codePost, '2A') || str_starts_with($codePost, '20')) {
			$n = (int)substr($codePost, 2, 3);
			return $n < 200 ? self::DEPT_COORDS['2A'] : self::DEPT_COORDS['2B'];
		}

		$deptCode = substr(str_pad($codePost, 5, '0', STR_PAD_LEFT), 0, 2);

		$hash = crc32($codePost);
		$latOffset = (($hash % 100) / 100 - 0.5) * 0.4;
		$lngOffset = ((($hash >> 8) % 100) / 100 - 0.5) * 0.4;

		if (isset(self::DEPT_COORDS[$deptCode])) {
			return [
				self::DEPT_COORDS[$deptCode][0] + $latOffset,
				self::DEPT_COORDS[$deptCode][1] + $lngOffset,
			];
		}

		return [46.603354 + $latOffset, 1.888334 + $lngOffset];
	}
}