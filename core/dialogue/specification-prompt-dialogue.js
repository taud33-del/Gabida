class ErreurSpecificationPromptDialogue extends TypeError {
  constructor(message) {
    super(message)
    this.name = 'ErreurSpecificationPromptDialogue'
  }
}

export function creerSpecificationPromptDialogue(sections) {
  if (sections === null || sections === undefined) {
    throw new ErreurSpecificationPromptDialogue('specification prompt dialogue : sections est absent.')
  }
  if (!Array.isArray(sections)) {
    throw new ErreurSpecificationPromptDialogue('specification prompt dialogue : sections doit etre un tableau.')
  }
  if (sections.length === 0) {
    throw new ErreurSpecificationPromptDialogue('specification prompt dialogue : sections ne doit pas etre vide.')
  }
  sections.forEach((section, position) => {
    if (typeof section !== 'string' || section.trim() === '') {
      throw new ErreurSpecificationPromptDialogue(
        `specification prompt dialogue : sections[${position}] doit etre une chaine non vide.`
      )
    }
  })
  return Object.freeze({
    sections: Object.freeze([...sections]),
  })
}
