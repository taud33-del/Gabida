/**
 * lecture/reference.js
 *
 * Ingestion des fiches de référence Gabida au format `.txt` (prose officielle).
 *
 * Ce module lit les cinq fiches d'un cas de référence (ex. « Léa Martin ») et
 * les transforme en l'objet `sources` attendu par lecture.loadFiches(), SANS
 * rien inventer et SANS convertir les fichiers : le contenu brut est conservé
 * intégralement, et une structure légère par chapitres est produite pour
 * préparer les futurs modules.
 *
 * Seuls les champs réellement exploités aujourd'hui par le moteur sont extraits
 * explicitement (personnage.nom, univers.nom). Toutes les autres informations
 * sont conservées telles quelles dans `contenuBrut` et `chapitres`.
 *
 * Responsabilité : lecture de fichiers + découpage structurel. Aucune logique
 * narrative, aucune décision, aucune connaissance du pipeline.
 *
 * @module lecture/reference
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { TYPES_FICHE } from './index.js'

/**
 * Correspondance type de fiche → (sous-dossier, nom de fichier `.txt`).
 * Les noms de fichiers reprennent exactement ceux du cas de référence.
 *
 * @type {Readonly<Record<string, { dossier: string, fichier: string }>>}
 */
export const FICHIERS_REFERENCE = Object.freeze({
  personnage: { dossier: 'Character', fichier: '📖 Fiche Personnage.txt' },
  aventure  : { dossier: 'Adventure', fichier: '📖 Fiche Aventure.txt' },
  univers   : { dossier: 'Universe',  fichier: '📖 Fiche Univers.txt' },
  joueur    : { dossier: 'Player',    fichier: '📖 Fiche Joueur.txt' },
  memoire   : { dossier: 'Memory',    fichier: '📖 Fiche Mémoire.txt' },
})

/** Détecte une ligne d'en-tête de chapitre : « Chapitre 12 — Titre ». */
const REGEX_CHAPITRE = /^Chapitre\s+\d+\s*[—–-]\s*(.+)$/
/** Détecte une ligne d'en-tête de fiche : « 📖 Fiche Personnage ». */
const REGEX_ENTETE_FICHE = /^📖\s+Fiche\b/

/**
 * parseFicheTexte(texte)
 *
 * Découpe une fiche `.txt` en chapitres sans rien perdre ni interpréter.
 * Les lignes d'en-tête de fiche répétées (« 📖 Fiche … ») sont ignorées pour
 * le découpage mais restent présentes dans `contenuBrut`.
 *
 * @param {string} texte — Contenu brut du fichier.
 * @returns {{ contenuBrut: string, chapitres: Array<{ titre: string, contenu: string }> }}
 */
export function parseFicheTexte(texte) {
  const lignes = texte.split(/\r?\n/)
  const chapitres = []
  let courant = null

  for (const ligne of lignes) {
    if (REGEX_ENTETE_FICHE.test(ligne)) {
      continue
    }
    const correspondance = ligne.match(REGEX_CHAPITRE)
    if (correspondance) {
      if (courant) chapitres.push(finaliserChapitre(courant))
      courant = { titre: correspondance[1].trim(), lignes: [] }
      continue
    }
    if (courant) courant.lignes.push(ligne)
  }
  if (courant) chapitres.push(finaliserChapitre(courant))

  return { contenuBrut: texte, chapitres }
}

/**
 * @param {{ titre: string, lignes: string[] }} chapitre
 * @returns {{ titre: string, contenu: string }}
 */
function finaliserChapitre(chapitre) {
  return { titre: chapitre.titre, contenu: chapitre.lignes.join('\n').trim() }
}

/**
 * extraireChamps(texte)
 *
 * Extrait les paires « label<TAB>valeur » présentes dans une fiche (ex. le
 * chapitre Identité). Purement structurel : aucune valeur inventée.
 *
 * @param {string} texte
 * @returns {Record<string, string>}
 */
export function extraireChamps(texte) {
  /** @type {Record<string, string>} */
  const champs = {}
  for (const ligne of texte.split(/\r?\n/)) {
    const idx = ligne.indexOf('\t')
    if (idx <= 0) continue
    const label = ligne.slice(0, idx).trim()
    const valeur = ligne.slice(idx + 1).trim()
    if (label !== '' && valeur !== '' && champs[label] === undefined) {
      champs[label] = valeur
    }
  }
  return champs
}

/**
 * valeurApresLibelle(texte, libelle)
 *
 * Retourne la première ligne non vide qui suit une ligne égale à `libelle`.
 * Sert à lire les valeurs de la forme « 1. Nom de l'univers\n\nTerre … ».
 *
 * @param {string} texte
 * @param {string} libelle
 * @returns {string | undefined}
 */
export function valeurApresLibelle(texte, libelle) {
  const lignes = texte.split(/\r?\n/)
  const cible = libelle.trim().toLowerCase()
  for (let i = 0; i < lignes.length; i += 1) {
    if (lignes[i].trim().toLowerCase() === cible) {
      for (let j = i + 1; j < lignes.length; j += 1) {
        const suivante = lignes[j].trim()
        if (suivante !== '') return suivante
      }
    }
  }
  return undefined
}

/**
 * Construit la fiche personnage : contenu conservé + champs Identité + nom.
 * @param {string} texte
 * @returns {object}
 */
function construireFichePersonnage(texte) {
  const base = parseFicheTexte(texte)
  const champs = extraireChamps(texte)
  const prenom = champs['Prénom / Surnom'] ?? ''
  const nomFamille = champs['Nom'] ?? ''
  const nom = [prenom, nomFamille].filter((p) => p !== '').join(' ').trim()
  return {
    ...base,
    champs,
    ...(nom !== '' ? { nom } : {}),
  }
}

/**
 * valeurApresLigneContenant(texte, sousChaine)
 *
 * Retourne la première ligne non vide qui suit la première ligne contenant
 * `sousChaine` (comparaison insensible à la casse). Sert à lire des valeurs
 * dont le libellé est préfixé d'un numéro (« 7. Contexte géographique »).
 *
 * @param {string} texte
 * @param {string} sousChaine
 * @returns {string | undefined}
 */
export function valeurApresLigneContenant(texte, sousChaine) {
  const lignes = texte.split(/\r?\n/)
  const cible = sousChaine.trim().toLowerCase()
  for (let i = 0; i < lignes.length; i += 1) {
    if (lignes[i].toLowerCase().includes(cible)) {
      for (let j = i + 1; j < lignes.length; j += 1) {
        const suivante = lignes[j].trim()
        if (suivante !== '') return suivante
      }
    }
  }
  return undefined
}

/**
 * Construit la fiche univers : contenu conservé + nom d'univers.
 * @param {string} texte
 * @returns {object}
 */
function construireFicheUnivers(texte) {
  const base = parseFicheTexte(texte)
  const nom = valeurApresLibelle(texte, "1. Nom de l'univers")
  return {
    ...base,
    ...(nom ? { nom } : {}),
  }
}

/**
 * Construit la fiche aventure : contenu conservé + lieu de départ.
 *
 * `lieuDepart` est lu depuis le contexte géographique de la fiche (le lieu où
 * débute l'aventure). C'est le champ exploité par analyse.extraireLieu() et par
 * prompt (ligne « Lieu : … »). Aucune valeur inventée : si le libellé est
 * absent, le champ n'est pas défini et le moteur conserve son comportement par
 * défaut. La durée estimée de la fiche (« Libre ») n'est pas numérique et n'est
 * donc pas mappée sur `dureeEstimee`.
 *
 * @param {string} texte
 * @returns {object}
 */
function construireFicheAventure(texte) {
  const base = parseFicheTexte(texte)
  const lieuDepart = valeurApresLigneContenant(texte, 'Contexte géographique')
  return {
    ...base,
    ...(lieuDepart ? { lieuDepart } : {}),
  }
}

/**
 * chargerReference(racineCasReference)
 *
 * Lit les cinq fiches `.txt` d'un cas de référence et retourne l'objet
 * `sources` attendu par lecture.loadFiches(). Ne valide pas (loadFiches s'en
 * charge) ; ne modifie ni ne réordonne aucun contenu.
 *
 * @param {string} racineCasReference — Chemin du dossier du cas (ex. « …/reference/Léa Martin »).
 * @returns {Record<string, object>} — { personnage, aventure, univers, joueur, memoire }
 */
export function chargerReference(racineCasReference) {
  /** @type {Record<string, object>} */
  const sources = {}

  for (const type of TYPES_FICHE) {
    const { dossier, fichier } = FICHIERS_REFERENCE[type]
    const chemin = join(racineCasReference, dossier, fichier)
    const texte = readFileSync(chemin, 'utf8')

    if (type === 'personnage') {
      sources[type] = construireFichePersonnage(texte)
    } else if (type === 'univers') {
      sources[type] = construireFicheUnivers(texte)
    } else if (type === 'aventure') {
      sources[type] = construireFicheAventure(texte)
    } else {
      sources[type] = parseFicheTexte(texte)
    }
  }

  return sources
}
