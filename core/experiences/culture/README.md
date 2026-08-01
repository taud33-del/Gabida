# Expérience culture (vertical slice)

Ce module expose un moteur conversationnel en mémoire, indépendant de Hadelas :

- `createCultureEngine({ generator })` crée une instance et son stockage actif ;
- `startCultureConversation(configuration)` valide, charge les fiches, produit les plans et retourne les personnages disponibles ;
- `generateCharacterResponse({ conversationId, characterId })` produit seulement la réponse choisie puis réévalue l’autre participant ;
- `addCultureUserMessage({ conversationId, message })` ajoute un message, réévalue les intentions et retourne les personnages disponibles sans générer de réponse.

La façade V2 exporte aussi `addCultureUserMessage(engine, input)` pour déléguer à une instance créée par `createCultureEngine`.

## Entrées et sorties

`startCultureConversation` reçoit `experience`, `userLanguage`, un ou deux `participants` et le premier `message`. Il retourne `conversationId` et `availableSpeakers`.

`generateCharacterResponse` reçoit un `conversationId` et le `characterId` d’un personnage disponible. Il retourne sa seule réponse visible et les personnages encore disponibles.

`addCultureUserMessage` reçoit un `conversationId` actif et une chaîne `message` non vide. Il retourne :

```json
{
  "conversationId": "culture-1",
  "availableSpeakers": [{ "characterId": "solene-han", "status": "available" }],
  "conversationStatus": "active"
}
```

Les plans, scores, intentions complètes et fiches chargées ne figurent jamais dans ces sorties. Le mode `debug: true` transmet les données de calibration uniquement au `logger` injecté.

## Cycle multi-tour

```js
const engine = createCultureEngine({ generator })
const started = await engine.startCultureConversation(configuration)

await engine.generateCharacterResponse({
  conversationId: started.conversationId,
  characterId: 'solene-han',
})

const next = await engine.addCultureUserMessage({
  conversationId: started.conversationId,
  message: 'Que signifie « fika » ?',
})

await engine.generateCharacterResponse({
  conversationId: next.conversationId,
  characterId: 'sonia-nadir',
})
```

Le cycle ajout de message / sélection d’un personnage peut ensuite être répété.

## Erreurs

Une `CultureValidationError`, compatible avec `ErreurValidation` V2, est levée pour une configuration invalide, un identifiant absent ou inconnu, une conversation inactive, un message vide ou incorrect, ou la sélection d’un personnage sans intention disponible.

## Commandes

```sh
npm test
npm run culture:demo
```

## Fiches éditoriales permanentes

Les fiches structurées sont stockées dans `reference/characters/`, à raison d’un fichier JSON par personnage. Elles utilisent toutes le schéma `culture-character-v1` :

- `identity` contient les champs d’identité directement extraits de la source ;
- `sections` conserve intégralement les douze sections éditoriales communes, sous forme de texte UTF-8 fidèle ;
- `consistencyRules` contient les règles comportementales ;
- `experienceAdaptations` sépare question, aventure, culture (`speaker` et `translator`) et visite ;
- `centralSummary` contient le résumé éditorial complet ;
- `source` documente le fichier texte importé.

Les sections absentes dans une source sont représentées par une chaîne vide ou un tableau vide. Aucune donnée manquante n’est inventée.

Le rôle, la langue cible et la langue utilisateur ne font pas partie de la fiche permanente. `buildCultureContext` superpose ces informations dans la couche temporaire de priorité 4, sans mutation de la fiche chargée. Le chargeur retourne un objet profondément immuable.

Pour ajouter un personnage :

1. ajouter son identifiant et son nom de fichier dans `character-loader.js` et dans l’importeur ;
2. déposer sa fiche texte éditoriale ;
3. lancer `node bin/import-culture-characters.js <dossier-source>` ;
4. exécuter les tests du chargeur, qui vérifient le JSON, le schéma, l’identité, l’âge, la communication, la personnalité, les règles et le résumé.

## Limites connues

- L’état reste en mémoire dans le processus actif et n’est pas persistant.
- Le respect linguistique de la sortie dépend encore du générateur injecté.
- Les rôles et langues temporaires restent exclusivement dans l’état de conversation.
- Hadelas n’est pas encore branché.
