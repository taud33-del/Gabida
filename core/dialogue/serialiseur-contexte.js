class ErreurSerialiseurContexteDialogue extends TypeError {
  constructor(message) {
    super(message)
    this.name = 'ErreurSerialiseurContexteDialogue'
  }
}

export function serialiserContexteDialogue(contexte) {
  if (contexte === null || contexte === undefined) {
    throw new ErreurSerialiseurContexteDialogue('serialiseur contexte dialogue : contexte est absent.')
  }
  if (typeof contexte !== 'object' || Array.isArray(contexte)) {
    throw new ErreurSerialiseurContexteDialogue('serialiseur contexte dialogue : contexte doit etre un objet.')
  }
  if (!Array.isArray(contexte.evenements)) {
    throw new ErreurSerialiseurContexteDialogue('serialiseur contexte dialogue : contexte.evenements doit etre un tableau.')
  }
  const evenements = Object.freeze([...contexte.evenements])
  return Object.freeze({ evenements })
}
