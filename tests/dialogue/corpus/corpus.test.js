import {
  CODES_ERREUR_ETAT_DIALOGUE,
  validerEtatDialogueContextuel,
} from '../../../core/dialogue/index.js'
import {
  historiqueIncoherent,
  historiqueVide,
  scenariosDialogue,
} from './scenarios.js'

const scenariosValides = scenariosDialogue.filter(scenario => scenario.valide)

describe('RFC-021 - corpus métier de validation', () => {
  test('contient les huit scénarios de référence', () => {
    expect(scenariosDialogue).toHaveLength(8)
  })

  test.each(scenariosValides)('$nom produit un EtatDialogue attendu valide', scenario => {
    expect(
      validerEtatDialogueContextuel(scenario.etatAttendu, scenario.historique),
    ).toBe(scenario.etatAttendu)
  })

  test('documente et rejette l historique vide', () => {
    expect(historiqueVide.raisonInvalidite).toContain('aucun EtatDialogue valide')
    expect(() => validerEtatDialogueContextuel(
      historiqueVide.etatAttendu,
      historiqueVide.historique,
    )).toThrow(expect.objectContaining({
      code: CODES_ERREUR_ETAT_DIALOGUE.SOURCE_ABSENTE,
    }))
  })

  test('documente et rejette la référence historique absente', () => {
    expect(historiqueIncoherent.raisonInvalidite).toContain('aucun événement')
    expect(() => validerEtatDialogueContextuel(
      historiqueIncoherent.etatAttendu,
      historiqueIncoherent.historique,
    )).toThrow(expect.objectContaining({
      code: CODES_ERREUR_ETAT_DIALOGUE.EVENEMENT_SOURCE_INTROUVABLE,
    }))
  })
})
