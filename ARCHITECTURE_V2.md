# Architecture Gabida V2 — Modèle multi-participants

> **Statut : Phase 1 — modèle de données uniquement.**
> Ce document décrit les *contrats de données* introduits en Phase 1. Aucun
> comportement, pipeline, orchestrateur ni logique de perception n'est ajouté à
> ce stade.

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

- **État partagé** (`etatPartage`) : le monde commun perçu par tous les
  participants.
- **États privés** (`etatsPrives`) : indexés par `participantId`, propres à
  chaque participant et non partagés.
- **Mémoire** (`memoires`) : indexée **par participant** — chaque participant a
  sa propre mémoire, jamais une mémoire globale.
- **Relations** (`relations`) : liens **directionnels** entre participants
  (`sourceId` → `cibleId`). Une relation réciproque = deux relations distinctes.

L'`historique` conserve la suite ordonnée des `EvenementInteraction`.

---

## 6. Cohérence avec l'architecture existante

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

## 7. Ce que la Phase 1 ne fait PAS

Explicitement, cette phase se limite au modèle de données. Elle **ne** :

- ne modifie **aucun pipeline** (V1 reste identique) ;
- n'ajoute **aucun orchestrateur** multi-participants ;
- ne crée **aucune logique de perception** ;
- ne réalise **aucune migration** des anciennes structures ;
- ne crée **aucune couche de compatibilité** ;
- ne supprime ni ne remplace **aucun type ni aucune constante** existants ;
- ne traite **aucune compatibilité** avec une application externe (ex. Hadelas).

Les contrats V2 **coexistent** avec les structures V1 sans interférer avec elles.
