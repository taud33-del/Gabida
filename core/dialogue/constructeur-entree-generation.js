import { creerEntreeGeneration } from './entree-generation.js'

export function construireEntreeGeneration(prompt) {
  return creerEntreeGeneration(prompt.contenu)
}
