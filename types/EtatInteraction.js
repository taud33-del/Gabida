/**
 * types/EtatInteraction.js
 *
 * Contrat de données de l'état d'une interaction multi-participants (Gabida V2 —
 * Phase 1).
 *
 * L'état distingue explicitement quatre plans :
 *   - état PARTAGÉ    : état canonique/objectif de l'interaction, indépendant de
 *                       ce que chaque participant perçoit, sait ou croit ;
 *   - états PRIVÉS    : propres à chaque participant, indexés par participantId ;
 *   - mémoires        : mémoire propre à chaque participant, indexée par participantId ;
 *   - relations       : liens directionnels entre participants.
 * L'historique conserve la suite ordonnée des événements d'interaction.
 *
 * Aucune logique. Aucune dépendance. Aucune connaissance des modules.
 *
 * NOTE : ce type est distinct de types/Etat.js (V1, mono-personnage). Aucun type
 * existant n'est modifié ni remplacé.
 */

/**
 * @typedef {object} EtatInteraction
 *
 * @property {Object.<string, import('./Participant.js').Participant>} participants
 *   [obligatoire] Participants de l'interaction, indexés par leur id.
 *
 * @property {Object} etatPartage
 *   [obligatoire] État canonique/objectif de l'interaction, indépendant de ce
 *   que chaque participant perçoit, sait ou croit. Peut être un objet vide.
 *
 * @property {Object.<string, Object>} etatsPrives
 *   [obligatoire] États privés indexés par participantId. Peut être un objet vide.
 *
 * @property {Object.<string, Object>} memoires
 *   [obligatoire] Mémoires indexées par participantId. Peut être un objet vide.
 *
 * @property {Object.<string, import('./RelationParticipant.js').RelationParticipant>} relations
 *   [obligatoire] Relations entre participants, indexées par une clé stable. Peut être vide.
 *
 * @property {import('./EvenementInteraction.js').EvenementInteraction[]} historique
 *   [obligatoire] Historique ordonné des événements d'interaction. Peut être vide.
 *
 * @property {Object} metadata
 *   [obligatoire] Métadonnées libres. Peut être un objet vide.
 */
