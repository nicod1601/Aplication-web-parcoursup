<?php
// sessionCandidats.php

session_start();
header('Content-Type: application/json');
echo json_encode(['candidats' => $_SESSION['candidats'] ?? []]);