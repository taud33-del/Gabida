import { CultureValidationError } from '../../core/experiences/culture/index.js'

export function mapCultureHttpError(error) {
  if (!(error instanceof CultureValidationError)) {
    return { status: 500, error: { code: 'CULTURE_INTERNAL_ERROR', message: 'Erreur interne du moteur Culture.' } }
  }
  const message = error.message || 'Requete Culture invalide.'
  if (/introuvable/i.test(message)) {
    return { status: 404, error: { code: 'CULTURE_CONVERSATION_NOT_FOUND', message: 'Conversation introuvable.' } }
  }
  if (/inactive/i.test(message)) {
    return { status: 409, error: { code: 'CULTURE_CONVERSATION_INACTIVE', message: 'La conversation est inactive.' } }
  }
  if (/intention disponible|avant la reponse du speaker|phase du tour/i.test(message)) {
    return { status: 409, error: { code: 'CULTURE_SPEAKER_NOT_AVAILABLE', message: 'Ce personnage n’est pas disponible.' } }
  }
  return { status: 400, error: { code: 'CULTURE_INVALID_REQUEST', message } }
}
