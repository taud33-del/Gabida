# Banc d'évaluation du dialogue

Le banc exécute les scénarios positifs du corpus métier contre le moteur réel,
puis produit un rapport Markdown comparant chaque `EtatDialogue` obtenu à l'état
attendu.

Lancement :

```bash
npm run dialogue:evaluate
```

La variable `OPENAI_API_KEY` est obligatoire. Le modèle peut être remplacé avec
`OPENAI_DIALOGUE_MODEL`; sinon le modèle par défaut du script est utilisé.

Cette commande effectue de véritables appels OpenAI et peut donc être facturée.
Elle n'est jamais lancée par Jest ou par la suite automatisée. Son rapport sert
de référence avant toute modification du prompt afin d'observer précisément les
changements de comportement, sans leur attribuer de score.

Le comparateur traite `faits`, `objectifs` et `decisions` comme des collections
identifiées : leur ordre n'est pas significatif. L'ordre chronologique de
`evenementSourceIds` reste significatif. Le volet « personnages » correspond à
l'ensemble des identifiants de participants et d'auteurs explicitement présents
dans les objets projetés, car `EtatDialogue` ne possède pas de collection
`personnages`.

Le rapport Markdown est écrit sur la sortie standard. Il peut être enregistré
explicitement selon les conventions de l'environnement d'exécution.
