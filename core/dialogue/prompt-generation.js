class ErreurPromptGeneration extends TypeError {
  constructor(message) {
    super(message)
    this.name = 'ErreurPromptGeneration'
  }
}

export function creerPromptGeneration(contenu) {
  if (contenu === null || contenu === undefined) {
    throw new ErreurPromptGeneration('prompt generation : contenu est absent.')
  }
  if (typeof contenu !== 'string') {
    throw new ErreurPromptGeneration('prompt generation : contenu doit etre une chaine.')
  }
  if (contenu.trim() === '') {
    throw new ErreurPromptGeneration('prompt generation : contenu ne doit pas etre vide.')
  }
  return Object.freeze({ contenu })
}
