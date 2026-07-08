# legacy/ — archive architecturale (hors architecture officielle V1)

Ce dossier **archive** du code qui ne fait **pas** partie de l'architecture officielle
de Gabida V1. Il est conservé uniquement pour l'**historique architectural** : il n'est
ni exécuté, ni testé, ni importé par le moteur.

- Exclu de Jest (`testPathIgnorePatterns` / `modulePathIgnorePatterns` dans `package.json`).
- Non importé par le pipeline officiel (`core/index.js` → `executeTurn`) ni par aucun module actif.
- Les imports relatifs vers `constants/`, `types/`… peuvent être cassés depuis le déplacement :
  c'est volontaire, ce code n'est plus destiné à s'exécuter.

## Contenu

### `legacy/core/` — couche domaine OOP + infrastructure runtime (Sprints 13–26)
Modèles objet et moteur générique jamais branchés sur le tour narratif réel, lequel
manipule des objets `fiches` bruts issus de `lecture/` et non ces modèles :

- `character/`, `adventure/`, `universe/`, `player/`, `memory/`, `context/`, `events/`, `registry/`
  — modèles de domaine immuables et validateurs.
- `modules/`, `pipeline/`, `runtime/`, `stages/`
  — système de modules, pipeline générique, runtime, et étapes cognitives (`AnalyseStage`…`NarrativePipeline`).

### `legacy/langage/`
Ancien « langage universel des critères » (types, familles, valeurs). Non utilisé par
le pipeline officiel.

## Pourquoi archivé et non supprimé

Décision de gel V1 : l'architecture officielle est **le pipeline fonctionnel**
`analyse → influences → ressenti → decision → prompt → api → memoire`
(cf. `ARCHITECTURE.md`). Cette couche parallèle était source d'ambiguïté ; elle est
sortie de l'architecture active tout en restant consultable ici.

Réintégrer un élément = le sortir de `legacy/`, corriger ses imports, et le rebrancher
explicitement dans le pipeline officiel.
