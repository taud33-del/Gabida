# Contrat d'architecture — Moteur Gabida

---

## 1. Mission du moteur

**Responsabilité unique :**
Transformer un message du joueur en une réponse narrative cohérente, en orchestrant une suite de modules spécialisés, indépendants et déterministes.

**Question :**
> "Comment produire une réponse narrative cohérente sans qu'aucun module ne dépasse sa responsabilité ?"

Le moteur Gabida n'est pas un LLM.
Le moteur n'est pas un chatbot.
Le moteur est un **orchestrateur**.

Chaque décision est prise par un module spécialisé.
Chaque module répond à une seule question.
Aucun module ne possède une vision globale du système.
Seul `core/` orchestre l'ensemble.

---

## 2. Les grands principes

Le moteur repose sur cinq principes fondamentaux.

### Principe 1 — Responsabilité unique

Chaque module répond à une seule question. Jamais deux modules ne répondent à la même.

| Module | Question |
|---|---|
| `analyse/` | Que veut dire le joueur ? |
| `decision/` | Que décide le personnage ? |
| `prompt/` | Comment exprimer cette décision ? |
| `api/` | Comment obtenir la réponse du provider IA ? |
| `memoire/` | Que faut-il conserver ? |

### Principe 2 — Déterminisme

À entrée identique, la sortie est toujours identique. Tous les modules métier sont déterministes.

Les seules exceptions sont les modules ayant volontairement des effets de bord :
- `api/`
- `sauvegarde/`

### Principe 3 — Faible couplage

Un module ne connaît jamais l'implémentation interne d'un autre. Il connaît uniquement :
- son interface publique
- ses types
- ses constantes officielles

Jamais sa logique interne.

### Principe 4 — Forte cohésion

Toutes les fonctions d'un module répondent à la même responsabilité. Si une fonction répond à une autre question, elle appartient à un autre module.

### Principe 5 — Immutabilité

Les données reçues sont toujours considérées comme immuables. Les modules retournent toujours de nouveaux objets. Aucune mutation d'entrée n'est autorisée.

---

## 3. Cycle officiel d'un tour

Le traitement complet d'un tour est strictement séquentiel.

```
Message Joueur
      ↓
  analyse/
      ↓
 influences/
      ↓
  ressenti/
      ↓
  decision/
      ↓
   prompt/
      ↓
     api/
      ↓
  memoire/
      ↓
sauvegarde/
      ↓
Etat mis à jour
      ↓
  Tour suivant
```

Aucun module ne peut modifier cet ordre.

---

## 4. Cycle de vie d'une session

Deux modes d'entrée sont possibles.

### Nouvelle partie

```
Créer Etat
      ↓
Créer Session
      ↓
Boucle des tours
      ↓
Sauvegarde éventuelle
      ↓
     Fin
```

### Chargement

```
Lire sauvegarde
      ↓
Vérifier version
      ↓
Migrer si nécessaire
      ↓
   Valider
      ↓
Restaurer Etat
      ↓
Boucle des tours
```

---

## 5. Frontières officielles

Le graphe des dépendances est orienté.

```
   analyse
      ↓
 influences
      ↓
  ressenti
      ↓
  decision
      ↓
   prompt
      ↓
     api
      ↓
  memoire
      ↓
sauvegarde
```

Toute dépendance inverse est **interdite**.

Exemples interdits :
- `decision → analyse`
- `prompt → decision` (hors types)
- `api → memoire`
- `memoire → prompt`
- `sauvegarde → api`

---

## 6. Propriétaires officiels des données

Chaque type possède un propriétaire unique. Aucun autre module ne peut reconstruire ou modifier ces types.

| Type | Propriétaire |
|---|---|
| `Evenement` | `analyse/` |
| `FiltreRelationnel` | `influences/` |
| `Ressenti` | `ressenti/` |
| `Decision` | `decision/` |
| `Prompt` | `prompt/` |
| `ReponseIA` | `api/` |
| `Souvenir` | `memoire/` |
| `EtatSauvegarde` | `sauvegarde/` |

---

## 7. Flux des données

Les données ne reviennent jamais en arrière. Chaque donnée est produite une seule fois.

```
    Message
       ↓
  Evenement
       ↓
  Influences
       ↓
   Ressenti
       ↓
  Decision
       ↓
    Prompt
       ↓
Réponse IA
       ↓
  Souvenir
       ↓
Sauvegarde
```

---

## 8. Effets de bord

Les effets de bord sont centralisés.

**Modules purs :**
- `analyse/`
- `influences/`
- `ressenti/`
- `decision/`
- `prompt/`
- `core/`

**Modules impurs :**

`api/`
- appels HTTP
- appels provider IA

`sauvegarde/`
- lecture
- écriture
- système de fichiers

Aucun autre module ne possède d'effet de bord.

---

## 9. Invariants absolus

Les règles suivantes ne doivent jamais être violées.

**Invariant 1**
Le joueur ne communique jamais directement avec un provider IA.
```
Joueur → Gabida → Provider → Gabida → Joueur
```

**Invariant 2**
Une donnée calculable n'est jamais sauvegardée.

**Invariant 3**
Une donnée possède un seul propriétaire.

**Invariant 4**
Un module ne modifie jamais les données d'un autre.

**Invariant 5**
Les modules communiquent uniquement via leurs interfaces publiques.

**Invariant 6**
Les dépendances suivent toujours le pipeline officiel.

**Invariant 7**
Chaque module répond à une seule question.

**Invariant 8**
Toute constante métier provient de `constants/`.

**Invariant 9**
Tous les types officiels proviennent de `types/`.

**Invariant 10**
Les sous-fonctions internes reçoivent uniquement leur contexte privé (`ctx`).

---

## 10. Architecture interne d'un module

Tous les modules suivent le **Pattern Module** officiel.

```
Fonctions publiques
        ↓
Construction du contexte
        ↓
Sous-fonctions indépendantes
        ↓
Assemblage final
        ↓
Retour du type officiel
```

Ce pattern est **obligatoire** pour tous les nouveaux modules.

---

## 11. Points d'extension officiels

Le moteur est conçu pour évoluer sans casser son architecture.

Extensions prévues :
- nouveaux providers IA
- nouveaux formats de sauvegarde
- nouveaux adaptateurs de stockage
- nouvelles migrations
- nouveaux moteurs de génération

Les extensions doivent respecter les interfaces officielles.

---

## 12. Les Axiomes Gabida

Les axiomes constituent les règles architecturales permanentes. Chaque axiome documente :
- son objectif
- les modules concernés
- les règles imposées
- les raisons de son existence

Les axiomes ont priorité sur toute implémentation.

**En cas de conflit :**
```
Architecture > Axiomes > Code
```

---

## 13. Convention de développement

Tout nouveau module doit respecter :

- ✓ une responsabilité unique
- ✓ une interface publique stable
- ✓ un contexte privé immutable
- ✓ des fonctions internes pures
- ✓ un seul point d'assemblage
- ✓ aucun effet de bord non documenté
- ✓ aucun import métier interdit
- ✓ aucune chaîne magique
- ✓ types officiels uniquement
- ✓ constantes officielles uniquement
- ✓ tests unitaires
- ✓ documentation avant implémentation

---

## 14. Vision du moteur

Gabida n'est pas un moteur de dialogue.

**Gabida est un système d'exploitation narratif.**

Chaque module représente un organe spécialisé. Le moteur orchestre ces organes sans jamais remplacer leur responsabilité.

L'objectif est de produire des personnages cohérents, explicables, testables et évolutifs, tout en conservant une architecture stable sur le long terme.
