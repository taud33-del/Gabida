/**
 * Perception individuelle et deterministe d'un evenement canonique.
 * Contrat de donnees uniquement : aucune logique metier.
 *
 * @typedef {object} PerceptionParticipant
 * @property {string} participantId
 * @property {string} evenementId Identifiant de l'evenement canonique.
 * @property {boolean} perceptible
 * @property {unknown} contenuPercu
 * @property {string[]} canaux Valeurs de CANAUX_PERCEPTION.
 * @property {string} precision Valeur de PRECISIONS_PERCEPTION.
 * @property {string[]} raisons Raisons stables ayant conduit au resultat.
 * @property {Object} metadata Metadonnees explicites du contexte de perception.
 */
