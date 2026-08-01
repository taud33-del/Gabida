# Serveur HTTP Culture

Le serveur expose le moteur « Découvrir une culture » sans modifier ses routes publiques :

- `POST /api/v2/culture/start`
- `POST /api/v2/culture/message`
- `POST /api/v2/culture/response`

Les trois handlers partagent l'unique instance `cultureRuntime.cultureEngine`, créée au chargement du serveur. La mémoire reste locale au processus et disparaît au redémarrage.

## Choisir le générateur

`CULTURE_GENERATOR_MODE` accepte deux valeurs :

- `simulation` (valeur par défaut) : réponses déterministes, sans modèle ni réseau ;
- `production` : génération structurée via l'abstraction OpenAI déjà utilisée par Gabida.

Le mode production exige `CULTURE_MODEL` et `OPENAI_API_KEY`. `CULTURE_REQUEST_TIMEOUT_MS` est facultatif et vaut `30000` par défaut. Le fichier `.env.example` documente ces variables mais le serveur ne charge pas automatiquement un fichier `.env`.

### Démarrage en simulation

```powershell
$env:CULTURE_GENERATOR_MODE='simulation'
npm.cmd run server
```

Ou simplement `npm.cmd run server`, puisque la simulation est le mode par défaut.

### Démarrage en production

```powershell
$env:CULTURE_GENERATOR_MODE='production'
$env:CULTURE_MODEL='votre-modele-compatible'
$env:CULTURE_REQUEST_TIMEOUT_MS='30000'
$env:OPENAI_API_KEY='votre-cle'
npm.cmd run server
```

La clé n'est jamais écrite dans les journaux. Les journaux de production se limitent à l'étape, au code d'erreur, à la tentative éventuelle de réparation et à la durée. Une erreur fournisseur ou un dépassement de délai devient publiquement `CULTURE_INTERNAL_ERROR`, sans prompt, fiche, sortie brute ni stack trace.

## Contrat de génération

Le générateur conserve le contrat interne du moteur :

- `plan(input)` produit uniquement un plan JSON strict ;
- `respond(input)` produit uniquement `{ text, language }`.

Le plan contient exactement `understood`, `intention`, `contribution`, `relevance`, `novelty`, `complementarity`, `roleCompliance`, `personalityCompliance`, `timing`, `estimatedLength`, `shouldSpeak` et `reason`. Une sortie de plan invalide autorise une seule demande de réparation. La réponse visible n'est jamais demandée pendant cette phase.

Pour la réponse, le `speaker` utilise uniquement sa langue temporaire cible. Le `translator` répond par défaut dans la langue de l'utilisateur et aide sans se substituer au speaker. Le contexte interne transmis au modèle contient la fiche et les règles nécessaires, mais les routes publiques ne les retournent jamais.

## Requête de départ

Toutes les requêtes exigent `Content-Type: application/json`. Aucun CORS navigateur n'est activé : Hadelas doit appeler Gabida depuis son proxy serveur.

```json
{
  "experience": "culture",
  "userLanguage": "fr",
  "participants": [
    { "characterId": "solene-han", "role": "speaker", "language": "sv" },
    { "characterId": "sonia-nadir", "role": "translator", "language": "sv" }
  ],
  "message": "Bonjour, j'aimerais découvrir la culture suédoise."
}
```

Pour `/message`, envoyez `{ "conversationId": "...", "message": "..." }`. Cette route ne génère jamais de réponse. Pour `/response`, envoyez `{ "conversationId": "...", "characterId": "solene-han" }`.

## Vérification

```powershell
npm.cmd test
npm.cmd run culture:http-demo
```

La suite automatisée simule le client du modèle et n'effectue aucun appel réseau. La démonstration HTTP utilise le mode simulation par défaut.
