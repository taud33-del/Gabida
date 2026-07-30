class ErreurClientGeneration extends TypeError {
  constructor(message) {
    super(message)
    this.name = 'ErreurClientGeneration'
  }
}

export function creerClientGeneration(options) {
  if (options === null || options === undefined) {
    throw new ErreurClientGeneration('client generation : options est absent.')
  }
  if (typeof options !== 'object' || Array.isArray(options)) {
    throw new ErreurClientGeneration('client generation : options doit etre un objet.')
  }
  if (typeof options.generer !== 'function') {
    throw new ErreurClientGeneration('client generation : generer doit etre une fonction.')
  }
  const generer = options.generer
  return Object.freeze({
    generer(entree) {
      return generer(entree)
    },
  })
}
