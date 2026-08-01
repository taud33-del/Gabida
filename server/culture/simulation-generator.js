export function createCultureSimulationGenerator() {
  return Object.freeze({
    async plan({ characterId, context }) {
      const role = context.layers[3].content.role
      return {
        understood: 'L utilisateur souhaite poursuivre un echange culturel.',
        intention: role === 'speaker' ? 'Echanger dans la langue cible.' : 'Faciliter la comprehension.',
        contribution: role === 'speaker'
          ? `Contribution directe du speaker ${characterId}.`
          : `Contribution complementaire du translator ${characterId}.`,
        relevance: 0.9,
        novelty: 0.9,
        complementarity: 0.9,
        roleCompliance: 1,
        personalityCompliance: 1,
        timing: 0.9,
        estimatedLength: 'short',
        shouldSpeak: true,
        reason: 'Contribution deterministe disponible pour la demonstration locale.',
      }
    },
    async respond({ characterId, context }) {
      const temporaryRole = context.layers[3].content
      if (temporaryRole.role === 'speaker') {
        return {
          text: 'Hej! Vad vill du veta om svensk kultur?',
          language: temporaryRole.language,
        }
      }
      return {
        text: 'Le fika est une pause conviviale autour d’un café, consacrée au partage et à la conversation.',
        language: temporaryRole.userLanguage,
      }
    },
  })
}
