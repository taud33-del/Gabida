/**
 * types/Sauvegarde.js
 *
 * Produit par  : sauvegarde/
 * Consomme par : sauvegarde/, core/, application hote
 *
 * Aucune logique. Aucune dependance. Aucune connaissance des modules.
 *
 * Ces types decrivent les contrats de persistance du moteur.
 * Ils sont distincts de Etat — Etat est le type metier transversal,
 * les types ici sont propres au domaine sauvegarde.
 */

/**
 * @typedef {object} MetaSauvegarde
 *
 * Enveloppe de versionnage ajoutee a chaque sauvegarde.
 * Separee de Etat pour ne jamais polluer le type metier.
 * Toujours ecrite en premiere position dans EtatSauvegarde.
 *
 * Distinction fondamentale entre les deux versions :
 *
 * formatVersion (source de verite pour les migrations)
 *   Version de la STRUCTURE du fichier sauvegarde (EtatSauvegarde).
 *   C'est cette valeur que le pipeline de chargement lit pour savoir
 *   si une migration est necessaire.
 *   Independante de la version du moteur.
 *
 * engineVersion (tracabilite uniquement)
 *   Version du moteur Gabida ayant produit cette sauvegarde.
 *   Conservee pour l'audit et la retrotraçabilite.
 *   Ne declenche jamais de migration — uniquement informative.
 *   Utile pour diagnostiquer une sauvegarde sans ouvrir l'etat complet.
 *
 * @property {string} formatVersion
 *   [obligatoire] Version du format de sauvegarde. Valeur de FORMAT_VERSION.
 *   Seule version utilisee par le pipeline de migration.
 *   Incrementee uniquement lors d'un changement de structure du fichier persiste.
 *
 * @property {string} engineVersion
 *   [obligatoire] Version du moteur Gabida au moment de la sauvegarde.
 *   Valeur de ENGINE_VERSION. Conservee pour l'audit uniquement.
 *   Ne declenche jamais de migration.
 *
 * @property {number} savedAt
 *   [obligatoire] Horodatage Unix (ms) de l'ecriture.
 *
 * @property {string} sessionId
 *   [obligatoire] Copie de Etat.sessionId.
 *   Cle de recherche rapide sans deserialiser Etat.
 */

/**
 * @typedef {object} EtatSauvegarde
 *
 * Structure complete persistee sur le support de stockage.
 * Produit par serialiserEtat, consomme par deserialiserEtat.
 * Jamais modifie directement — uniquement produit et lu par sauvegarde/.
 *
 * @property {MetaSauvegarde} meta
 *   [obligatoire] Enveloppe de versionnage. Toujours en premiere position.
 *
 * @property {import('./Etat.js').Etat} etat
 *   [obligatoire] Etat complet de la session au moment de la sauvegarde.
 *   Copie exacte de ce que core/ a produit. Jamais modifie.
 */

/**
 * @typedef {object} SessionResume
 *
 * Resume leger d'une session disponible dans le registre.
 * Retourne par listSessions — ne charge pas l'etat complet.
 * Toutes les proprietes sont obligatoires.
 *
 * @property {string} sessionId       -- Identifiant unique de la session.
 * @property {number} tourCourant     -- Numero du dernier tour sauvegarde.
 * @property {number} savedAt         -- Horodatage de la derniere sauvegarde.
 * @property {string} formatVersion   -- Version du format de sauvegarde (pour migrations).
 * @property {string} engineVersion   -- Version du moteur (tracabilite uniquement).
 */

/**
 * @typedef {object} ResultatSauvegarde
 *
 * Resultat retourne par saveState en cas de succes.
 * Toutes les proprietes sont obligatoires.
 *
 * @property {true}   success    -- Toujours true (une erreur levee sinon).
 * @property {string} sessionId  -- Identifiant de la session sauvegardee.
 * @property {number} timestamp  -- Horodatage de l'operation.
 * @property {string} formatVersion  -- Version du format utilise.
 */

/**
 * @typedef {object} ResultatChargement
 *
 * Resultat retourne par loadState en cas de succes.
 * Toutes les proprietes sont obligatoires.
 *
 * @property {true}   success    -- Toujours true (une erreur levee sinon).
 * @property {string} sessionId  -- Identifiant de la session chargee.
 * @property {import('./Etat.js').Etat} etat -- Etat complet restaure.
 * @property {MetaSauvegarde} meta -- Enveloppe lue depuis le support.
 */

/**
 * @typedef {object} ResultatSuppression
 *
 * Resultat retourne par deleteState en cas de succes.
 * Toutes les proprietes sont obligatoires.
 *
 * @property {true}   success    -- Toujours true (une erreur levee sinon).
 * @property {string} sessionId  -- Identifiant de la session supprimee.
 * @property {number} timestamp  -- Horodatage de l'operation.
 */

/**
 * @typedef {object} StorageAdapter
 *
 * Interface que tout adaptateur de stockage doit implementer.
 * Toutes les methodes sont async.
 * Aucune logique metier autorisee dans un adaptateur.
 *
 * @property {(sessionId: string, donnees: string) => Promise<void>} save
 *   Ecrit les donnees serialisees sous la cle sessionId.
 *   Ecrase silencieusement si la cle existe deja.
 *
 * @property {(sessionId: string) => Promise<string|null>} load
 *   Retourne la chaine serialisee ou null si la session est absente.
 *
 * @property {(sessionId: string) => Promise<void>} delete
 *   Supprime la cle. Ne leve pas d'erreur si absente.
 *
 * @property {() => Promise<SessionResume[]>} list
 *   Retourne la liste des sessions disponibles (metadonnees uniquement).
 */
