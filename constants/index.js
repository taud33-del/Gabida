/**
 * constants/index.js
 *
 * Constantes officielles de Gabida — point d'entrée unique.
 * Ce fichier ne définit rien : il réexporte tout.
 *
 * Le moteur ne compare jamais des chaînes libres.
 * Il manipule uniquement les constantes définies ici.
 *
 * Pour importer dans un module :
 *   import { INTENTIONS } from '../constants/index.js'          // ou
 *   import { INTENTIONS } from '../constants/Intentions.js'
 */

export * from './Versions.js'
export * from './Intentions.js'
export * from './MomentsNarratifs.js'
export * from './SourcesInfluence.js'
export * from './TonalitesFiltre.js'
export * from './OriginesRessenti.js'
export * from './Objectifs.js'
export * from './Attitudes.js'
export * from './DirectionsNarratives.js'
export * from './RolesMessage.js'
export * from './TypesSouvenir.js'
export * from './ImportancesMemoire.js'
export * from './Providers.js'
export * from './RolesMessageInterne.js'
export * from './RuntimeStates.js'
