import { validerEtatDialogueContextuel } from './validation-contextuelle.js'

class ErreurGestionnaireEtatDialogue extends TypeError {
  constructor(message) {
    super(message)
    this.name = 'ErreurGestionnaireEtatDialogue'
  }
}

function validerOptions(options) {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new ErreurGestionnaireEtatDialogue('gestionnaire dialogue : options doit etre un objet.')
  }
  if (typeof options.construireContexteDialogue !== 'function') {
    throw new ErreurGestionnaireEtatDialogue('gestionnaire dialogue : construireContexteDialogue doit etre une fonction.')
  }
  if (typeof options.serialiserContexteDialogue !== 'function') {
    throw new ErreurGestionnaireEtatDialogue('gestionnaire dialogue : serialiserContexteDialogue doit etre une fonction.')
  }
  if (typeof options.construireSpecificationPromptDialogue !== 'function') {
    throw new ErreurGestionnaireEtatDialogue(
      'gestionnaire dialogue : construireSpecificationPromptDialogue doit etre une fonction.',
    )
  }
  if (typeof options.construirePromptGeneration !== 'function') {
    throw new ErreurGestionnaireEtatDialogue('gestionnaire dialogue : construirePromptGeneration doit etre une fonction.')
  }
  if (typeof options.construireEntreeGeneration !== 'function') {
    throw new ErreurGestionnaireEtatDialogue('gestionnaire dialogue : construireEntreeGeneration doit etre une fonction.')
  }
  if (
    options.clientGeneration === null
    || typeof options.clientGeneration !== 'object'
    || Array.isArray(options.clientGeneration)
    || typeof options.clientGeneration.generer !== 'function'
  ) {
    throw new ErreurGestionnaireEtatDialogue(
      'gestionnaire dialogue : clientGeneration.generer doit etre une fonction.',
    )
  }
  if (typeof options.reconstruireEtatDialogue !== 'function') {
    throw new ErreurGestionnaireEtatDialogue('gestionnaire dialogue : reconstruireEtatDialogue doit etre une fonction.')
  }
}

export function creerGestionnaireEtatDialogue(options) {
  validerOptions(options)
  const {
    construireContexteDialogue,
    serialiserContexteDialogue,
    construireSpecificationPromptDialogue,
    construirePromptGeneration,
    construireEntreeGeneration,
    clientGeneration,
    reconstruireEtatDialogue: reconstruireResultatGeneration,
  } = options

  async function reconstruireEtatDialogue(historique) {
    const contexte = construireContexteDialogue(historique)
    const representation = serialiserContexteDialogue(contexte)
    const specification = construireSpecificationPromptDialogue(representation)
    const prompt = construirePromptGeneration(specification)
    const entree = construireEntreeGeneration(prompt)
    const resultat = await clientGeneration.generer(entree)
    const etatDialogue = reconstruireResultatGeneration(resultat)
    validerEtatDialogueContextuel(etatDialogue, historique)
    return etatDialogue
  }

  return Object.freeze({ reconstruireEtatDialogue })
}
