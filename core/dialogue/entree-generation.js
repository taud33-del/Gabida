class ErreurEntreeGeneration extends TypeError {
  constructor(message) {
    super(message)
    this.name = 'ErreurEntreeGeneration'
  }
}

export function creerEntreeGeneration(contenu) {
  if (contenu === null || contenu === undefined) {
    throw new ErreurEntreeGeneration('entree generation : contenu est absent.')
  }
  if (typeof contenu !== 'string') {
    throw new ErreurEntreeGeneration('entree generation : contenu doit etre une chaine.')
  }
  if (contenu.trim() === '') {
    throw new ErreurEntreeGeneration('entree generation : contenu ne doit pas etre vide.')
  }
  return Object.freeze({ contenu })
}
