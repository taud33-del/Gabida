import { creerResultatGeneration } from './resultat-generation.js'

class ErreurClientGenerationOpenAI extends TypeError {
  constructor(message) {
    super(message)
    this.name = 'ErreurClientGenerationOpenAI'
  }
}

function extraireTexte(reponse) {
  return reponse.output_text
}

export function creerClientGenerationOpenAI(options) {
  if (options === null || options === undefined) {
    throw new ErreurClientGenerationOpenAI('client generation OpenAI : options est absent.')
  }
  if (typeof options !== 'object' || Array.isArray(options)) {
    throw new ErreurClientGenerationOpenAI('client generation OpenAI : options doit etre un objet.')
  }
  if (
    options.client === null ||
    typeof options.client !== 'object' ||
    Array.isArray(options.client)
  ) {
    throw new ErreurClientGenerationOpenAI('client generation OpenAI : client doit etre un objet.')
  }
  if (
    options.client.responses === null ||
    typeof options.client.responses !== 'object' ||
    Array.isArray(options.client.responses)
  ) {
    throw new ErreurClientGenerationOpenAI('client generation OpenAI : client.responses doit etre un objet.')
  }
  if (typeof options.client.responses.create !== 'function') {
    throw new ErreurClientGenerationOpenAI('client generation OpenAI : client.responses.create doit etre une fonction.')
  }
  if (typeof options.modele !== 'string' || options.modele.trim() === '') {
    throw new ErreurClientGenerationOpenAI('client generation OpenAI : modele doit etre une chaine non vide.')
  }
  const client = options.client
  const modele = options.modele
  return Object.freeze({
    async generer(entree) {
      const reponse = await client.responses.create({
        model: modele,
        input: entree.contenu,
      })
      const texte = extraireTexte(reponse)
      return creerResultatGeneration(texte)
    },
  })
}
