import { ErreurValidation } from '../index.js'

export class ErreurValidationEtatDialogue extends ErreurValidation {
  constructor(code, message, chemin = null) {
    super(message)
    this.name = 'ErreurValidationEtatDialogue'
    this.code = code
    this.chemin = chemin
  }
}
