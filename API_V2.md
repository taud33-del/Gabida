# API publique Gabida V2

## Import

La surface publique stable est :

```js
import {
  traiterInteractionV2,
  VERSION_API_GABIDA_V2,
  TYPES_INTENTION_METIER,
  POLITIQUES_DIFFUSION_SCENE,
  ErreurValidation,
} from './api/v2/index.js'
```

Une application ne doit pas importer `core/*` pour utiliser le moteur V2.

L'API historique V1 reste distincte dans `core/index.js` :

```js
import { executeTurn, runCycle } from './core/index.js'
```

Ces imports historiques restent supportés. RFC-014 n'en supprime et n'en renomme
aucun.

## Version

`VERSION_API_GABIDA_V2` vaut `2.0.0`.

- correctif : correction sans changement de contrat ;
- mineure : ajout rétrocompatible ;
- majeure : rupture de contrat.

Les messages d'erreur et l'organisation interne des dossiers ne sont pas
versionnés. Les noms exportés, signatures, codes d'erreur et champs documentés
le sont.

## Exemple minimal

```js
import { traiterInteractionV2 } from './api/v2/index.js'

const resultat = await traiterInteractionV2(
  sollicitation,
  etatInteraction,
  {
    providerConfig: {
      provider: 'mon-provider-enregistre',
      cleApi: 'fournie-par-l-application',
      modele: 'modele',
    },
    genererId: role => `${role}-${compteur++}`,
    date: '2026-01-01T00:00:00.000Z',
  }
)
```

La façade délègue directement à l'unique moteur `traiterInteraction`. Elle
n'effectue ni copie profonde, ni sérialisation, ni double pipeline.

## Fonction principale

```js
traiterInteractionV2(sollicitation, etatInteraction, options)
```

La fonction :

- valide avant l'exécution ;
- ne mute pas ses entrées ;
- conserve l'ordre déterministe des cibles ;
- ne retourne aucun résultat partiel ;
- propage les erreurs métier, provider et système sans les masquer ;
- retourne exactement le `ResultatInteraction` produit par le moteur interne.

## Sollicitation

`Sollicitation` exige au minimum :

- `id` : chaîne non vide ;
- `evenement` : `EvenementInteraction` ;
- `participantIdsCibles` : tableau ordonné d'identifiants uniques.

`validerSollicitationV2()` valide la frontière sans lancer le pipeline.

## État

`EtatInteraction` distingue participants, état partagé, états privés, mémoires,
relations, historique et métadonnées. Les scènes et groupes sont conditionnels.

`validerEtatInteractionV2()` valide le socle commun.
`validerEtatScenes()` valide groupes, scènes, hiérarchie et présences lorsque la
couche RFC-013 est configurée.

Les contrats JSDoc publics sont documentés dans `types/` :

- `Participant`, `Sollicitation`, `EtatInteraction`, `EvenementInteraction` ;
- `ActionParticipant`, `ResultatInteraction`, `PerceptionParticipant` ;
- `FaitEpistemique`, `RelationParticipant`, `TransmissionInformation` ;
- `IntentionMetier`, `PlanificationExecutionParticipant` ;
- `ConflitAction`, `ResultatResolutionConflits` ;
- `GroupeParticipants`, `SceneInteraction`, `TransitionScene`,
  `ResultatResolutionScene`.

Un champ absent est différent d'un champ présent avec `null`. Les tableaux
conservent l'ordre documenté par leur RFC. Les entrées restent immuables.

## Options et dépendances

Les propriétés restent optionnelles lorsqu'elles ne sont pas utilisées :

- `providerConfig` : configuration transmise au provider enregistré ;
- `genererId` : générateur déterministe commun aux actions, événements et traces ;
- `date` : date explicite des structures produites ;
- `propagation` : activation et bornes RFC-005 ;
- `producteurIntentionsMetier` : fournisseur déterministe d'intentions RFC-011 ;
- `resolutionConflits` : activation, règles et ressources RFC-012 ;
- générateurs spécialisés historiques (`genererIdFait`,
  `genererIdVersionFait`, `genererIdRelation`,
  `genererIdTransmission`) conservés pour compatibilité ;
- producteurs et révisions épistémiques déjà définis par les RFC antérieures.

RFC-014 ne change pas la forme historique des options et ne rend aucun
générateur inutilisé obligatoire. Aucun générateur aléatoire n'est ajouté.

`registerProvider(nom, adaptateur)` est public. Les clés API, fonctions injectées
et configurations provider ne sont jamais recopiées dans le résultat métier.

## Résultat

Toujours présents :

- `sollicitationId` ;
- `actions` ;
- `evenementsProduits` ;
- `etat` ;
- `traces`.

Conditionnels :

- `intentionsRetenues`, `intentionsEcartees`,
  `planificationsExecution` avec intentions explicites ;
- champs de résolution (`intentionsExecutables`,
  `intentionsEcarteesParConflit`, `conflitsDetectes`,
  `planificationsFinales`, `ordreExecutionFinal`) uniquement avec RFC-012 active ;
- données structurelles de scène uniquement lorsque des scènes sont configurées.

La façade n'ajoute aucun tableau vide ni champ artificiel. Sans intentions
explicites, le chemin RFC-010 reste structurellement identique.

## Erreurs

Hiérarchie publique :

- `ErreurGabida` : racine moteur ;
- `ErreurValidation` : précondition ou règle déterministe ;
- sous-classes par domaine : interaction, orchestration, propagation,
  perception, épistémique, relation, transmission, intention, conflits et scène ;
- `ErreurPipeline`, `ErreurTraitementParticipant` : échec d'exécution interne ;
- `ErreurProvider` et erreurs de registre provider : défaillance externe ou
  configuration du registre.

Le contrat consommateur est :

```js
if (error instanceof ErreurValidation) {
  switch (error.code) {
    // traitement déterministe par code stable
  }
}
```

`error.code` est stable pour les erreurs métier. Le message est humain et non
contractuel. Une application ne doit jamais analyser son texte.

## Groupes, scènes et transitions

La façade expose les opérations applicatives :

- création d'un groupe ou d'une scène ;
- association groupe/scène et ajout explicite des membres ;
- entrée, sortie et déplacement de présence ;
- retour à la scène parente ;
- transition de scène.

La résolution interne des destinataires et `presenceEffective` ne sont pas
publiques.

## Intentions et conflits

Sont publics :

- constantes et validation d'`IntentionMetier` ;
- `arbitrerIntentionsMetier()` ;
- configuration et `resoudreConflitsActions()`.

L'ordre garanti est priorité décroissante, FIFO, `participantId`, puis `id`.
Le comparateur, la planification de compatibilité, l'allocation de ressources,
la résolution par scène et le calcul du point fixe restent internes.

## Déterminisme, atomicité et sécurité

La façade conserve :

- validation avant le premier pipeline ;
- ordre stable ;
- absence de mutation et de résultat partiel ;
- absence de hasard ou d'heure système ajoutée ;
- mêmes erreurs et mêmes codes que le moteur ;
- aucune exposition de clé API, configuration sensible, fonction injectée,
  objet provider ou stack transformée en donnée métier.

## Éléments internes non garantis

Ne font pas partie de l'API publique :

- `executeTurn` et l'adaptateur V1 utilisés par le moteur V2 ;
- orchestrateur, agrégateurs et traitement individuel ;
- comparateurs et tris locaux ;
- helpers de présence effective ;
- point fixe et allocations de conflits ;
- validateurs locaux spécialisés et normalisateurs internes ;
- fixtures et fonctions de tests ;
- organisation de `core/*`.

Ces éléments peuvent évoluer sans changement de version publique tant que le
contrat observable de la façade reste identique.

## Compatibilité

- RFC-004 à RFC-013 conservent leurs comportements.
- Les imports internes historiques continuent de fonctionner.
- `traiterInteractionV2` est le même objet fonction que `traiterInteraction`.
- Les résultats, erreurs, codes et ordres sont identiques.
- Les couches non activées n'ajoutent aucun champ.
- Aucune migration d'état, publication npm ou adaptation Hadelas n'est effectuée.
