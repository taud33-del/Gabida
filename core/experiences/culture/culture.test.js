import { jest } from '@jest/globals'
import { executeTurn } from '../../index.js'
import { ajouterEchange } from '../../../conversation/index.js'
import {
  addCultureUserMessage,
  CultureValidationError,
  buildCultureContext,
  createCultureEngine,
  evaluateCulturePlans,
  validateCultureConfiguration,
} from './index.js'

const configuration = (overrides = {}) => ({
  experience: 'culture', userLanguage: 'fr', message: 'Bonjour, je veux decouvrir la Suede.',
  participants: [
    { characterId: 'solene-han', role: 'speaker', language: 'sv' },
    { characterId: 'sonia-nadir', role: 'translator', language: 'sv' },
  ],
  ...overrides,
})

const availablePlan = (contribution = 'Apporter un exemple concret suedois.') => ({
  understood: 'L utilisateur veut decouvrir une culture.', contribution,
  intention: 'Ouvrir la discussion', relevance: 0.9, novelty: 0.9,
  complementarity: 0.8, roleCompliance: 1, personalityCompliance: 1,
  timing: 0.9, estimatedLength: 'short', shouldSpeak: true, reason: 'Utile maintenant.',
})

const characterLoader = jest.fn(async id => ({ id, name: id, permanentProfile: `profil ${id}` }))

function makeGenerator(plan = jest.fn(async ({ characterId }) => availablePlan(`Contribution distincte de ${characterId}.`))) {
  return {
    plan,
    respond: jest.fn(async ({ characterId }) => ({ text: characterId === 'solene-han' ? 'Hej! Vad vill du upptäcka först?' : 'Cela signifie : bonjour !' })),
  }
}

describe('experience culture - validation', () => {
  test('refuse plus de deux participants', () => {
    expect(() => validateCultureConfiguration(configuration({ participants: [...configuration().participants, { characterId: 'sven-moreau', role: 'speaker', language: 'sv' }] }))).toThrow(CultureValidationError)
  })

  test('refuse deux fois le meme personnage', () => {
    const participants = configuration().participants.map((p, i) => ({ ...p, characterId: 'solene-han', role: i ? 'translator' : 'speaker' }))
    expect(() => validateCultureConfiguration(configuration({ participants }))).toThrow(/differents/)
  })

  test('refuse deux fois le meme role', () => {
    const participants = configuration().participants.map(p => ({ ...p, role: 'speaker' }))
    expect(() => validateCultureConfiguration(configuration({ participants }))).toThrow(/role/)
  })

  test('accepte speaker et translator', () => {
    expect(validateCultureConfiguration(configuration())).toBeTruthy()
  })
})

describe('experience culture - planification', () => {
  test('construit les six couches dans le bon ordre', () => {
    const state = { userLanguage: 'fr' }
    const context = buildCultureContext({ participant: configuration().participants[0], character: { id: 'solene-han' }, state, lastUserMessage: 'Bonjour' })
    expect(context.layers.map(layer => layer.type)).toEqual(['fundamental', 'experience', 'character', 'temporary-role', 'conversation-state', 'last-user-message'])
    expect(context.layers.map(layer => layer.priority)).toEqual([1, 2, 3, 4, 5, 6])
  })

  test('genere exactement deux plans et charge seulement les personnages choisis', async () => {
    const generator = makeGenerator()
    const engine = createCultureEngine({ generator, characterLoader, idFactory: () => 'c1' })
    const result = await engine.startCultureConversation(configuration())
    expect(generator.plan).toHaveBeenCalledTimes(2)
    expect(characterLoader).toHaveBeenCalledWith('solene-han')
    expect(characterLoader).toHaveBeenCalledWith('sonia-nadir')
    expect(result.availableSpeakers).toHaveLength(2)
  })

  test('permet a un personnage de rester silencieux', async () => {
    const plan = jest.fn(async ({ characterId }) => characterId === 'sonia-nadir' ? { ...availablePlan(), shouldSpeak: false, reason: 'Rien a ajouter.' } : availablePlan())
    const engine = createCultureEngine({ generator: makeGenerator(plan), characterLoader, idFactory: () => 'c2' })
    const result = await engine.startCultureConversation(configuration())
    expect(result.availableSpeakers).toEqual([{ characterId: 'solene-han', status: 'available' }])
  })

  test('rejette une contribution redondante', () => {
    const result = evaluateCulturePlans([
      { characterId: 'a', ...availablePlan('Expliquer une tradition de cafe partage en Suede') },
      { characterId: 'b', ...availablePlan('Expliquer la tradition de cafe partage en Suede') },
    ])
    expect(result.map(plan => plan.status)).toEqual(['available', 'rejected'])
    expect(result[1].reason).toMatch(/redondante/)
  })
})

describe('experience culture - choix et reponse', () => {
  test('genere une seule reponse, met a jour l historique et reevalue le second', async () => {
    const generator = makeGenerator()
    const engine = createCultureEngine({ generator, characterLoader, idFactory: () => 'c3' })
    await engine.startCultureConversation(configuration())
    const result = await engine.generateCharacterResponse({ conversationId: 'c3', characterId: 'solene-han' })
    expect(generator.respond).toHaveBeenCalledTimes(1)
    expect(generator.plan).toHaveBeenCalledTimes(3)
    expect(result.reevaluatedIntentions).toHaveLength(1)
    expect(result.reevaluatedIntentions[0].characterId).toBe('sonia-nadir')
    const state = engine.getConversationState('c3')
    expect(state.messages.filter(m => m.role === 'character')).toHaveLength(1)
    expect(state.lastSpeakerId).toBe('solene-han')
  })

  test('refuse un personnage sans intention disponible', async () => {
    const plan = jest.fn(async ({ characterId }) => characterId === 'sonia-nadir' ? { ...availablePlan(), shouldSpeak: false } : availablePlan())
    const engine = createCultureEngine({ generator: makeGenerator(plan), characterLoader, idFactory: () => 'c4' })
    await engine.startCultureConversation(configuration())
    await expect(engine.generateCharacterResponse({ conversationId: 'c4', characterId: 'sonia-nadir' })).rejects.toThrow(/intention disponible/)
  })

  test('transmet au speaker sa langue temporaire sans muter sa fiche', async () => {
    const generator = makeGenerator()
    const engine = createCultureEngine({ generator, characterLoader, idFactory: () => 'c5' })
    await engine.startCultureConversation(configuration())
    await engine.generateCharacterResponse({ conversationId: 'c5', characterId: 'solene-han' })
    const context = generator.respond.mock.calls[0][0].context
    expect(context.layers[3].content).toMatchObject({ role: 'speaker', language: 'sv', userLanguage: 'fr' })
    expect(context.layers[2].content.language).toBeUndefined()
  })

  test('transmet au translator ses regles et les deux langues', async () => {
    const generator = makeGenerator()
    const engine = createCultureEngine({ generator, characterLoader, idFactory: () => 'c6' })
    await engine.startCultureConversation(configuration())
    await engine.generateCharacterResponse({ conversationId: 'c6', characterId: 'sonia-nadir' })
    const role = generator.respond.mock.calls[0][0].context.layers[3].content
    expect(role).toMatchObject({ role: 'translator', language: 'sv', userLanguage: 'fr' })
    expect(role.rules.join(' ')).toMatch(/Traduire seulement/)
  })

  test('ne modifie pas les points d entree question et aventure existants', () => {
    expect(typeof executeTurn).toBe('function')
    expect(ajouterEchange([], { texte: 'Question' }, { action: '', dialogue: 'Reponse' })).toHaveLength(2)
  })
})

describe('experience culture - messages utilisateur multi-tour', () => {
  test('ajoute un second message, produit deux plans et ne genere aucune reponse', async () => {
    const generator = makeGenerator()
    const engine = createCultureEngine({ generator, characterLoader, idFactory: () => 'm1' })
    await engine.startCultureConversation(configuration())
    const result = await engine.addCultureUserMessage({ conversationId: 'm1', message: 'Et pour le fika ?' })
    expect(result).toEqual({
      conversationId: 'm1',
      availableSpeakers: [
        { characterId: 'solene-han', status: 'available' },
        { characterId: 'sonia-nadir', status: 'available' },
      ],
      conversationStatus: 'active',
    })
    expect(generator.plan).toHaveBeenCalledTimes(4)
    expect(generator.respond).not.toHaveBeenCalled()
    expect(engine.getConversationState('m1').messages.at(-1)).toEqual({ role: 'user', content: 'Et pour le fika ?' })
  })

  test('invalide une ancienne intention devenue obsolete', async () => {
    let planningRound = 0
    const plan = jest.fn(async ({ characterId }) => {
      if (characterId === 'solene-han') planningRound += 1
      return planningRound === 1 ? availablePlan(`Ancien sujet ${characterId}`) : { ...availablePlan(`Nouveau sujet ${characterId}`), shouldSpeak: false, reason: 'Ancien sujet obsolete.' }
    })
    const engine = createCultureEngine({ generator: makeGenerator(plan), characterLoader, idFactory: () => 'm2' })
    await engine.startCultureConversation(configuration())
    const result = await engine.addCultureUserMessage({ conversationId: 'm2', message: 'Changeons completement de sujet.' })
    expect(result.availableSpeakers).toEqual([])
  })

  test('conserve une intention differee encore pertinente apres reevaluation', async () => {
    const plan = jest.fn(async ({ characterId }) => characterId === 'sonia-nadir'
      ? { ...availablePlan('Expliquer plus tard un terme suedois precis.'), timing: 0.2, reason: 'Pertinent mais encore trop tot.' }
      : availablePlan(`Sujet principal ${characterId}`))
    const engine = createCultureEngine({ generator: makeGenerator(plan), characterLoader, idFactory: () => 'm3' })
    await engine.startCultureConversation(configuration())
    await engine.addCultureUserMessage({ conversationId: 'm3', message: 'Pouvez-vous continuer ?' })
    const callsForSonia = plan.mock.calls.filter(([input]) => input.characterId === 'sonia-nadir')
    expect(callsForSonia).toHaveLength(2)
    expect(engine.getConversationState('m3').availableSpeakers).toEqual([{ characterId: 'solene-han', status: 'available' }])
  })

  test('refuse une conversation inconnue', async () => {
    const engine = createCultureEngine({ generator: makeGenerator(), characterLoader })
    await expect(engine.addCultureUserMessage({ conversationId: 'inconnue', message: 'Bonjour' })).rejects.toThrow(/introuvable/)
  })

  test.each([undefined, '', '   ', 42, {}])('refuse un message invalide: %p', async message => {
    const engine = createCultureEngine({ generator: makeGenerator(), characterLoader, idFactory: () => 'm4' })
    await engine.startCultureConversation(configuration())
    await expect(engine.addCultureUserMessage({ conversationId: 'm4', message })).rejects.toThrow(/chaine non vide/)
  })

  test('refuse un conversationId absent', async () => {
    const engine = createCultureEngine({ generator: makeGenerator(), characterLoader })
    await expect(engine.addCultureUserMessage({ message: 'Bonjour' })).rejects.toThrow(/conversationId/)
  })

  test('refuse une conversation inactive', async () => {
    const store = new Map()
    const engine = createCultureEngine({ generator: makeGenerator(), characterLoader, idFactory: () => 'm5', conversationStore: store })
    await engine.startCultureConversation(configuration())
    store.get('m5').status = 'completed'
    await expect(engine.addCultureUserMessage({ conversationId: 'm5', message: 'Encore une question' })).rejects.toThrow(/inactive/)
  })

  test('execute le cycle complet start, reponse, message, nouvelle reponse', async () => {
    const generator = makeGenerator()
    const engine = createCultureEngine({ generator, characterLoader, idFactory: () => 'm6' })
    const started = await engine.startCultureConversation(configuration())
    await engine.generateCharacterResponse({ conversationId: started.conversationId, characterId: 'solene-han' })
    const nextTurn = await engine.addCultureUserMessage({ conversationId: 'm6', message: 'Sonia, pouvez-vous traduire ?' })
    expect(nextTurn.availableSpeakers.some(speaker => speaker.characterId === 'sonia-nadir')).toBe(true)
    const secondResponse = await engine.generateCharacterResponse({ conversationId: 'm6', characterId: 'sonia-nadir' })
    expect(secondResponse.characterId).toBe('sonia-nadir')
    const finalState = engine.getConversationState('m6')
    expect(finalState.messages.map(message => message.role)).toEqual(['user', 'character', 'user', 'character'])
    expect(finalState.messages.at(-1).language).toBe('fr')
    expect(new Set(finalState.availableSpeakers.map(speaker => speaker.characterId)).size).toBe(finalState.availableSpeakers.length)
  })

  test('la facade publique delegue a l instance', async () => {
    const engine = createCultureEngine({ generator: makeGenerator(), characterLoader, idFactory: () => 'm7' })
    await engine.startCultureConversation(configuration())
    const result = await addCultureUserMessage(engine, { conversationId: 'm7', message: 'Deuxieme message' })
    expect(result.conversationStatus).toBe('active')
  })

  test('les sorties publiques ne divulguent aucun plan ni fiche interne', async () => {
    const engine = createCultureEngine({ generator: makeGenerator(), characterLoader, idFactory: () => 'm8' })
    const started = await engine.startCultureConversation(configuration())
    const added = await engine.addCultureUserMessage({ conversationId: 'm8', message: 'Un autre sujet' })
    const summary = engine.getConversationState('m8')
    for (const output of [started, added, summary]) {
      expect(output).not.toHaveProperty('activeIntentions')
      expect(output).not.toHaveProperty('deferredIntentions')
      expect(output).not.toHaveProperty('characterSheets')
      expect(JSON.stringify(output)).not.toMatch(/contribution|personalityCompliance/)
    }
  })
})
