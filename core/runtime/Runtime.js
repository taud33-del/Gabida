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
   */
  constructor({ registry, eventBus, services } = {}) {
    /** @type {RuntimeState} */
    this._state = new RuntimeState()
    /** @type {ModuleRegistry} */
    this._registry = registry ?? new ModuleRegistry()
    /** @type {ModuleManager} */
    this._manager = new ModuleManager(this._registry)
    /** @type {EventBus} */
    this._eventBus = eventBus ?? new EventBus()
    /** @type {ServiceRegistry} */
    this._services = services ?? new ServiceRegistry()
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
}
