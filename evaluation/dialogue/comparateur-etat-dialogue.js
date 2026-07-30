const COLLECTIONS = Object.freeze([
  ['faits', 'Fait'],
  ['objectifs', 'Objectif'],
  ['decisions', 'Décision'],
])

function egal(attendu, obtenu) {
  return JSON.stringify(attendu) === JSON.stringify(obtenu)
}

function ajouterEcart(ecarts, section, type, message, attendu, obtenu) {
  ecarts.push({
    section,
    type,
    message,
    attendu,
    obtenu,
  })
}

function comparerCollection(ecarts, nom, libelle, attendus, obtenus) {
  const obtenusParId = new Map(obtenus.map(objet => [objet.id, objet]))
  const attendusParId = new Map(attendus.map(objet => [objet.id, objet]))

  for (const attendu of attendus) {
    const obtenu = obtenusParId.get(attendu.id)
    if (!obtenu) {
      ajouterEcart(
        ecarts,
        nom,
        'manquant',
        `${libelle} manquant : ${attendu.id}.`,
        attendu,
        null,
      )
    } else if (!egal(attendu, obtenu)) {
      ajouterEcart(
        ecarts,
        nom,
        'different',
        `${libelle} différent : ${attendu.id}.`,
        attendu,
        obtenu,
      )
    }
  }

  for (const obtenu of obtenus) {
    if (!attendusParId.has(obtenu.id)) {
      ajouterEcart(
        ecarts,
        nom,
        'supplementaire',
        `${libelle} supplémentaire : ${obtenu.id}.`,
        null,
        obtenu,
      )
    }
  }
}

function extrairePersonnages(etatDialogue) {
  const personnages = new Set()
  const ajouter = identifiant => {
    if (typeof identifiant === 'string' && identifiant !== '') personnages.add(identifiant)
  }

  for (const objectif of etatDialogue.objectifs) {
    objectif.participantIds.forEach(ajouter)
  }
  for (const decision of etatDialogue.decisions) {
    decision.participantIds.forEach(ajouter)
  }
  for (const contrainte of etatDialogue.contraintes) {
    contrainte.participantIds.forEach(ajouter)
  }
  for (const question of etatDialogue.questionsOuvertes) {
    ajouter(question.auteurId)
    question.destinataireIds.forEach(ajouter)
  }
  for (const reponse of etatDialogue.reponses) {
    ajouter(reponse.auteurId)
  }
  for (const fait of etatDialogue.faitsAConfirmer) {
    fait.confirmationParticipantIds.forEach(ajouter)
  }

  return [...personnages].sort()
}

export function comparerEtatsDialogue(attendu, obtenu) {
  const ecarts = []

  for (const [nom, libelle] of COLLECTIONS) {
    comparerCollection(ecarts, nom, libelle, attendu[nom], obtenu[nom])
  }

  if (!egal(attendu.evenementSourceIds, obtenu.evenementSourceIds)) {
    ajouterEcart(
      ecarts,
      'evenementSourceIds',
      'different',
      'Les événements sources racine diffèrent.',
      attendu.evenementSourceIds,
      obtenu.evenementSourceIds,
    )
  }

  const personnagesAttendus = extrairePersonnages(attendu)
  const personnagesObtenus = extrairePersonnages(obtenu)
  if (!egal(personnagesAttendus, personnagesObtenus)) {
    ajouterEcart(
      ecarts,
      'personnages',
      'different',
      'Les personnages explicitement référencés diffèrent.',
      personnagesAttendus,
      personnagesObtenus,
    )
  }

  if (attendu.dateMiseAJour !== obtenu.dateMiseAJour) {
    ajouterEcart(
      ecarts,
      'dateMiseAJour',
      'different',
      'La date de mise à jour diffère.',
      attendu.dateMiseAJour,
      obtenu.dateMiseAJour,
    )
  }

  return {
    conforme: ecarts.length === 0,
    ecarts,
  }
}
