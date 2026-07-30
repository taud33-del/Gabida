import { creerPromptGeneration } from './prompt-generation.js'

export function construirePromptGeneration(specification) {
  const contenu = specification.sections.join('\n\n')
  return creerPromptGeneration(contenu)
}
