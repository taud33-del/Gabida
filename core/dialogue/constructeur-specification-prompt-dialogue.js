import { creerSpecificationPromptDialogue } from './specification-prompt-dialogue.js'

export function construireSpecificationPromptDialogue(representationCanonique) {
  const representation = JSON.stringify(representationCanonique)
  return creerSpecificationPromptDialogue([
    'Rôle : maintenir une projection fidèle de l’état courant du dialogue.',
    'Objectif : produire un EtatDialogue complet à partir des événements fournis.',
    [
      'Règles : utiliser uniquement les événements fournis et respecter exactement le contrat EtatDialogue.',
      'Chaque evenementSourceIds référence au moins un événement fourni.',
      'Chaque date de projection est la date exacte de son dernier événement source.',
    ].join('\n'),
    [
      'Contrat JSON exact :',
      '{',
      '  "faits": [{"id": "string", "contenu": "string", "evenementSourceIds": ["string"], "dateMiseAJour": "ISO 8601"}],',
      '  "objectifs": [{"id": "string", "contenu": "string", "participantIds": ["string"], "evenementSourceIds": ["string"], "dateMiseAJour": "ISO 8601"}],',
      '  "questionsOuvertes": [{"id": "string", "contenu": "string", "auteurId": "string", "destinataireIds": ["string"], "evenementSourceIds": ["string"], "dateOuverture": "ISO 8601"}],',
      '  "decisions": [{"id": "string", "contenu": "string", "participantIds": ["string"], "evenementSourceIds": ["string"], "dateDecision": "ISO 8601"}],',
      '  "contraintes": [{"id": "string", "contenu": "string", "participantIds": ["string"], "evenementSourceIds": ["string"], "dateMiseAJour": "ISO 8601"}],',
      '  "reponses": [{"id": "string", "questionId": "string", "contenu": "string", "auteurId": "string", "evenementSourceIds": ["string"], "dateReponse": "ISO 8601"}],',
      '  "faitsAConfirmer": [{"id": "string", "contenu": "string", "confirmationParticipantIds": ["string"], "evenementSourceIds": ["string"], "dateMiseAJour": "ISO 8601"}],',
      '  "evenementSourceIds": ["string"],',
      '  "dateMiseAJour": "ISO 8601"',
      '}',
      'Toutes les collections sont présentes, même lorsqu’elles sont vides. Aucune propriété supplémentaire.',
    ].join('\n'),
    'Format de sortie : produire uniquement un objet JSON valide, sans aucun texte hors JSON.',
    `Représentation canonique :\n${representation}`,
  ])
}
