/**
 * core/runtime/Runtime.js
 *
 * Responsabilite unique : orchestrer le cycle de vie du moteur Gabida.
 *
 * Question : "Comment le moteur demarre-t-il, s'arrete-t-il et coordonne-t-il ses modules ?"
 *
 * Le Runtime est le point d'entree interne du moteur.
 * Il possede l'etat du runtime (RuntimeState).
 * Il gere le cycle de vie via des transitions validees.
 * Il coordonne les modules en deleguant au ModuleManager.
 * Il expose une API publique minimale.
 *
 * Le Runtime ne doit JAMAIS :
 *   - generer du texte
 *   - prendre des decisions narratives
 *   - appeler un provider IA directement
 *   - contenir de la logique metier narrative
 *   - connaitre les details d'implementation des modules
 *
 * ─── Integration du systeme de modules (Sprint 13) ──────────────────────────
 *
 * Le Runtime ne connait aucune implementation concrete de module. Il delegue
 * entierement la gestion du cycle de vie des modules au ModuleManager, qui lit
 * les modules disponibles depuis un ModuleRegistry.
 *
 * Les modules sont fournis au Runtime via un ModuleRegistry injecte. Par defaut,
 * le Runtime cree un registre vide : un runtime sans module est parfaitement
 * valide et se contente de piloter sa propre machine a etats.
 *
 * Correspondance cycle de vie Runtime → cycle de vie des modules :
 *
 *   start()  : STOPPED → STARTING → RUNNING
 *              → initializeAll() puis startAll() (ordre d'insertion)
 *   stop()   : RUNNING → STOPPING → STOPPED
 *              → stopAll() puis disposeAll() (ordre inverse d'insertion)
 *   pause()  : RUNNING → PAUSED   (aucune operation module — l'abstraction
 *   resume() : PAUSED  → RUNNING   Module ne definit pas d'etat de pause)
 *
 * Comme stop() libere les ressources des modules (disposeAll → etat DISPOSED,
 * terminal), un Runtime arrete ne peut pas etre redemarre avec les memes
 * modules : il faut fournir un nouveau registre.
 *
 * ─── Evenements de cycle de vie ─────────────────────────────────────────────
 *
 * Le Runtime emet les RUNTIME_EVENTS officiels via un EventBus dedie, accessible
 * en lecture via `runtime.events`. L'application hote et les modules peuvent s'y
 * abonner. Le Runtime ne fait qu'emettre ; il ne connait aucun abonne.
 *
 *   STARTED : emis apres l'entree en RUNNING (demarrage reussi)
 *   STOPPED : emis apres l'entree en STOPPED (arret reussi)
 *   PAUSED  : emis apres l'entree en PAUSED
 *   RESUMED : emis apres le retour en RUNNING depuis PAUSED
 *   ERROR   : emis si une operation collective de modules echoue, avec l'erreur
 *             (ErreurModuleManager) en payload, avant sa propagation
 *
 * ─── Conteneur de services (Sprint 14) ──────────────────────────────────────
 *
 * Le Runtime possede le ServiceRegistry, conteneur central de Gabida. Aucun
 * composant n'instancie directement un autre composant : tout est obtenu via
 * resolve(). En tant que composition root, le Runtime detient ce conteneur et
 * l'expose en lecture via `runtime.services`. L'hote y enregistre ses services
 * avant start() ; les modules les resolvent au besoin.
 *
 * Le Runtime ne resout aucun service lui-meme et n'en connait aucun nom : il ne
 * fait que posseder le conteneur et gerer son cycle de vie. A l'arret, stop()
 * vide le conteneur (services.clear() → dispose de chaque descripteur), en meme
 * temps qu'il libere les modules.
 *
 * ─── Execution d'un pipeline (Sprint 15) ─────────────────────────────────
 *
 * Le Runtime peut posseder un Pipeline (injecte au constructeur, comme les
 * autres dependances d'infrastructure) et l'executer sur un Context via
 * execute(context). Le Runtime ne connait aucun stage concret : il delegue
 * entierement l'execution ordonnee au Pipeline, qui ne mute jamais le Context.
 *
 * execute(context) n'est autorise qu'a l'etat RUNNING. Il valide le pipeline
 * (InvalidPipelineError si absent/invalide) puis le context (InvalidContextError
 * si ce n'est pas une instance de Context), execute pipeline.execute(context)
 * et retourne le Context resultant. Toute exception d'un stage est encapsulee
 * dans une RuntimeExecutionError (portant l'erreur d'origine, un snapshot gele
 * du Context et un snapshot du pipeline), emise via RUNTIME_EVENTS.ERROR puis
 * propagee. Le Runtime ne mute jamais le Context : le determinisme et
 * l'immutabilite sont preserves.
 *
 * ─── Gestion des erreurs ────────────────────────────────────────────────────
 *
 * Si initializeAll()/startAll() (au demarrage) ou stopAll()/disposeAll() (a
 * l'arret) echoue, le Runtime emet RUNTIME_EVENTS.ERROR puis propage l'erreur
 * sans la masquer. L'abstraction RuntimeState ne definissant pas d'etat ERROR,
 * le runtime reste alors dans l'etat transitoire (STARTING ou STOPPING) : il
 * n'atteint ni RUNNING ni STOPPED. Les transitions d'etat illegales continuent
 * de lever ErreurTransitionRuntime, inchangees.
 *
 * @module core/runtime
 */

import { RUNTIME_STATES } from '../../constants/RuntimeStates.js'
import { RuntimeState, ErreurTransitionRuntime } from './RuntimeState.js'
import { RUNTIME_EVENTS } from './RuntimeEvents.js'
import { ModuleRegistry } from '../modules/ModuleRegistry.js'
import { ModuleManager } from '../modules/ModuleManager.js'
import { EventBus } from '../events/EventBus.js'
import { ServiceRegistry } from '../registry/ServiceRegistry.js'
import { Pipeline } from '../pipeline/Pipeline.js'
import { Context } from '../context/Context.js'
import {
  RuntimeError,
  InvalidPipelineError,
  InvalidContextError,
  RuntimeExecutionError,
} from './RuntimeError.js'

export { ErreurTransitionRuntime }

// ─── Runtime ──────────────────────────────────────────────────────────────────

export class Runtime {
  /**
   * @param {object} [options]
   * @param {ModuleRegistry} [options.registry]
   *   Registre des modules a piloter. Par defaut, un registre vide.
   * @param {EventBus} [options.eventBus]
   *   Bus d'evenements de cycle de vie. Par defaut, un bus dedie.
   * @param {ServiceRegistry} [options.services]
   *   Conteneur de services. Par defaut, un conteneur vide.
   * @param {Pipeline} [options.pipeline]
   *   Pipeline execute par execute(). Par defaut, aucun (execute() leve alors
   *   InvalidPipelineError).
   */
  constructor({ registry, eventBus, services, pipeline } = {}) {
    /** @type {RuntimeState} */
    this._state = new RuntimeState()
    /** @type {ModuleRegistry} */
    this._registry = registry ?? new ModuleRegistry()
    /** @type {EventBus} */
    this._eventBus = eventBus ?? new EventBus()
    /** @type {ModuleManager} */
    this._manager = new ModuleManager(this._registry, { eventBus: this._eventBus })
    /** @type {ServiceRegistry} */
    this._services = services ?? new ServiceRegistry()
    /** @type {Pipeline|null} */
    this._pipeline = pipeline ?? null
  }

  // ─── Accesseurs ──────────────────────────────────────────────────────────────

  /**
   * Bus d'evenements du runtime.
   * Permet a l'hote et aux modules de s'abonner aux RUNTIME_EVENTS.
   *
   * @returns {EventBus}
   */
  get events() {
    return this._eventBus
  }

  /**
   * Conteneur de services du runtime.
   * Permet a l'hote d'enregistrer et aux modules de resoudre les services.
   *
   * @returns {ServiceRegistry}
   */
  get services() {
    return this._services
  }

  /**
   * Pipeline execute par le runtime, ou null si aucun n'a ete injecte.
   *
   * @returns {Pipeline|null}
   */
  get pipeline() {
    return this._pipeline
  }

  // ─── API publique ────────────────────────────────────────────────────────────

  /**
   * Demarre le runtime et ses modules.
   * Transition : STOPPED → STARTING → RUNNING
   * Modules    : initializeAll() puis startAll().
   * Emet RUNTIME_EVENTS.STARTED une fois en RUNNING.
   *
   * @returns {Promise<void>}
   * @throws {ErreurTransitionRuntime}
   * @throws {import('../modules/ModuleManager.js').ErreurModuleManager}
   */
  async start() {
    this._state.transition(RUNTIME_STATES.STARTING)
    try {
      await this._manager.initializeAll()
      await this._manager.startAll()
    } catch (err) {
      this._eventBus.emit(RUNTIME_EVENTS.ERROR, err)
      throw err
    }
    this._state.transition(RUNTIME_STATES.RUNNING)
    this._eventBus.emit(RUNTIME_EVENTS.STARTED, undefined)
  }

  /**
   * Arrete le runtime et libere ses ressources.
   * Transition : RUNNING → STOPPING → STOPPED
   * Modules    : stopAll() puis disposeAll().
   * Services   : clear() (dispose de chaque descripteur).
   * Emet RUNTIME_EVENTS.STOPPED une fois en STOPPED.
   *
   * @returns {Promise<void>}
   * @throws {ErreurTransitionRuntime}
   * @throws {import('../modules/ModuleManager.js').ErreurModuleManager}
   */
  async stop() {
    this._state.transition(RUNTIME_STATES.STOPPING)
    try {
      await this._manager.stopAll()
      await this._manager.disposeAll()
      this._services.clear()
    } catch (err) {
      this._eventBus.emit(RUNTIME_EVENTS.ERROR, err)
      throw err
    }
    this._state.transition(RUNTIME_STATES.STOPPED)
    this._eventBus.emit(RUNTIME_EVENTS.STOPPED, undefined)
  }

  /**
   * Met le runtime en pause.
   * Transition : RUNNING → PAUSED
   * Emet RUNTIME_EVENTS.PAUSED.
   *
   * L'abstraction Module ne definit pas d'etat de pause : aucune operation
   * n'est propagee aux modules.
   *
   * @returns {Promise<void>}
   * @throws {ErreurTransitionRuntime}
   */
  async pause() {
    this._state.transition(RUNTIME_STATES.PAUSED)
    this._eventBus.emit(RUNTIME_EVENTS.PAUSED, undefined)
  }

  /**
   * Reprend le runtime depuis l'etat pause.
   * Transition : PAUSED → RUNNING
   * Emet RUNTIME_EVENTS.RESUMED.
   *
   * @returns {Promise<void>}
   * @throws {ErreurTransitionRuntime}
   */
  async resume() {
    this._state.transition(RUNTIME_STATES.RUNNING)
    this._eventBus.emit(RUNTIME_EVENTS.RESUMED, undefined)
  }

  /**
   * Retourne l'etat actuel du runtime.
   * Retourne une chaine immuable — jamais l'objet d'etat interne.
   *
   * @returns {string}
   */
  getState() {
    return this._state.current
  }

  // ─── Execution ───────────────────────────────────────────────────────────────

  /**
   * Execute le pipeline du runtime sur un Context et retourne le Context final.
   *
   * Autorise uniquement a l'etat RUNNING. Le Runtime ne connait aucun stage :
   * il delegue l'execution ordonnee au Pipeline et ne mute jamais le Context.
   *
   * En cas d'echec d'un stage, emet RUNTIME_EVENTS.ERROR avec une
   * RuntimeExecutionError (erreur d'origine + snapshot du Context + snapshot du
   * pipeline), puis la propage.
   *
   * @param {Context} context
   * @returns {Promise<Context>}
   * @throws {RuntimeError}           -- si le runtime n'est pas a l'etat RUNNING
   * @throws {InvalidPipelineError}   -- si aucun pipeline valide n'est disponible
   * @throws {InvalidContextError}    -- si context n'est pas une instance de Context
   * @throws {RuntimeExecutionError}  -- si un stage echoue pendant l'execution
   */
  async execute(context) {
    if (this._state.current !== RUNTIME_STATES.RUNNING) {
      throw new RuntimeError(
        `execute() n'est autorise qu'a l'etat RUNNING (etat courant : ${this._state.current}).`,
      )
    }

    if (!(this._pipeline instanceof Pipeline)) {
      throw new InvalidPipelineError('aucun pipeline disponible', this._pipeline)
    }

    if (!(context instanceof Context)) {
      throw new InvalidContextError('execute() requiert une instance de Context', context)
    }

    try {
      return await this._pipeline.execute(context)
    } catch (cause) {
      const pipelineSnapshot = { stages: this._pipeline.getAll().map(stage => stage.name) }
      const erreur = new RuntimeExecutionError(cause, context.snapshot(), pipelineSnapshot)
      this._eventBus.emit(RUNTIME_EVENTS.ERROR, erreur)
      throw erreur
    }
  }
}
