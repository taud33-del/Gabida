class ErreurConstructeurContexteDialogue extends TypeError {
  constructor(message) {
    super(message)
    this.name = 'ErreurConstructeurContexteDialogue'
  }
}

export function construireContexteDialogue(historique) {
  if (historique === null || historique === undefined) {
    throw new ErreurConstructeurContexteDialogue('constructeur contexte dialogue : historique est absent.')
  }
  if (!Array.isArray(historique)) {
    throw new ErreurConstructeurContexteDialogue('constructeur contexte dialogue : historique doit etre un tableau.')
  }
  const evenements = Object.freeze([...historique])
  return Object.freeze({ evenements })
}
