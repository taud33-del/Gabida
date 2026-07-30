const DATE = Object.freeze({
  1: '2026-01-10T09:00:00.000Z',
  2: '2026-01-10T09:01:00.000Z',
  3: '2026-01-10T09:02:00.000Z',
  4: '2026-01-10T09:03:00.000Z',
  5: '2026-01-10T09:04:00.000Z',
  6: '2026-01-10T09:05:00.000Z',
  7: '2026-01-10T09:06:00.000Z',
  8: '2026-01-10T09:07:00.000Z',
  9: '2026-01-10T09:08:00.000Z',
  10: '2026-01-10T09:09:00.000Z',
  11: '2026-01-10T09:10:00.000Z',
  12: '2026-01-10T09:11:00.000Z',
  13: '2026-01-10T09:12:00.000Z',
  14: '2026-01-10T09:13:00.000Z',
  15: '2026-01-10T09:14:00.000Z',
})

function creerEvenement({
  id,
  date,
  contenu,
  emetteurId = 'joueur',
  destinataireIds = ['aldric'],
  referencesDialogue = [],
}) {
  return {
    id,
    type: 'message_dialogue',
    emetteurId,
    destinataireIds,
    contenu: { texte: contenu },
    visibilite: 'publique',
    date,
    metadata: {},
    referencesDialogue,
  }
}

function creerEtat({
  evenementSourceIds,
  dateMiseAJour,
  faits = [],
  objectifs = [],
  questionsOuvertes = [],
  decisions = [],
  contraintes = [],
  reponses = [],
  faitsAConfirmer = [],
}) {
  return {
    faits,
    objectifs,
    questionsOuvertes,
    decisions,
    contraintes,
    reponses,
    faitsAConfirmer,
    evenementSourceIds,
    dateMiseAJour,
  }
}

export const conversationSimple = {
  nom: 'conversation simple',
  valide: true,
  historique: [
    creerEvenement({
      id: 'simple-1',
      date: DATE[1],
      contenu: 'Peux-tu me dire quand ouvre la bibliothèque ?',
      referencesDialogue: [
        { categorie: 'question', id: 'question-horaires' },
        { categorie: 'objectif', id: 'objectif-connaitre-horaires' },
      ],
    }),
    creerEvenement({
      id: 'simple-2',
      date: DATE[2],
      emetteurId: 'aldric',
      destinataireIds: ['joueur'],
      contenu: 'La bibliothèque ouvre à neuf heures.',
      referencesDialogue: [
        { categorie: 'reponse', id: 'reponse-horaires' },
        { categorie: 'objectif', id: 'objectif-connaitre-horaires' },
      ],
    }),
  ],
  etatAttendu: creerEtat({
    objectifs: [{
      id: 'objectif-connaitre-horaires',
      contenu: 'Connaître les horaires de la bibliothèque.',
      participantIds: ['joueur', 'aldric'],
      evenementSourceIds: ['simple-1', 'simple-2'],
      dateMiseAJour: DATE[2],
    }],
    reponses: [{
      id: 'reponse-horaires',
      questionId: 'question-horaires',
      contenu: 'La bibliothèque ouvre à neuf heures.',
      auteurId: 'aldric',
      evenementSourceIds: ['simple-2'],
      dateReponse: DATE[2],
    }],
    evenementSourceIds: ['simple-1', 'simple-2'],
    dateMiseAJour: DATE[2],
  }),
}

export const objectifAtteint = {
  nom: 'objectif atteint',
  valide: true,
  historique: [
    creerEvenement({
      id: 'lieu-1',
      date: DATE[1],
      contenu: 'Je cherche une auberge calme pour cette nuit.',
      referencesDialogue: [
        { categorie: 'question', id: 'question-auberge' },
        { categorie: 'objectif', id: 'objectif-trouver-auberge' },
      ],
    }),
    creerEvenement({
      id: 'lieu-2',
      date: DATE[2],
      emetteurId: 'aldric',
      destinataireIds: ['joueur'],
      contenu: 'L’Auberge du Pont se trouve près de la porte nord.',
      referencesDialogue: [
        { categorie: 'fait', id: 'fait-localisation-auberge' },
        { categorie: 'reponse', id: 'reponse-auberge' },
      ],
    }),
    creerEvenement({
      id: 'lieu-3',
      date: DATE[3],
      contenu: 'Parfait, je décide d’aller à l’Auberge du Pont.',
      referencesDialogue: [
        { categorie: 'decision', id: 'decision-auberge' },
      ],
    }),
  ],
  etatAttendu: creerEtat({
    faits: [{
      id: 'fait-localisation-auberge',
      contenu: 'L’Auberge du Pont se trouve près de la porte nord.',
      evenementSourceIds: ['lieu-2'],
      dateMiseAJour: DATE[2],
    }],
    decisions: [{
      id: 'decision-auberge',
      contenu: 'Le joueur ira à l’Auberge du Pont.',
      participantIds: ['joueur'],
      evenementSourceIds: ['lieu-3'],
      dateDecision: DATE[3],
    }],
    reponses: [{
      id: 'reponse-auberge',
      questionId: 'question-auberge',
      contenu: 'L’Auberge du Pont est près de la porte nord.',
      auteurId: 'aldric',
      evenementSourceIds: ['lieu-2'],
      dateReponse: DATE[2],
    }],
    evenementSourceIds: ['lieu-1', 'lieu-2', 'lieu-3'],
    dateMiseAJour: DATE[3],
  }),
}

export const objectifAbandonne = {
  nom: 'objectif abandonné',
  valide: true,
  historique: [
    creerEvenement({
      id: 'choix-1',
      date: DATE[1],
      contenu: 'Je veux rejoindre le château.',
      referencesDialogue: [
        { categorie: 'objectif', id: 'objectif-chateau' },
      ],
    }),
    creerEvenement({
      id: 'choix-2',
      date: DATE[2],
      contenu: 'Finalement, je renonce au château.',
      referencesDialogue: [
        { categorie: 'objectif', id: 'objectif-chateau' },
      ],
    }),
    creerEvenement({
      id: 'choix-3',
      date: DATE[3],
      contenu: 'Je préfère chercher le marché.',
      referencesDialogue: [
        { categorie: 'objectif', id: 'objectif-marche' },
      ],
    }),
  ],
  etatAttendu: creerEtat({
    objectifs: [{
      id: 'objectif-marche',
      contenu: 'Trouver le marché.',
      participantIds: ['joueur'],
      evenementSourceIds: ['choix-3'],
      dateMiseAJour: DATE[3],
    }],
    evenementSourceIds: ['choix-1', 'choix-2', 'choix-3'],
    dateMiseAJour: DATE[3],
  }),
}

export const plusieursFaits = {
  nom: 'plusieurs faits personnels',
  valide: true,
  historique: [
    creerEvenement({
      id: 'faits-1',
      date: DATE[1],
      contenu: 'Je m’appelle Léa.',
      referencesDialogue: [{ categorie: 'fait', id: 'fait-nom' }],
    }),
    creerEvenement({
      id: 'faits-2',
      date: DATE[2],
      contenu: 'Je viens de Valombre.',
      referencesDialogue: [{ categorie: 'fait', id: 'fait-origine' }],
    }),
    creerEvenement({
      id: 'faits-3',
      date: DATE[3],
      contenu: 'Je suis herboriste.',
      referencesDialogue: [{ categorie: 'fait', id: 'fait-metier' }],
    }),
  ],
  etatAttendu: creerEtat({
    faits: [
      {
        id: 'fait-nom',
        contenu: 'Le joueur s’appelle Léa.',
        evenementSourceIds: ['faits-1'],
        dateMiseAJour: DATE[1],
      },
      {
        id: 'fait-origine',
        contenu: 'Léa vient de Valombre.',
        evenementSourceIds: ['faits-2'],
        dateMiseAJour: DATE[2],
      },
      {
        id: 'fait-metier',
        contenu: 'Léa est herboriste.',
        evenementSourceIds: ['faits-3'],
        dateMiseAJour: DATE[3],
      },
    ],
    evenementSourceIds: ['faits-1', 'faits-2', 'faits-3'],
    dateMiseAJour: DATE[3],
  }),
}

export const plusieursPersonnages = {
  nom: 'plusieurs personnages',
  valide: true,
  historique: [
    creerEvenement({
      id: 'groupe-1',
      date: DATE[1],
      contenu: 'Connaissez-vous un passage sûr vers la vallée ?',
      destinataireIds: ['aldric', 'mira'],
      referencesDialogue: [{ categorie: 'question', id: 'question-passage' }],
    }),
    creerEvenement({
      id: 'groupe-2',
      date: DATE[2],
      emetteurId: 'aldric',
      destinataireIds: ['joueur', 'mira'],
      contenu: 'Le pont de pierre est praticable.',
      referencesDialogue: [
        { categorie: 'fait', id: 'fait-pont-praticable' },
        { categorie: 'reponse', id: 'reponse-aldric-passage' },
      ],
    }),
    creerEvenement({
      id: 'groupe-3',
      date: DATE[3],
      emetteurId: 'mira',
      destinataireIds: ['joueur', 'aldric'],
      contenu: 'J’éviterais toutefois le sentier de l’est.',
      referencesDialogue: [
        { categorie: 'contrainte', id: 'contrainte-sentier-est' },
        { categorie: 'reponse', id: 'reponse-mira-passage' },
      ],
    }),
  ],
  etatAttendu: creerEtat({
    faits: [{
      id: 'fait-pont-praticable',
      contenu: 'Le pont de pierre est praticable.',
      evenementSourceIds: ['groupe-2'],
      dateMiseAJour: DATE[2],
    }],
    contraintes: [{
      id: 'contrainte-sentier-est',
      contenu: 'Éviter le sentier de l’est.',
      participantIds: ['joueur', 'aldric', 'mira'],
      evenementSourceIds: ['groupe-3'],
      dateMiseAJour: DATE[3],
    }],
    reponses: [
      {
        id: 'reponse-aldric-passage',
        questionId: 'question-passage',
        contenu: 'Le pont de pierre est praticable.',
        auteurId: 'aldric',
        evenementSourceIds: ['groupe-2'],
        dateReponse: DATE[2],
      },
      {
        id: 'reponse-mira-passage',
        questionId: 'question-passage',
        contenu: 'Le sentier de l’est devrait être évité.',
        auteurId: 'mira',
        evenementSourceIds: ['groupe-3'],
        dateReponse: DATE[3],
      },
    ],
    evenementSourceIds: ['groupe-1', 'groupe-2', 'groupe-3'],
    dateMiseAJour: DATE[3],
  }),
}

const historiqueLong = [
  ['long-1', 1, 'Je dois atteindre Port-Serein.', 'objectif', 'objectif-port'],
  ['long-2', 2, 'Je voyage avec un cheval gris.', 'fait', 'fait-cheval'],
  ['long-3', 3, 'La route nord est inondée.', 'fait', 'fait-route-nord'],
  ['long-4', 4, 'Je vais chercher un autre passage.', 'objectif', 'objectif-passage'],
  ['long-5', 5, 'Le bac traverse encore la rivière.', 'fait', 'fait-bac'],
  ['long-6', 6, 'Je décide de prendre le bac.', 'decision', 'decision-bac'],
  ['long-7', 7, 'Le passage coûte trois pièces.', 'fait', 'fait-prix-bac'],
  ['long-8', 8, 'J’accepte de payer trois pièces.', 'decision', 'decision-payer'],
  ['long-9', 9, 'Le départ aura lieu à midi.', 'fait', 'fait-depart'],
  ['long-10', 10, 'Je dois acheter des provisions.', 'objectif', 'objectif-provisions'],
  ['long-11', 11, 'Le marché est ouvert.', 'fait', 'fait-marche-ouvert'],
  ['long-12', 12, 'J’achète du pain.', 'decision', 'decision-pain'],
  ['long-13', 13, 'Le cheval peut monter sur le bac.', 'fait', 'fait-cheval-bac'],
  ['long-14', 14, 'Les provisions sont prêtes.', 'fait', 'fait-provisions-pretes'],
  ['long-15', 15, 'Je suis prêt à partir pour Port-Serein.', 'objectif', 'objectif-port'],
].map(([id, ordre, contenu, categorie, referenceId]) => creerEvenement({
  id,
  date: DATE[ordre],
  contenu,
  referencesDialogue: [{ categorie, id: referenceId }],
}))

export const historiqueLongScenario = {
  nom: 'historique long',
  valide: true,
  historique: historiqueLong,
  etatAttendu: creerEtat({
    faits: [
      {
        id: 'fait-cheval',
        contenu: 'Le joueur voyage avec un cheval gris.',
        evenementSourceIds: ['long-2'],
        dateMiseAJour: DATE[2],
      },
      {
        id: 'fait-route-nord',
        contenu: 'La route nord est inondée.',
        evenementSourceIds: ['long-3'],
        dateMiseAJour: DATE[3],
      },
      {
        id: 'fait-bac',
        contenu: 'Le bac traverse encore la rivière.',
        evenementSourceIds: ['long-5'],
        dateMiseAJour: DATE[5],
      },
      {
        id: 'fait-prix-bac',
        contenu: 'Le passage en bac coûte trois pièces.',
        evenementSourceIds: ['long-7'],
        dateMiseAJour: DATE[7],
      },
      {
        id: 'fait-depart',
        contenu: 'Le bac part à midi.',
        evenementSourceIds: ['long-9'],
        dateMiseAJour: DATE[9],
      },
      {
        id: 'fait-cheval-bac',
        contenu: 'Le cheval peut monter sur le bac.',
        evenementSourceIds: ['long-13'],
        dateMiseAJour: DATE[13],
      },
      {
        id: 'fait-provisions-pretes',
        contenu: 'Les provisions sont prêtes.',
        evenementSourceIds: ['long-14'],
        dateMiseAJour: DATE[14],
      },
    ],
    objectifs: [
      {
        id: 'objectif-port',
        contenu: 'Atteindre Port-Serein.',
        participantIds: ['joueur'],
        evenementSourceIds: ['long-1', 'long-15'],
        dateMiseAJour: DATE[15],
      },
      {
        id: 'objectif-provisions',
        contenu: 'Compléter les provisions du voyage.',
        participantIds: ['joueur'],
        evenementSourceIds: ['long-10'],
        dateMiseAJour: DATE[10],
      },
    ],
    decisions: [
      {
        id: 'decision-bac',
        contenu: 'Prendre le bac.',
        participantIds: ['joueur'],
        evenementSourceIds: ['long-6'],
        dateDecision: DATE[6],
      },
      {
        id: 'decision-payer',
        contenu: 'Payer trois pièces pour le passage.',
        participantIds: ['joueur'],
        evenementSourceIds: ['long-8'],
        dateDecision: DATE[8],
      },
      {
        id: 'decision-pain',
        contenu: 'Acheter du pain.',
        participantIds: ['joueur'],
        evenementSourceIds: ['long-12'],
        dateDecision: DATE[12],
      },
    ],
    evenementSourceIds: historiqueLong.map(evenement => evenement.id),
    dateMiseAJour: DATE[15],
  }),
}

export const historiqueVide = {
  nom: 'historique vide',
  valide: false,
  raisonInvalidite: [
    'EtatDialogue.evenementSourceIds doit contenir au moins une source.',
    'Un historique vide ne peut donc produire aucun EtatDialogue valide.',
  ].join(' '),
  historique: [],
  etatAttendu: creerEtat({
    evenementSourceIds: [],
    dateMiseAJour: DATE[1],
  }),
}

export const historiqueIncoherent = {
  nom: 'historique incohérent',
  valide: false,
  raisonInvalidite: [
    'EtatDialogue référence evenement-absent.',
    'Cet identifiant ne désigne aucun événement de l’historique.',
  ].join(' '),
  historique: [
    creerEvenement({
      id: 'incoherent-1',
      date: DATE[1],
      contenu: 'Je cherche la tour.',
      referencesDialogue: [{ categorie: 'objectif', id: 'objectif-tour' }],
    }),
  ],
  etatAttendu: creerEtat({
    objectifs: [{
      id: 'objectif-tour',
      contenu: 'Trouver la tour.',
      participantIds: ['joueur'],
      evenementSourceIds: ['evenement-absent'],
      dateMiseAJour: DATE[1],
    }],
    evenementSourceIds: ['evenement-absent'],
    dateMiseAJour: DATE[1],
  }),
}

export const scenariosDialogue = Object.freeze([
  conversationSimple,
  objectifAtteint,
  objectifAbandonne,
  plusieursFaits,
  plusieursPersonnages,
  historiqueLongScenario,
  historiqueVide,
  historiqueIncoherent,
])
