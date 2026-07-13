/**
 * bin/gabida.test.js
 *
 * Vérifie la mise en forme du dialogue du harnais.
 *   - le locuteur est le nom fourni (issu de la fiche personnage), jamais codé en dur ;
 *   - le format correspond exactement à « Player : / <nom> : ».
 *
 * L'import du harnais ne déclenche pas main() (garde d'exécution directe).
 */

import { formaterDialogue } from './gabida.js'

describe('formaterDialogue', () => {
  test('met en forme l échange Player / personnage', () => {
    const sortie = formaterDialogue(
      'Léa Martin',
      'Bonjour.',
      'Elle incline la tete.',
      'Réponse de test.'
    )
    expect(sortie).toBe(
      'Player :\nBonjour.\n\nLéa Martin :\nElle incline la tete.\nRéponse de test.'
    )
  })

  test('utilise le nom fourni comme locuteur (aucun nom en dur)', () => {
    const sortie = formaterDialogue('Autre Personnage', 'Salut', '', 'ok')
    expect(sortie).toContain('Autre Personnage :')
    expect(sortie).not.toContain('Léa')
    expect(sortie).not.toContain('Gabida :')
  })
})
