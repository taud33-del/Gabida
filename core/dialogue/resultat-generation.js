class ErreurResultatGeneration extends TypeError {
  constructor(message) {
    super(message)
    this.name = 'ErreurResultatGeneration'
  }
}

export function creerResultatGeneration(contenu) {
  if (contenu === null || contenu === undefined) {
    throw new ErreurResultatGeneration('resultat generation : contenu est absent.')
  }
  if (typeof contenu !== 'string') {
    throw new ErreurResultatGeneration('resultat generation : contenu doit etre une chaine.')
  }
  if (contenu.trim() === '') {
    throw new ErreurResultatGeneration('resultat generation : contenu ne doit pas etre vide.')
  }
  return Object.freeze({ contenu })
}
