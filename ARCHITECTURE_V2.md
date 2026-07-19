# Architecture Gabida V2 — Modèle multi-participants

> **Statut : Phase 3 — exécution cognitive multi-participants.**
> La Phase 1 a introduit les *contrats de données* (§1–9). La Phase 2 (§10) a
> exécuté le pipeline cognitif V1 pour **un seul** participant autonome. La
> Phase 3 (§11) répète ce même pipeline, de façon **séquentielle et
> déterministe**, pour **plusieurs** participants autonomes ciblés, avec des
> mémoires et états privés isolés. Le pipeline n'est jamais dupliqué. Aucune
> réaction croisée, aucun ordre narratif intelligent ni arbitrage de conflit
> n'est ajouté à ce stade (pas encore d'orchestrateur narratif).

---

## 1. Pourquoi `Participant` devient l'unité centrale

Gabida V1 est un moteur centré sur **un personnage unique** : le pipeline
`Analyse → Influences → Ressenti → Décision → Prompt → API → Mémoire` produit la
réponse d'un seul personnage face à un seul joueur.

Gabida V2 généralise ce modèle : l'unité centrale n'est plus le personnage mais
le **participant** — toute entité technique prenant part à une interaction. Un
participant peut être un agent autonome piloté par le moteur, un émetteur externe
(joueur humain), un narrateur ou un participant système.

Ce renversement permet :

- des interactions à **plusieurs participants** (plusieurs personnages, un ou
  plusieurs joueurs, un narrateur, des mécanismes système) ;
- un traitement **symétrique** : chaque participant est décrit par les mêmes
  contrats génériques, quelles que soient sa nature et ses capacités ;
- une **séparation nette** entre ce qu'un participant *est* (technique), ce qu'il
  *incarne* (profil) et ce qu'il *peut faire* (capacités).

## 2. `Personnage` devient un type de profil

En V1, « personnage » est la seule entité incarnée. En V2, **`Personnage` n'est
plus qu'un `type` de `ProfilParticipant`** parmi d'autres
(`PERSONNAGE`, `UTILISATEUR`, `NARRATEUR`, `SYSTEME`, `PERSONNALISE`).

Un participant *possède* éventuellement un profil (`profil` peut être `null`).
Les données spécifiques (par exemple les cinq fiches d'un personnage) vivent dans
`ProfilParticipant.donnees`, jamais dans le participant lui-même. Les contrats
restent ainsi **génériques** : rien ne suppose qu'un participant soit forcément
un personnage.

## 3. Le solo comme cas particulier du multi

À terme, une interaction mono-personnage (le cas actuel d'Elia) sera simplement
une interaction à **deux participants** : un agent autonome (le personnage) et un
émetteur externe (le joueur). Le solo devient un **cas particulier du multi**, ce
qui évitera de maintenir deux moteurs distincts.

Cette convergence n'est **pas** réalisée en Phase 1 : aucune migration des
structures V1 n'est effectuée.

---

## 4. Responsabilités des contrats

| Contrat | Responsabilité |
| --- | --- |
| **`Participant`** | Décrit une entité prenant part à l'interaction : `id`, `type` technique, `profil` éventuel, `capacites`, `statut`, `metadata`. |
| **`CapacitesParticipant`** | Déclare ce qu'un participant est autorisé à faire (percevoir, analyser, ressentir, décider, produire une action, mémoriser). Purement déclaratif. |
| **`ProfilParticipant`** | Décrit ce qu'incarne un participant : un `type` de profil et des `donnees` libres. C'est ici que « personnage » devient un profil. |
| **`EvenementInteraction`** | Fait survenu dans l'interaction, émis par un participant (ou personne) vers des destinataires, avec une `visibilite` qui qualifie sa portée. Unité générique circulant entre participants. |
| **`Sollicitation`** | Demande faite à des participants cibles de réagir à un événement. Exprime *qui* est sollicité, sans décrire *comment* la réaction est produite. |
| **`EtatInteraction`** | État complet d'une interaction : participants, état partagé, états privés, mémoires, relations, historique, metadata. |
| **`RelationParticipant`** | Lien **directionnel** de `sourceId` vers `cibleId`, porteur de `dimensions` relationnelles libres. |
| **`ActionParticipant`** | Ce qu'un participant produit à un tour : `type` (parole, action, réaction interne, observation, silence), `contenu`, destinataires et `visibilite`. |
| **`TraceInteraction`** | Contrat *minimal* de journalisation d'une étape (audit/debug/explicabilité). Aucune logique de traçage n'est créée. |
| **`ResultatInteraction`** | Regroupe ce qui a été produit pour une sollicitation : actions, événements produits, état résultant et traces. |

---

## 5. Séparation état partagé / état privé / mémoire / relations

`EtatInteraction` distingue explicitement quatre plans, sans les mélanger :

- **État partagé** (`etatPartage`) : l'état **canonique/objectif** de
  l'interaction — la réalité de référence, **indépendante de ce que chaque
  participant perçoit, sait ou croit**. Ce n'est pas « ce que tout le monde
  perçoit » : un participant peut ignorer, mal percevoir ou croire faux une
  partie de cet état canonique (ce décalage vivra dans les états privés/mémoires).
- **États privés** (`etatsPrives`) : indexés par `participantId`, propres à
  chaque participant et non partagés.
- **Mémoire** (`memoires`) : indexée **par participant** — chaque participant a
  sa propre mémoire, jamais une mémoire globale.
- **Relations** (`relations`) : liens **directionnels** entre participants
  (`sourceId` → `cibleId`). Une relation réciproque = deux relations distinctes.

L'`historique` conserve la suite ordonnée des `EvenementInteraction`.

---

## 6. Capacités et statut : possibilités structurelles vs restriction contextuelle

`CapacitesParticipant` et `statut` jouent deux rôles complémentaires et ne
doivent pas être confondus :

- **`capacites`** décrit les **possibilités structurelles** d'un participant : ce
  qu'il est, par nature, capable de faire (percevoir, analyser, ressentir,
  décider, produire une action, mémoriser).
- **`statut`** applique une **restriction contextuelle** à ces possibilités : il
  module, à un instant donné, l'usage effectif de capacités déjà présentes.

Règle stricte :

- le statut **ne peut jamais accorder** une capacité absente
  (un participant sans `peutProduireAction` ne produira jamais d'action, quel que
  soit son statut) ;
- le statut **peut temporairement empêcher** l'usage d'une capacité présente
  (par exemple un participant `PASSIF` conserve `peutProduireAction: true` mais
  n'en fait pas usage tant qu'il reste passif).

Autrement dit : `capacites` = plafond permanent ; `statut` = restriction
temporaire sous ce plafond, jamais au-dessus.

---

## 7. Destinataires et visibilité : concerné vs perceptible

Sur `EvenementInteraction` et `ActionParticipant`, `destinataireIds` et
`visibilite` répondent à deux questions différentes :

- **`destinataireIds`** indique les participants **directement concernés** par
  l'événement ou l'action (ceux à qui il s'adresse).
- **`visibilite`** détermine quels participants **peuvent potentiellement le
  percevoir** (sa portée).

Ces deux notions sont **indépendantes** : **être perceptible ne signifie pas être
destinataire**. Un événement peut viser un destinataire précis tout en étant
`PUBLIQUE` (d'autres participants peuvent le percevoir sans en être les
destinataires) ; inversement, une portée `PRIVEE` ou `RESTREINTE` limite la
perception à un sous-ensemble, indépendamment de la liste des destinataires.

La logique qui exploitera cette distinction (perception effective) appartient à
une phase ultérieure ; la Phase 1 se limite à fixer les deux champs.

---

## 8. Cohérence avec l'architecture existante

- Les **constantes** vivent dans `constants/`, les **contrats** dans `types/` ;
  cette séparation est strictement conservée.
- Les constantes utilisent `Object.freeze`, comme les constantes V1.
- Les fichiers de types ne contiennent **aucune logique** et **aucune
  dépendance** vers un module métier.
- Aucun **magic string** : les valeurs officielles passent par les constantes.
- Nommage en **français**, cohérent avec le vocabulaire existant de Gabida.

Fichiers ajoutés en Phase 1 :

- `constants/TypesParticipant.js`, `constants/StatutsParticipant.js`,
  `constants/TypesProfilParticipant.js`, `constants/VisibilitesEvenement.js`,
  `constants/TypesActionParticipant.js` (réexportés par `constants/index.js`) ;
- `types/Participant.js`, `types/EvenementInteraction.js`,
  `types/Sollicitation.js`, `types/RelationParticipant.js`,
  `types/ActionParticipant.js`, `types/TraceInteraction.js`,
  `types/EtatInteraction.js`, `types/ResultatInteraction.js` (réexportés par
  `types/index.js`).

---

## 9. Ce que la Phase 1 ne fait PAS

Explicitement, cette phase se limite au modèle de données. Elle **ne** :

- ne modifie **aucun pipeline** (V1 reste identique) ;
- n'ajoute **aucun orchestrateur** multi-participants ;
- ne crée **aucune logique de perception** ;
- ne réalise **aucune migration** des anciennes structures ;
- ne crée **aucune couche de compatibilité** ;
- ne supprime ni ne remplace **aucun type ni aucune constante** existants ;
- ne traite **aucune compatibilité** avec une application externe (ex. Hadelas).

Les contrats V2 **coexistent** avec les structures V1 sans interférer avec elles.

---

## 10. Phase 2 — Pipeline sur participant unique

La Phase 2 fait fonctionner le **pipeline cognitif V1 existant** pour un
`Participant` unique de type `AGENT_AUTONOME`, sans changement de comportement.

```text
Pipeline V1 :
  personnage + message + état
        ↓ pipeline cognitif
  réponse + nouvel état

Pipeline V2 (Phase 2) :
  participant autonome + événement + état d'interaction
        ↓ adaptation du contexte (V2 → V1)
  MÊME pipeline cognitif (executeTurn)
        ↓ conversion (V1 → V2)
  action attribuée au participant + nouvel état d'interaction
```

### 10.1 Nouveau point d'entrée public

```js
import { traiterInteraction } from './core/interaction/index.js'

const resultat = await traiterInteraction(sollicitation, etatInteraction, {
  providerConfig,          // obligatoire : transmis au pipeline V1
  genererId,               // optionnel : générateur d'ids (défaut crypto.randomUUID)
  date,                    // optionnel : date ISO des structures produites
})
// resultat : ResultatInteraction
```

`traiterInteraction` :

1. valide la `Sollicitation` et l'`EtatInteraction` ;
2. sélectionne l'**unique** participant autonome ciblé (règle stricte) ;
3. vérifie son type, son statut et ses capacités indispensables ;
4. extrait les fiches depuis son profil `PERSONNAGE` ;
5. reconstruit les entrées V1 (`fiches`, `PlayerMessage`, `Etat`) ;
6. exécute le pipeline V1 canonique **`executeTurn`** — jamais dupliqué ;
7. convertit le `TurnResult` en `ResultatInteraction` (état immuable).

### 10.2 Traitement d'exactement un agent autonome

La sélection se fonde **uniquement** sur `sollicitation.participantIdsCibles`.
Parmi les participants ciblés existants, il doit y avoir **exactement un**
`AGENT_AUTONOME`. Aucune sélection « intelligente » n'est faite :

- 0 cible → `CIBLES_ABSENTES` ;
- une cible introuvable → `PARTICIPANT_INTROUVABLE` ;
- 0 agent autonome ciblé → `AUCUN_AGENT_AUTONOME` ;
- plusieurs agents autonomes ciblés → `PLUSIEURS_AGENTS_AUTONOMES`.

Conditions pour traiter le participant retenu :

```text
participant.type === AGENT_AUTONOME
ET participant.statut === ACTIF
ET participant.capacites.peutAnalyser      === true
ET participant.capacites.peutDecider       === true
ET participant.capacites.peutProduireAction === true
```

`capacites` = possibilités structurelles ; `statut` = restriction contextuelle.
Le statut ne peut jamais **accorder** une capacité absente ; il peut empêcher
son usage (un statut non `ACTIF` fait échouer la sollicitation).

Les capacités non indispensables sont traitées ainsi en Phase 2 :

- `peutMemoriser` : si `false`, la mémoire du participant **n'est pas persistée**
  (le pipeline la calcule mais le résultat conserve la mémoire précédente) ;
- `peutPercevoir` / `peutRessentir` : intrinsèquement exercées par les étapes
  Analyse et Ressenti du pipeline V1. En Phase 2, un `AGENT_AUTONOME` passant par
  le pipeline cognitif est supposé les posséder (limitation, cf. §10.7).

### 10.3 Forme minimale de `ProfilParticipant.donnees` (PERSONNAGE)

Le personnage est fourni **via le profil**, jamais imposé sur `Participant` :

```js
{
  type: TYPES_PROFIL_PARTICIPANT.PERSONNAGE,
  donnees: {
    fiches: {
      personnage, // fiche personnage V1 (dont capaciteMemoire)
      aventure,   // fiche aventure V1
      univers,    // fiche univers V1
      joueur,     // fiche joueur V1
      memoire,    // fiche mémoire V1
    },
  },
}
```

Les cinq fiches sont exactement celles attendues par le pipeline V1. Si l'une
manque → `DONNEES_PROFIL_INCOMPLETES`. L'adaptateur ne modifie jamais les fiches.

### 10.4 Adaptateur V2 → pipeline V1

`core/interaction/adaptateur.js` regroupe des fonctions **pures** de conversion,
sans aucune logique cognitive :

- `extraireFiches` / `fichesCompletes` : extraction/validation de `profil.donnees.fiches` ;
- `construireEtatV1(participantId, etatInteraction)` : reconstruit l'`Etat` V1
  isolé du participant (voir §10.5) ;
- `construirePlayerMessage(evenement, etatV1)` : `EvenementInteraction` → `PlayerMessage` ;
- `determinerTypeAction` / `construireActionParticipant` : `ReponseIA` → `ActionParticipant` ;
- `construireEvenementProduit`, `construireTraces`, `construireEtatPrive`.

L'adaptateur ne recalcule aucune décision et ne reproduit aucun module métier :
le pipeline cognitif reste la **source unique de vérité**.

### 10.5 Isolation de l'état et de la mémoire par `participantId`

L'`Etat` V1 du participant est reconstruit **uniquement** depuis ses données :

```text
Etat.memoireVecue ← etatInteraction.memoires[participantId]
Etat.historique   ← etatInteraction.etatsPrives[participantId].historique
Etat.tourCourant  ← etatInteraction.etatsPrives[participantId].tourCourant
Etat.sessionId    ← etatInteraction.metadata.sessionId   (identité canonique)
Etat.meta         ← etatInteraction.etatPartage.meta      (configuration canonique)
```

Le pipeline ne lit ni n'écrit jamais la mémoire d'un **autre** participant. Les
mises à jour sont **immuables** (l'`EtatInteraction` reçu n'est jamais muté) :

```js
const nouvelEtat = {
  ...etatInteraction,
  etatsPrives: { ...etatInteraction.etatsPrives, [participantId]: nouvelEtatPrive },
  memoires:    { ...etatInteraction.memoires,    [participantId]: nouvelleMemoire },
  historique:  [...etatInteraction.historique, evenementEntree, ...evenementsProduits],
}
```

**L'état canonique (`etatPartage`) n'est pas encore une perception individuelle.**
La Phase 2 en transmet seulement `meta` (configuration de session) au pipeline.
Ce n'est ni une perception complète, ni une connaissance partagée par tous les
participants : cette adaptation est isolée pour être remplacée en Phase 3.

### 10.6 Conversion de la sortie

Le `TurnResult` V1 devient un `ResultatInteraction` :

- **une** `ActionParticipant`, toujours dotée d'un `participantId` explicite.
  Type dérivé sans réinterpréter la décision : `PAROLE` si un dialogue est
  produit, sinon `ACTION` si une action l'est, sinon `SILENCE`. Le contenu
  conserve les deux champs V1 (`{ action, dialogue }`) ;
- `destinataireIds` dérive de `evenement.emetteurId` (aucune invention) ;
- `visibilite` hérite de celle de l'événement déclencheur (défaut `PUBLIQUE`) ;
- `evenementsProduits` : un `EvenementInteraction` de type `action_participant`
  représentant l'action émise (pour enrichir l'historique) ;
- `traces` : une `TraceInteraction` par étape cognitive (`analyse`, `influences`,
  `ressenti`, `decision`, `reponse`, `memoire`), recopiant les sorties déjà
  présentes dans le `TurnResult` (aucune logique de traçage ajoutée).

### 10.7 API V1, interface canonique et limites

- **L'API V1 (`executeTurn` / `runCycle`) reste disponible et inchangée.**
- Stratégie retenue (la plus minimale garantissant une parité exacte) :
  `executeTurn` demeure l'**entrée canonique du pipeline cognitif** ;
  `traiterInteraction` est la **nouvelle interface publique orientée
  participant**, posée par-dessus. Le pipeline n'est **pas dupliqué** : la V2
  appelle littéralement la même fonction que la V1, ce qui garantit la parité.
- Suppression future de la V1 : lorsque toutes les applications appelleront
  `traiterInteraction`, `executeTurn` pourra devenir une fonction interne au
  cœur, puis être retirée. Rien n'est supprimé durant cette phase.

Le système d'erreurs existant est réutilisé : `ErreurInteraction` **étend**
`ErreurValidation` (elle-même sous-classe d'`ErreurGabida`) et porte un `code`
stable (`CODES_ERREUR_INTERACTION`). Les erreurs du pipeline V1
(`ErreurValidation`, `ErreurPipeline`, `ErreurProvider`) sont propagées telles
quelles.

**Ce que la Phase 2 ne fait pas :** aucun orchestrateur multi-participants,
aucune perception individuelle, aucune croyance divergente, aucun ordre de
parole, aucune réaction en chaîne, aucun arbitrage de conflit, aucune boucle
multi-tours, aucune parallélisation, aucune intégration Hadelas, aucune
migration, aucune suppression de la V1. Elle prouve uniquement que **le pipeline
cognitif actuel peut fonctionner avec un `Participant` autonome unique comme
unité technique, sans changement de comportement** (démontré par le test de
parité V1/V2).

---

## 11. Phase 3 — Exécution cognitive multi-participants

La Phase 3 fait évoluer `traiterInteraction` pour traiter **plusieurs**
participants autonomes ciblés dans une même sollicitation. Chaque participant
exécute **indépendamment** le pipeline cognitif V1 (le même que la Phase 2), puis
les résultats sont agrégés en un seul `ResultatInteraction`.

```text
evenement
   ↓
participant A → executeTurn → action A + mémoire A
participant B → executeTurn → action B + mémoire B
participant C → executeTurn → action C + mémoire C
   ↓  (chacun réagit à l'ÉTAT INITIAL)
agrégation déterministe
   ↓
ResultatInteraction { actions[], evenementsProduits[], etat, traces[] }
```

### 11.1 Une seule fonction individuelle, réutilisée

Le traitement d'un participant est encapsulé dans `traiterParticipantUnique()`
(exportée). `traiterInteraction()` n'orchestre que la **répétition déterministe** :

```text
pour chaque participant percevant, dans l'ordre de participantIdsCibles :
    traiterParticipantUnique(...)   // construit le contexte V1, appelle executeTurn, convertit
puis :
    agregerResultats(...)
```

Le pipeline cognitif V1 (`executeTurn`) n'est **jamais dupliqué** et il n'existe
pas de variante `pipelineSolo`/`pipelineMulti`. Une seule cible se comporte
exactement comme en Phase 2 (parité conservée).

### 11.2 Sélection et validation des cibles

La sélection se fonde **uniquement** sur `sollicitation.participantIdsCibles`,
traité **dans l'ordre** (déterminisme). `resoudreCiblesAutonomes()` :

- rejette une liste vide → `CIBLES_ABSENTES` ;
- **rejette** les identifiants dupliqués → `CIBLES_DUPLIQUEES` (le refus est
  préféré à la déduplication silencieuse, pour ne pas masquer une entrée invalide) ;
- exige que chaque identifiant existe → sinon `PARTICIPANT_INTROUVABLE` ;
- valide **chaque** participant (`validerParticipant`) : type `AGENT_AUTONOME`
  (`PARTICIPANT_NON_AUTONOME`), statut `ACTIF` (`STATUT_INVALIDE`), profil
  `PERSONNAGE` (`PROFIL_ABSENT` / `PROFIL_NON_SUPPORTE`), 5 fiches
  (`DONNEES_PROFIL_INCOMPLETES`), capacités indispensables (`peutAnalyser`,
  `peutDecider`, `peutProduireAction` → `CAPACITE_INDISPENSABLE_ABSENTE`), et
  cohérence de l'état privé/mémoire (`ETAT_PRIVE_INCOHERENT`).

Aucun participant n'est ajouté automatiquement hors de `participantIdsCibles`, et
aucune sélection « intelligente » n'est effectuée.

### 11.3 Perception minimale (déterministe)

`peutPercevoirEvenement(participant, evenement)` filtre, parmi les cibles
validées, ceux qui traitent réellement l'événement (règle minimale, **pas** un
moteur de perception) :

| `visibilite` | Perçu par |
|---|---|
| `PUBLIQUE` (ou absente) | tout participant ciblé |
| `PRIVEE` | uniquement les participants de `destinataireIds` |
| `RESTREINTE` | règle minimale : **identique à `PRIVEE`** (limité à `destinataireIds`) tant qu'aucun ensemble de perception explicite n'existe |
| `SYSTEME` | aucun agent incarné (non transmis aux `AGENT_AUTONOME`) |

Rappel des contrats : `destinataireIds` = participants directement concernés ;
`visibilite` = qui peut potentiellement percevoir. **Percevoir n'implique pas
être destinataire** (un événement `PUBLIQUE` est perçu par une cible même
non-destinataire). Si **aucune** cible ne peut percevoir l'événement →
`EVENEMENT_NON_PERCEPTIBLE`.

### 11.4 Isolation cognitive stricte

Chaque participant reçoit **uniquement** son propre contexte, reconstruit à
partir de l'**état initial** de la sollicitation :

- son profil (`participant.profil.donnees.fiches`) ;
- son état privé (`etatsPrives[participantId]`) ;
- sa mémoire (`memoires[participantId]`) ;
- le même événement d'entrée (s'il lui est perceptible) ;
- une vue en lecture seule de l'état canonique (`etatPartage.meta`).

Un participant ne reçoit **jamais** la mémoire, l'état privé, le résultat cognitif
ni l'action d'un autre participant. **Tous réagissent à l'état initial**, non à un
état progressivement modifié par les participants précédents :

```text
✗  A modifie l'état → B analyse l'état modifié par A
✓  etatInitial ├── contexte A
              ├── contexte B      (puis agrégation des mises à jour à la fin)
              └── contexte C
```

Les réactions croisées appartiennent à une phase ultérieure.

### 11.5 Agrégation déterministe et immuable

`agregerResultats()` construit un nouvel `EtatInteraction` **sans jamais muter**
l'état initial :

- `memoires[participantId]` ← nouvelle mémoire du participant (uniquement si
  `peutMemoriser`) ; les autres mémoires restent inchangées ;
- `etatsPrives[participantId]` ← nouvel état privé du participant ; les autres
  restent inchangés ;
- `etatPartage`, `participants`, `relations` restent inchangés ;
- l'historique est enrichi de manière déterministe : `[...historique,
  evenementEntree, ...evenementsProduits]` — l'événement d'entrée est ajouté
  **une seule fois**, suivi des événements produits **dans l'ordre des cibles**.

Les tableaux `actions`, `evenementsProduits` et `traces` respectent l'ordre de
`participantIdsCibles`. Aucune perte de mise à jour lors de l'agrégation de
plusieurs mémoires. Chaque `ActionParticipant` porte son propre `id`, son
`participantId`, son type, son contenu, ses destinataires et sa visibilité :
**aucune action anonyme**. Un silence reste attribué à son participant
(`TYPES_ACTION_PARTICIPANT.SILENCE`). Identifiants et dates restent injectables
(`dependances.genererId` / `dependances.date`) pour un déterminisme total.

### 11.6 Atomicité (pas de résultat partiel)

Le traitement est **séquentiel** (déterminisme, maîtrise des appels au provider,
lisibilité des traces). Les fragments de tous les participants sont d'abord
collectés ; l'état agrégé n'est construit **qu'après** la réussite de **tous** les
traitements. Si le pipeline d'un participant échoue :

- `traiterInteraction` échoue **entièrement** ;
- aucun état partiellement mis à jour n'est retourné ;
- l'erreur est enveloppée dans `ErreurTraitementParticipant` (sous-classe
  d'`ErreurGabida`, **pas** une erreur de validation), qui précise le
  `participantId` concerné et **préserve la cause d'origine** (`error.cause`).

### 11.7 Ce que la Phase 3 ne fait pas encore

Gabida sait désormais produire **plusieurs décisions indépendantes**, mais ne
possède **pas encore** son orchestrateur narratif. Ne sont pas implémentés :
sélection intelligente des participants, ordre de parole / priorité entre
personnages, résolution de conflits, réaction d'un personnage à la réponse d'un
autre, boucles de conversation internes, second passage cognitif, perception
avancée ou croyances calculées, parallélisation, appel groupé au LLM, narrateur
automatique, intégration Hadelas, migration de contenus, suppression de la V1.
L'API V1 (`executeTurn` / `runCycle`) reste disponible et inchangée.

---

## 12. RFC-004 — Orchestrateur déterministe

RFC-004 extrait l'organisation d'un tour dans
`core/interaction/orchestrateur.js`. L'API publique ne change pas :
`traiterInteraction()` valide toujours les entrées et `executeTurn()` demeure
l'unique pipeline cognitif.

L'orchestrateur a une responsabilité unique : **organiser le tour**. Il :

- applique la règle de sélection déjà fournie par `traiterInteraction`, sans
  inventer de nouvelle validation ;
- conserve exactement l'ordre de `participantIdsCibles`, sans tri, priorité ou
  hasard ;
- rejette avant toute exécution un `participant.id` présent plusieurs fois avec
  l'erreur explicite `ErreurOrchestration` et le code stable
  `participant_duplique` ;
- pilote exactement un traitement par participant sélectionné ;
- transmet à chaque traitement le même état initial ;
- attend la réussite de tous les traitements avant d'appeler
  `agregerResultats()` ;
- agrège, dans l'ordre, actions, événements, mémoires, états privés et traces
  dans un unique `ResultatInteraction` immuable.

```text
traiterInteraction
  -> sélection existante
  -> ordre participantIdsCibles
  -> orchestrerTour
       -> executeTurn(participant A, état initial)
       -> executeTurn(participant B, état initial)
       -> executeTurn(participant C, état initial)
  -> agregerResultats
  -> ResultatInteraction
```

L'agrégation est une étape structurelle isolée. Elle ne commence qu'après la
fin de tous les traitements : si l'un échoue, aucun résultat partiel n'est
retourné et l'état initial reste intact.

### Ce que RFC-004 ne fait volontairement pas

L'orchestrateur ne contient aucune logique métier, décision IA ou analyse
narrative. Il ne modifie pas le pipeline cognitif et n'ajoute ni réaction en
chaîne, ni propagation d'événements, ni perception avancée, ni croyances, ni
second passage cognitif. Ces sujets restent hors périmètre et sont réservés aux
RFC-005, RFC-006 et RFC-007.

---

## 13. RFC-005 — Propagation déterministe des événements

RFC-005 ajoute, derrière l'option explicite `dependances.propagation.active`,
une file d'événements FIFO dans `core/interaction/propagation.js`. L'API publique
reste `traiterInteraction(sollicitation, etatInteraction, dependances)` et
`executeTurn()` demeure l'unique pipeline cognitif. Sans configuration de
propagation, ou avec `active: false`, le chemin RFC-004 est utilisé sans aucune
modification de son résultat.

### File FIFO et ordre déterministe

La file commence avec l'événement initial à la profondeur `0`. Chaque événement
est dépilé dans l'ordre FIFO, puis les participants qui le perçoivent sont
traités dans l'ordre exact de `sollicitation.participantIdsCibles`. Les événements
observables qu'ils produisent sont ajoutés à la fin de la file dans ce même
ordre. Il n'existe ni hasard, ni priorité narrative, ni parallélisation.

```text
file = [{ evenementInitial, profondeur: 0 }]
tant que file non vide :
  depiler le premier evenement
  selectionner les cibles qui le percoivent, sauf son emetteur
  orchestrerTour(...)
  agreger l'etape
  enfiler les evenements observables a profondeur + 1
```

Le perimetre reste strictement limite aux cibles initiales. Depuis RFC-006, la
selection reutilise `calculerPerception` pour chaque evenement canonique ;
aucune cible exterieure n'est ajoutee et l'emetteur ne reagit pas immediatement
a sa propre action.

### Isolation dans une étape et évolution entre étapes

Pour un même événement, `orchestrerTour()` transmet exactement le même état de
départ à tous les participants sélectionnés. Ils ne voient donc pas les réponses
des autres participants de cette étape. Une fois l'étape entièrement réussie,
son état agrégé devient l'état initial de l'événement FIFO suivant. La chaîne
évolue entre les événements sans casser l'isolation cognitive interne à un tour.

L'historique global est construit séparément des historiques intermédiaires de
RFC-004 : historique précédent, événement initial, puis événements produits dans
leur ordre réel. Chaque identifiant d'événement n'y apparaît qu'une fois.

### Événements propagables et dédoublonnage

`estEvenementPropagable(action, evenement)` est une fonction pure. Elle accepte
uniquement les actions externes observables :

- `TYPES_ACTION_PARTICIPANT.PAROLE` ;
- `TYPES_ACTION_PARTICIPANT.ACTION`.

Les silences et réactions internes ne sont pas propagés. L'association utilise
strictement le même index dans `actions` et `evenementsProduits`, sans analyse
LLM. Un ensemble local `evenementIdsTraites` empêche tout traitement répété : un
doublon est ignoré et tracé sans lancer de pipeline. Un événement sans identifiant
ou une association action/événement incohérente produit une
`ErreurPropagation`, sous-classe d'`ErreurValidation`, avec un code stable.

### Limites de sécurité et atomicité

Les valeurs par défaut sont :

```js
propagation: {
  active: false,
  nombreMaximumEvenements: 20,
  profondeurMaximum: 5,
}
```

Atteindre la profondeur maximale empêche seulement d'enfiler les descendants
suivants. Atteindre le nombre maximal arrête la boucle avant de dépiler un
événement supplémentaire. Ces deux limites sont des fins normales : elles
conservent les résultats déjà validés et ajoutent respectivement les traces
`propagation_profondeur_maximale` et `propagation_nombre_maximal`.

À l'inverse, une erreur de pipeline, de participant, d'événement ou de cohérence
d'état invalide atomiquement toute l'interaction. Aucun `ResultatInteraction`
partiel n'est retourné, la cause reste préservée par la hiérarchie existante et
l'état fourni en entrée n'est jamais muté.

### Ce que RFC-005 ne fait volontairement pas

RFC-005 n'ajoute aucune perception avancée, croyance divergente, priorité de
parole, interruption, résolution de conflit, sélection narrative intelligente,
extension autonome du périmètre, narrateur ou intégration Hadelas. Ces capacités,
notamment la perception enrichie, restent réservées à RFC-006 et aux RFC
ultérieures.
# RFC-006 — Perception individuelle deterministe

## Role et separation canonique

RFC-006 ajoute une etape pure entre l'evenement canonique et le pipeline
cognitif individuel. L'etat partage reste la verite objective de l'interaction,
l'evenement canonique reste le fait historique unique, et une
`PerceptionParticipant` est seulement la representation partielle accessible a
un participant. Le moteur ne mute jamais l'evenement canonique et ne cree pas
un nouvel evenement historique pour chaque perception.

Le contrat `PerceptionParticipant` contient `participantId`, `evenementId`,
`perceptible`, `contenuPercu`, `canaux`, `precision`, `raisons` et `metadata`.
Les canaux officiels sont `VISUEL`, `AUDITIF`, `DIRECT` et `SYSTEME`. Les
precisions sont `COMPLETE`, `PARTIELLE` et `AUCUNE`.

## Ordre deterministe des regles

`calculerPerception()` applique toujours les regles dans cet ordre :

1. la capacite explicite `peutPercevoir === true` est requise ;
2. un participant `INACTIF` ne percoit rien ;
3. un evenement `SYSTEME` exige une autorisation nominative ;
4. une exclusion explicite refuse la perception ;
5. une liste d'autorisation non vide limite la perception a ses membres ;
6. un evenement `PUBLIQUE` est perceptible sans autre restriction ;
7. un evenement `PRIVEE` est reserve a ses destinataires, sauf autorisation
   explicite plus precise ;
8. un evenement `RESTREINTE` utilise la liste d'autorisation et, en son
   absence, conserve la regle RFC-005 fondee sur `destinataireIds` ;
9. la perception de l'emetteur reste possible, tandis que RFC-005 l'exclut
   separement des reactions immediates.

Une absence normale de perception produit `perceptible: false` et
`precision: AUCUNE` ; ce n'est pas une exception. Une structure invalide leve
`ErreurPerception`, sous-classe d'`ErreurValidation`, avant toute execution.

## Contenu individuel et integration

Le contenu suit la priorite `contenuParParticipant[participantId]`, puis
`contenuParDefaut`, puis `evenement.contenu`. Une adaptation explicite est
`PARTIELLE` par defaut ; le contenu canonique intact est `COMPLETE`.
`construireEvenementPercu()` copie l'evenement pour le pipeline et inscrit dans
ses metadonnees le participant, l'identifiant canonique, la precision et les
canaux. `executeTurn()` reste unique et inchange.

`traiterInteraction()` evalue toutes les perceptions avant la premiere
execution, selectionne les seules perceptions acceptees, puis remet a chaque
participant sa propre copie percue. La propagation RFC-005 repete exactement
ce calcul pour chaque evenement canonique depile. La file FIFO et l'historique
global ne contiennent que les evenements canoniques ; les copies percues n'y
entrent jamais. L'exclusion de l'emetteur intervient apres la perception.

## Etat prive, traces et compatibilite

Chaque participant effectivement traite recoit dans son propre etat prive une
entree immutable sous le tableau optionnel `perceptions`. Elle contient
`evenementId`, `perceptible`, `contenuPercu`, `canaux`, `precision` et `date`.
Elle n'est ni un souvenir, ni une connaissance, ni une croyance, et n'est
jamais copiee dans l'etat prive d'un autre participant.

Les traces stables sont `perception_evaluee`, `perception_acceptee`,
`perception_refusee`, `perception_partielle` et `perception_complete`. Elles
identifient le participant et l'evenement ainsi que la decision, la precision,
les raisons et les canaux, sans recopier le contenu sensible complet.

Sans `metadata.perception`, les regles de visibilite PUBLIQUE, PRIVEE,
RESTREINTE et SYSTEME reproduisent RFC-005 et les sorties narratives restent
identiques. Le champ prive `perceptions` demeure optionnel pour les anciens
etats. Une erreur structurelle pendant l'evaluation annule toute l'interaction :
aucun pipeline, resultat partiel ou etat partiellement mis a jour n'est produit.

## Limites volontaires

RFC-006 n'ajoute ni espace, distance, ligne de vue, acoustique, probabilite,
hallucination, interpretation subjective, mensonge, connaissance durable,
croyance, contradiction, oubli, priorite narrative ou integration Hadelas.
Ces responsabilites appartiennent aux RFC ulterieures.
# RFC-007 — Connaissances et croyances individuelles

## Verite, perception et etat epistemique

RFC-007 distingue quatre plans sans les confondre : la verite canonique vit
dans `etatPartage` et les evenements canoniques ; la perception est une
information ponctuellement accessible ; une connaissance est un fait que
Gabida considere explicitement etabli pour un participant ; une croyance est
une proposition tenue pour vraie sans garantie canonique. Le moteur ne compare
pas automatiquement ces faits au monde et ne demande pas au LLM de determiner
la verite.

L'etat prive optionnel `epistemique` contient deux historiques de
`FaitEpistemique`, `connaissances` et `croyances`. Chaque fait porte son id, son
participant, sa proposition, son type, son statut, sa confiance, ses
provenances, ses sources et ses dates. Une `ProvenanceEpistemique` qualifie la
source (`PERCEPTION_DIRECTE`, `COMMUNICATION`, `INFERENCE_EXPLICITE`, `SYSTEME`
ou `IMPORT_INITIAL`) sans recopier une proposition sensible dans les traces.

## Entrees explicites et creation

Seules les propositions de `evenement.metadata.epistemique.propositions` sont
traitees. Le contenu libre de l'evenement n'est jamais interprete. Pour chaque
participant qui a effectivement percu l'evenement, `participantsInformes`
limite eventuellement la destination epistemique. Un type explicite valide est
respecte ; sinon une provenance `SYSTEME` cree une connaissance et toute autre
provenance cree une croyance. Une connaissance explicite n'est pas une preuve
de coherence avec `etatPartage`, et aucune croyance n'est promue
automatiquement.

La confiance explicite doit etre comprise entre 0 et 1. Sans valeur explicite,
une perception `COMPLETE` donne 1, une perception `PARTIELLE` donne 0.6 et une
perception `AUCUNE` ne cree aucun fait. Aucun seuil de verite, moyenne ou calcul
probabiliste n'est applique.

## Identite, mise a jour et historique

L'identite utilise, dans l'ordre, `proposition.id`, l'id explicite de l'entree,
puis `genererIdEpistemique()`. Aucune serialisation profonde de la proposition
ne sert d'identifiant metier. Pour un fait actif du meme id et du meme type, la
nouvelle provenance est ajoutee immuablement, les ids de sources sont
dedupliques, la date est actualisee et la confiance devient
`max(confianceExistante, confianceEntrante)`. Il n'existe donc aucun doublon
actif cree par une simple mise a jour.

Une entree peut designer `metadata.contreditFaitId` ou
`metadata.remplaceFaitId`. Le fait actif cible est conserve et marque
respectivement `CONTREDIT` ou `REMPLACE`, puis le nouveau fait actif est cree.
Une cible absente est une erreur de validation atomique. Aucune contradiction
semantique n'est detectee automatiquement.

## Integration avec RFC-005 et RFC-006

Apres la perception et avant `executeTurn()`, le moteur construit une nouvelle
version du seul etat prive concerne et y applique la mise a jour epistemique.
Le contexte V1 expose alors `epistemique` au pipeline sans modifier la signature
ni l'unicite de `executeTurn()`. Un participant ne recoit jamais l'etat
epistemique d'un autre participant.

Dans une etape, toutes les mises a jour sont calculees depuis le meme etat
initial. Apres aggregation, l'etat de l'etape N devient l'entree de N+1 dans la
propagation. La FIFO et l'historique global restent exclusivement composes
d'evenements canoniques : aucun fait epistemique ni copie percue n'y est ajoute.

Les etats initiaux peuvent deja contenir des faits valides ; ils sont controles
sans migration ni reecriture. Sans `metadata.epistemique`, aucun champ, fait ou
trace epistemique n'est cree et le comportement RFC-006 reste inchange.

## Traces, erreurs et limites

Les etapes stables couvrent proposition ignoree, fait cree ou mis a jour, fait
contredit ou remplace, absence de perception et absence de proposition.
`ErreurEpistemique` etend `ErreurValidation` pour toute structure, type, statut,
provenance, confiance, reference ou generation d'id invalide. Toute erreur est
levee avant le premier pipeline de l'etape et preserve l'etat d'entree.

RFC-007 n'ajoute ni extraction depuis le texte, raisonnement logique, inference
LLM, detection de mensonge, resolution automatique de contradiction, oubli,
decroissance de confiance, fusion probabiliste, partage automatique, theorie
de l'esprit ou integration Hadelas.
