/**
 * conversation/conversation.test.js
 *
 * Tests unitaires du module conversation (historique court terme).
 *
 * Couverture :
 *   - historique vide/absent → [user, assistant]
 *   - historique non vide    → append en fin, ordre strict conserve
 *   - immutabilite de l'historique d'entree (write-as-copy)
 *   - conservation exacte des contenus (aucune reecriture, chaine vide preservee)
 *   - determinisme (meme entree → meme sortie)
 *   - erreurs typees + chaine d'heritage
 */

import { ajouterEchange } from './index.js'
import {
  ConversationError,
  InvalidHistoriqueError,
  InvalidMessageError,
} from './ConversationError.js'
import { ROLES_MESSAGE } from '../constants/RolesMessage.js'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const playerMessage = { texte: 'Bonjour Aldric.' }
const reponseIA      = { texte: 'Bonjour, voyageur.' }

// ─── Comportement de base ──────────────────────────────────────────────────────

describe('ajouterEchange — historique vide', () => {
  test('depuis [] retourne exactement [user, assistant]', () => {
    const resultat = ajouterEchange([], playerMessage, reponseIA)
    expect(resultat).toEqual([
      { role: ROLES_MESSAGE.USER,      contenu: 'Bonjour Aldric.' },
      { role: ROLES_MESSAGE.ASSISTANT, contenu: 'Bonjour, voyageur.' },
    ])
  })

  test('historique undefined traite comme vide', () => {
    expect(ajouterEchange(undefined, playerMessage, reponseIA)).toHaveLength(2)
  })

  test('historique null traite comme vide', () => {
    expect(ajouterEchange(null, playerMessage, reponseIA)).toHaveLength(2)
  })
})

describe('ajouterEchange — historique non vide', () => {
  const historique = [
    { role: ROLES_MESSAGE.USER,      contenu: 'Premier message.' },
    { role: ROLES_MESSAGE.ASSISTANT, contenu: 'Premiere reponse.' },
  ]

  test('ajoute l echange a la fin en conservant l ordre', () => {
    const resultat = ajouterEchange(historique, playerMessage, reponseIA)
    expect(resultat).toEqual([
      { role: ROLES_MESSAGE.USER,      contenu: 'Premier message.' },
      { role: ROLES_MESSAGE.ASSISTANT, contenu: 'Premiere reponse.' },
      { role: ROLES_MESSAGE.USER,      contenu: 'Bonjour Aldric.' },
      { role: ROLES_MESSAGE.ASSISTANT, contenu: 'Bonjour, voyageur.' },
    ])
  })

  test('user precede toujours assistant dans le nouvel echange', () => {
    const resultat = ajouterEchange(historique, playerMessage, reponseIA)
    expect(resultat[resultat.length - 2].role).toBe(ROLES_MESSAGE.USER)
    expect(resultat[resultat.length - 1].role).toBe(ROLES_MESSAGE.ASSISTANT)
  })

  test('ne mute jamais l historique recu (write-as-copy)', () => {
    const entree = [...historique]
    const resultat = ajouterEchange(entree, playerMessage, reponseIA)
    expect(entree).toHaveLength(2)
    expect(resultat).not.toBe(entree)
  })

  test('ne modifie aucun message existant', () => {
    const resultat = ajouterEchange(historique, playerMessage, reponseIA)
    expect(resultat[0]).toEqual(historique[0])
    expect(resultat[1]).toEqual(historique[1])
  })
})

// ─── Conservation du contenu ────────────────────────────────────────────────────

describe('ajouterEchange — conservation exacte du contenu', () => {
  test('conserve une chaine vide telle quelle (aucune interpretation)', () => {
    const resultat = ajouterEchange([], { texte: '' }, reponseIA)
    expect(resultat[0]).toEqual({ role: ROLES_MESSAGE.USER, contenu: '' })
  })

  test('ne resume ni ne tronque un contenu long', () => {
    const long = 'x'.repeat(5000)
    const resultat = ajouterEchange([], { texte: long }, { texte: long })
    expect(resultat[0].contenu).toBe(long)
    expect(resultat[1].contenu).toBe(long)
  })
})

// ─── Determinisme ──────────────────────────────────────────────────────────────

describe('ajouterEchange — determinisme', () => {
  test('meme entree → meme sortie', () => {
    const a = ajouterEchange([], playerMessage, reponseIA)
    const b = ajouterEchange([], playerMessage, reponseIA)
    expect(a).toEqual(b)
  })
})

// ─── Erreurs typees ──────────────────────────────────────────────────────────────

describe('ajouterEchange — erreurs typees', () => {
  test('InvalidHistoriqueError si historique n est pas un tableau', () => {
    expect(() => ajouterEchange('pas un tableau', playerMessage, reponseIA))
      .toThrow(InvalidHistoriqueError)
  })

  test('InvalidMessageError si playerMessage absent', () => {
    expect(() => ajouterEchange([], undefined, reponseIA)).toThrow(InvalidMessageError)
  })

  test('InvalidMessageError si reponseIA absente', () => {
    expect(() => ajouterEchange([], playerMessage, undefined)).toThrow(InvalidMessageError)
  })

  test('InvalidMessageError si playerMessage.texte n est pas une string', () => {
    expect(() => ajouterEchange([], { texte: 42 }, reponseIA)).toThrow(InvalidMessageError)
  })

  test('les erreurs specialisees heritent de ConversationError', () => {
    expect(new InvalidHistoriqueError('x')).toBeInstanceOf(ConversationError)
    expect(new InvalidMessageError('x')).toBeInstanceOf(ConversationError)
    expect(new ConversationError('x')).toBeInstanceOf(Error)
  })
})
