# Corpus métier du dialogue

Ce dossier contient les scénarios de référence utilisés pour évaluer la qualité
de reconstruction d'un `EtatDialogue`. Le corpus décrit les résultats métier
attendus sans exécuter le moteur de génération et sans appeler de service réseau.

Chaque scénario fournit un `historique` conforme aux contrats existants et un
`etatAttendu`. Il indique également s'il doit passer la validation contextuelle.
Les cas négatifs expliquent explicitement l'invariant qu'ils enfreignent.

Pour ajouter un scénario :

1. ajouter des événements complets et chronologiquement ordonnés ;
2. définir l'état attendu avec toutes ses collections ;
3. relier chaque projection à ses événements sources ;
4. ajouter le scénario à `scenariosDialogue` ;
5. vérifier le corpus avec le test dédié.

Ce corpus constitue une référence métier stable. Une évolution du prompt pourra
être comparée à ces attentes sans modifier les résultats de référence.
