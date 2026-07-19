# Architecture Gabida V2 — Modèle multi-participants

> **Statut : Phase 2 — pipeline sur participant unique.**
> La Phase 1 a introduit les *contrats de données* (§1–9). La Phase 2 (§10)
> exécute le pipeline cognitif V1 existant pour **un seul** participant autonome,
> sans le dupliquer et sans changer le comportement. Aucun orchestrateur
> multi-participants ni moteur de perception n'est ajouté à ce stade.

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
