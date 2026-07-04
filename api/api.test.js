/**
 * api/api.test.js
 *
 * Tests unitaires du module api/.
 *
 * Couverture :
 *   - preparerMessages        : construction du tableau de messages internes
 *   - preparerParametres      : normalisation des parametres d'execution
 *   - normaliserReponse       : construction du ReponseIA depuis ReponseRaw
 *   - registerProvider        : enregistrement et validation d'un adaptateur
 *   - callProvider            : integration complete avec adaptateur mock
 *   - callProvider erreurs    : provider non enregistre
 *   - getProviders            : liste des providers enregistres
 */

import {
  preparerMessages,
  preparerParametres,
  normaliserReponse,
  registerProvider,
  callProvider,
  getProviders,
} from './index.js'

import { PROVIDERS }             from '../constants/Providers.js'
import { ROLES_MESSAGE_INTERNE } from '../constants/RolesMessageInterne.js'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const promptVide = {
  systeme     : 'Tu es Aldric, garde royal taciturne.',
  historique  : [],
  instruction : 'Le joueur te demande ton nom. Reponds en restant dans ton personnage.',
}

const promptAvecHistorique = {
  systeme : 'Tu es Aldric.',
  historique : [
    { role: 'user',      contenu: 'Bonjour.' },
    { role: 'assistant', contenu: 'Hmm.' },
  ],
  instruction : 'Le joueur dit : "Tu es vraiment peu bavard."',
}

const configMock = {
  provider : PROVIDERS.LOCAL,
  cleApi   : 'test-cle',
  modele   : 'test-modele',
}

const reponseRawMock = {
  texte         : 'Je suis Aldric.',
  tokensEntree  : 42,
  tokensSortie  : 8,
}

function construireCtxMock(prompt = promptVide, config = configMock) {
  return Object.freeze({
    prompt,
    config,
    nomProvider  : config.provider,
    adaptateur   : async () => reponseRawMock,
    debutMs      : Date.now() - 100,
    systeme      : prompt.systeme,
    historique   : prompt.historique,
    instruction  : prompt.instruction,
  })
}

// ─── preparerMessages ────────────────────────────────────────────────────────

describe('preparerMessages', () => {
  test('produit [system, user] pour un historique vide', () => {
    const ctx = construireCtxMock(promptVide)
    const messages = preparerMessages(ctx)

    expect(messages).toHaveLength(2)
    expect(messages[0].role).toBe(ROLES_MESSAGE_INTERNE.SYSTEM)
    expect(messages[0].contenu).toBe(promptVide.systeme)
    expect(messages[messages.length - 1].role).toBe(ROLES_MESSAGE_INTERNE.USER)
    expect(messages[messages.length - 1].contenu).toBe(promptVide.instruction)
  })

  test('intercale l historique entre system et user', () => {
    const ctx = construireCtxMock(promptAvecHistorique)
    const messages = preparerMessages(ctx)

    expect(messages).toHaveLength(4)
    expect(messages[0].role).toBe(ROLES_MESSAGE_INTERNE.SYSTEM)
    expect(messages[1].contenu).toBe('Bonjour.')
    expect(messages[2].contenu).toBe('Hmm.')
    expect(messages[3].role).toBe(ROLES_MESSAGE_INTERNE.USER)
  })

  test('le systeme est toujours le premier message', () => {
    const ctx = construireCtxMock(promptAvecHistorique)
    const messages = preparerMessages(ctx)
    expect(messages[0].role).toBe(ROLES_MESSAGE_INTERNE.SYSTEM)
  })

  test('l instruction est toujours le dernier message', () => {
    const ctx = construireCtxMock(promptAvecHistorique)
    const messages = preparerMessages(ctx)
    const dernier = messages[messages.length - 1]
    expect(dernier.role).toBe(ROLES_MESSAGE_INTERNE.USER)
    expect(dernier.contenu).toBe(promptAvecHistorique.instruction)
  })

  test('ne modifie pas ctx', () => {
    const ctx = construireCtxMock(promptVide)
    preparerMessages(ctx)
    expect(ctx.historique).toHaveLength(0)
  })
})

// ─── preparerParametres ──────────────────────────────────────────────────────

describe('preparerParametres', () => {
  test('repend le modele depuis config', () => {
    const ctx = construireCtxMock()
    const params = preparerParametres(ctx)
    expect(params.modele).toBe(configMock.modele)
  })

  test('applique timeout par defaut si absent', () => {
    const configSansTimeout = { ...configMock, timeout: undefined }
    const ctx = construireCtxMock(promptVide, configSansTimeout)
    const params = preparerParametres(ctx)
    expect(params.timeout).toBe(30000)
  })

  test('conserve le timeout si fourni', () => {
    const configAvecTimeout = { ...configMock, timeout: 5000 }
    const ctx = construireCtxMock(promptVide, configAvecTimeout)
    const params = preparerParametres(ctx)
    expect(params.timeout).toBe(5000)
  })

  test('applique options vide par defaut si absent', () => {
    const ctx = construireCtxMock()
    const params = preparerParametres(ctx)
    expect(params.options).toEqual({})
  })

  test('conserve les options si fournies', () => {
    const configAvecOptions = { ...configMock, options: { stream: true } }
    const ctx = construireCtxMock(promptVide, configAvecOptions)
    const params = preparerParametres(ctx)
    expect(params.options).toEqual({ stream: true })
  })
})

// ─── normaliserReponse ───────────────────────────────────────────────────────

describe('normaliserReponse', () => {
  test('produit un ReponseIA valide', () => {
    const ctx = construireCtxMock()
    const reponse = normaliserReponse(ctx, reponseRawMock)

    expect(reponse.texte).toBe(reponseRawMock.texte)
    expect(reponse.meta.provider).toBe(configMock.provider)
    expect(reponse.meta.tokensEntree).toBe(reponseRawMock.tokensEntree)
    expect(reponse.meta.tokensSortie).toBe(reponseRawMock.tokensSortie)
    expect(typeof reponse.meta.dureeMs).toBe('number')
    expect(reponse.meta.dureeMs).toBeGreaterThanOrEqual(0)
  })

  test('calcule dureeMs depuis ctx.debutMs', () => {
    const ctx = construireCtxMock()
    const reponse = normaliserReponse(ctx, reponseRawMock)
    expect(reponse.meta.dureeMs).toBeGreaterThan(0)
  })

  test('transmet le nom du provider depuis ctx', () => {
    const ctx = construireCtxMock()
    const reponse = normaliserReponse(ctx, reponseRawMock)
    expect(reponse.meta.provider).toBe(PROVIDERS.LOCAL)
  })
})

// ─── registerProvider ─────────────────────────────────────────────────────────

describe('registerProvider', () => {
  test('enregistre un adaptateur sans erreur', () => {
    expect(() => {
      registerProvider('test-provider-valide', async () => reponseRawMock)
    }).not.toThrow()
  })

  test('leve une erreur si l adaptateur n est pas une fonction', () => {
    expect(() => {
      registerProvider('mauvais', 'pas-une-fonction')
    }).toThrow('doit etre une fonction')
  })

  test('ecrase silencieusement un provider existant', () => {
    const adaptateur1 = async () => ({ texte: 'v1', tokensEntree: 1, tokensSortie: 1 })
    const adaptateur2 = async () => ({ texte: 'v2', tokensEntree: 2, tokensSortie: 2 })
    registerProvider('overwrite-test', adaptateur1)
    registerProvider('overwrite-test', adaptateur2)
    expect(getProviders()).toContain('overwrite-test')
  })
})

// ─── getProviders ─────────────────────────────────────────────────────────────

describe('getProviders', () => {
  test('retourne un tableau', () => {
    expect(Array.isArray(getProviders())).toBe(true)
  })

  test('contient les providers enregistres', () => {
    registerProvider('provider-liste-test', async () => reponseRawMock)
    expect(getProviders()).toContain('provider-liste-test')
  })
})

// ─── callProvider — integration ──────────────────────────────────────────────

describe('callProvider', () => {
  const NOM_PROVIDER_TEST = 'provider-integration-test'

  beforeAll(() => {
    registerProvider(NOM_PROVIDER_TEST, async () => reponseRawMock)
  })

  test('retourne un ReponseIA complet', async () => {
    const config  = { ...configMock, provider: NOM_PROVIDER_TEST }
    const reponse = await callProvider(promptVide, config)

    expect(reponse.texte).toBe(reponseRawMock.texte)
    expect(reponse.meta.provider).toBe(NOM_PROVIDER_TEST)
    expect(typeof reponse.meta.dureeMs).toBe('number')
    expect(reponse.meta.tokensEntree).toBe(reponseRawMock.tokensEntree)
    expect(reponse.meta.tokensSortie).toBe(reponseRawMock.tokensSortie)
  })

  test('ne modifie pas le prompt recu', async () => {
    const config       = { ...configMock, provider: NOM_PROVIDER_TEST }
    const promptAvant  = { ...promptVide }
    await callProvider(promptVide, config)
    expect(promptVide).toEqual(promptAvant)
  })

  test('leve une erreur explicite si le provider n est pas enregistre', async () => {
    const config = { ...configMock, provider: 'provider-inexistant' }
    await expect(callProvider(promptVide, config)).rejects.toThrow(
      'provider "provider-inexistant" non enregistre'
    )
  })

  test('transmet l instruction comme dernier message user a l adaptateur', async () => {
    let messagesCaptures = []
    registerProvider('capture-test', async (messages) => {
      messagesCaptures = messages
      return reponseRawMock
    })

    const config = { ...configMock, provider: 'capture-test' }
    await callProvider(promptVide, config)

    const dernier = messagesCaptures[messagesCaptures.length - 1]
    expect(dernier.role).toBe(ROLES_MESSAGE_INTERNE.USER)
    expect(dernier.contenu).toBe(promptVide.instruction)
  })

  test('transmet le systeme comme premier message a l adaptateur', async () => {
    let messagesCaptures = []
    registerProvider('capture-system-test', async (messages) => {
      messagesCaptures = messages
      return reponseRawMock
    })

    const config = { ...configMock, provider: 'capture-system-test' }
    await callProvider(promptVide, config)

    expect(messagesCaptures[0].role).toBe(ROLES_MESSAGE_INTERNE.SYSTEM)
    expect(messagesCaptures[0].contenu).toBe(promptVide.systeme)
  })

  test('propage l erreur de l adaptateur sans la modifier', async () => {
    registerProvider('adaptateur-en-erreur', async () => {
      throw new Error('Erreur reseau simulee')
    })

    const config = { ...configMock, provider: 'adaptateur-en-erreur' }
    await expect(callProvider(promptVide, config)).rejects.toThrow('Erreur reseau simulee')
  })
})
