/**
 * types/participantsV2.test.js
 *
 * Vérifie uniquement que les nouveaux fichiers de contrats (Gabida V2 — Phase 1)
 * sont importables sans erreur. Ce sont des contrats JSDoc purs : ils n'exposent
 * aucun export runtime, l'import ne doit donc rien casser.
 *
 * Aucun test métier : aucune logique multi-participants n'est implémentée.
 */

describe('types V2 — importabilité des contrats multi-participants', () => {
  const fichiers = [
    './Participant.js',
    './EvenementInteraction.js',
    './Sollicitation.js',
    './RelationParticipant.js',
    './ActionParticipant.js',
    './TraceInteraction.js',
    './EtatInteraction.js',
    './ResultatInteraction.js',
    './index.js',
  ]

  test.each(fichiers)('%s est importable sans erreur', async (chemin) => {
    await expect(import(chemin)).resolves.toBeDefined()
  })
})
