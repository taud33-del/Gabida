export function reconstruireEtatDialogue(resultatGeneration) {
  const contenu = resultatGeneration.contenu
  try {
    return JSON.parse(contenu)
  } catch (cause) {
    const erreur = new SyntaxError('reconstruction EtatDialogue : contenu JSON invalide.')
    erreur.cause = cause
    throw erreur
  }
}
