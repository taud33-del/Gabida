/**
 * types/Participant.js
 *
 * Contrats de données du participant (Gabida V2 — Phase 1).
 *
 * Le participant devient l'unité centrale du moteur multi-participants : toute
 * entité prenant part à une interaction est un participant. Le personnage n'est
 * plus qu'un type de profil possible (voir ProfilParticipant).
 *
 * Aucune logique. Aucune dépendance. Aucune connaissance des modules.
 * Ces contrats sont génériques : ils ne supposent jamais qu'un participant est
 * forcément un personnage.
 *
 * Constantes utilisées :
 *   - TYPES_PARTICIPANT        (constants/TypesParticipant.js)        → Participant.type
 *   - STATUTS_PARTICIPANT      (constants/StatutsParticipant.js)      → Participant.statut
 *   - TYPES_PROFIL_PARTICIPANT (constants/TypesProfilParticipant.js)  → ProfilParticipant.type
 */

/**
 * @typedef {object} CapacitesParticipant
 *
 * Capacités techniques d'un participant : ce qu'il est autorisé à faire dans le
 * cycle d'interaction. Purement déclaratif — aucune de ces capacités n'est
 * implémentée en Phase 1.
 *
 * @property {boolean} peutPercevoir
 *   [obligatoire] Le participant peut percevoir les événements qui lui sont visibles.
 *
 * @property {boolean} peutAnalyser
 *   [obligatoire] Le participant peut analyser ce qu'il perçoit.
 *
 * @property {boolean} peutRessentir
 *   [obligatoire] Le participant peut produire un ressenti.
 *
 * @property {boolean} peutDecider
 *   [obligatoire] Le participant peut prendre une décision.
 *
 * @property {boolean} peutProduireAction
 *   [obligatoire] Le participant peut produire une action (ActionParticipant).
 *
 * @property {boolean} peutMemoriser
 *   [obligatoire] Le participant dispose d'une mémoire propre.
 */

/**
 * @typedef {object} ProfilParticipant
 *
 * Profil narratif d'un participant : ce qu'il incarne. Le profil est optionnel
 * au niveau du participant (un participant peut n'avoir aucun profil).
 *
 * @property {string} type
 *   [obligatoire] Type de profil.
 *   Valeurs : TYPES_PROFIL_PARTICIPANT.PERSONNAGE | .UTILISATEUR | .NARRATEUR
 *             | .SYSTEME | .PERSONNALISE
 *   Voir constants/TypesProfilParticipant.js.
 *
 * @property {Object} donnees
 *   [obligatoire] Données propres au profil (ex. fiches d'un personnage).
 *   Structure libre, dépendante du type de profil. Peut être un objet vide.
 */

/**
 * @typedef {object} Participant
 *
 * Entité technique prenant part à une interaction.
 *
 * @property {string} id
 *   [obligatoire] Identifiant unique et stable du participant dans l'interaction.
 *
 * @property {string} type
 *   [obligatoire] Nature technique du participant.
 *   Valeurs : TYPES_PARTICIPANT.AGENT_AUTONOME | .EMETTEUR_EXTERNE | .NARRATEUR | .SYSTEME
 *   Voir constants/TypesParticipant.js.
 *
 * @property {ProfilParticipant|null} profil
 *   [obligatoire] Profil narratif du participant, ou null s'il n'incarne rien.
 *
 * @property {CapacitesParticipant} capacites
 *   [obligatoire] Capacités techniques du participant.
 *
 * @property {string} statut
 *   [obligatoire] Degré de participation courant.
 *   Valeurs : STATUTS_PARTICIPANT.ACTIF | .PASSIF | .INACTIF
 *   Voir constants/StatutsParticipant.js.
 *
 * @property {Object} metadata
 *   [obligatoire] Métadonnées libres. Peut être un objet vide.
 */
