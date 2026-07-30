class ErreurProducteurDialogue extends TypeError {
  constructor(message) {
    super(message)
    this.name = 'ErreurProducteurDialogue'
  }
}

export function creerProducteurDialogue(options) {
  if (options === null || options === undefined) {
    throw new ErreurProducteurDialogue('producteur dialogue : options est absent.')
  }
  if (typeof options !== 'object' || Array.isArray(options)) {
    throw new ErreurProducteurDialogue('producteur dialogue : options doit etre un objet.')
  }
  if (typeof options.serialiserContexteDialogue !== 'function') {
    throw new ErreurProducteurDialogue('producteur dialogue : serialiserContexteDialogue doit etre une fonction.')
  }
  if (typeof options.construireSpecificationPromptDialogue !== 'function') {
    throw new ErreurProducteurDialogue('producteur dialogue : construireSpecificationPromptDialogue doit etre une fonction.')
  }
  if (typeof options.construirePromptGeneration !== 'function') {
    throw new ErreurProducteurDialogue('producteur dialogue : construirePromptGeneration doit etre une fonction.')
  }
  if (typeof options.construireEntreeGeneration !== 'function') {
    throw new ErreurProducteurDialogue('producteur dialogue : construireEntreeGeneration doit etre une fonction.')
  }
  if (
    options.clientGeneration === null ||
    typeof options.clientGeneration !== 'object' ||
    Array.isArray(options.clientGeneration)
  ) {
    throw new ErreurProducteurDialogue('producteur dialogue : clientGeneration doit etre un objet.')
  }
  if (typeof options.clientGeneration.generer !== 'function') {
    throw new ErreurProducteurDialogue('producteur dialogue : clientGeneration.generer doit etre une fonction.')
  }
  const serialiserContexteDialogue = options.serialiserContexteDialogue
  const construireSpecificationPromptDialogue = options.construireSpecificationPromptDialogue
  const construirePromptGeneration = options.construirePromptGeneration
  const construireEntreeGeneration = options.construireEntreeGeneration
  const clientGeneration = options.clientGeneration
  return Object.freeze({
    produire(contexte) {
      const representation = serialiserContexteDialogue(contexte)
      const specification = construireSpecificationPromptDialogue(representation)
      const prompt = construirePromptGeneration(specification)
      const entree = construireEntreeGeneration(prompt)
      return clientGeneration.generer(entree)
    },
  })
}
