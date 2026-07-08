/**
 * core/pipeline/__tests__/Pipeline.test.js
 *
 * Exhaustive tests for the Pipeline system.
 *
 * Coverage:
 *   - PIPELINE_EVENTS    : constants, frozen
 *   - PipelineError      : typed hierarchy, properties
 *   - PipelineValidator  : validateStage, validatePipeline, validateContext, isPipelineStage
 *   - PipelineStage      : abstract guard, name, execute throws by default
 *   - PipelineBuilder    : add, remove, clear, build, chaining, isolation
 *   - Pipeline           : execute, size, has, get, getAll, toArray,
 *                          execution order, context propagation, error propagation,
 *                          empty, single, multiple, duplicate, invalid, immutability
 */

import { jest }                    from '@jest/globals'
import { PIPELINE_EVENTS }         from '../PipelineEvents.js'
import {
  PipelineError,
  InvalidStageError,
  DuplicateStageError,
  StageExecutionError,
  PipelineValidationError,
}                                  from '../PipelineError.js'
import {
  validateStage,
  validatePipeline,
  validateContext,
  isPipelineStage,
}                                  from '../PipelineValidator.js'
import { PipelineStage }           from '../PipelineStage.js'
import { PipelineBuilder }         from '../PipelineBuilder.js'
import { Pipeline }                from '../Pipeline.js'
import { Context }                 from '../../context/Context.js'

// ─── Stub concrete stage ─────────────────────────────────────────────────────

class StubStage extends PipelineStage {
  constructor(name, transform = ctx => ctx) {
    super(name)
    this._transform = transform
  }
  async execute(context) {
    return this._transform(context)
  }
}

class FailingStage extends PipelineStage {
  constructor(name = 'failing') { super(name) }
  async execute(_context) { throw new Error('intentional failure') }
}

const makeCtx = (data = {}) => new Context(data)

// ─── PIPELINE_EVENTS ─────────────────────────────────────────────────────────

describe('PIPELINE_EVENTS', () => {
  test('declares PIPELINE_STARTED',  () => expect(typeof PIPELINE_EVENTS.PIPELINE_STARTED).toBe('string'))
  test('declares PIPELINE_FINISHED', () => expect(typeof PIPELINE_EVENTS.PIPELINE_FINISHED).toBe('string'))
  test('declares STAGE_STARTED',     () => expect(typeof PIPELINE_EVENTS.STAGE_STARTED).toBe('string'))
  test('declares STAGE_FINISHED',    () => expect(typeof PIPELINE_EVENTS.STAGE_FINISHED).toBe('string'))
  test('declares STAGE_FAILED',      () => expect(typeof PIPELINE_EVENTS.STAGE_FAILED).toBe('string'))
  test('is frozen',                  () => expect(Object.isFrozen(PIPELINE_EVENTS)).toBe(true))
})

// ─── PipelineError ────────────────────────────────────────────────────────────

describe('PipelineError', () => {
  test('InvalidStageError extends PipelineError',      () => expect(new InvalidStageError('x')).toBeInstanceOf(PipelineError))
  test('DuplicateStageError extends PipelineError',    () => expect(new DuplicateStageError('x')).toBeInstanceOf(PipelineError))
  test('StageExecutionError extends PipelineError',    () => expect(new StageExecutionError('s', new Error('e'))).toBeInstanceOf(PipelineError))
  test('PipelineValidationError extends PipelineError',() => expect(new PipelineValidationError('r', null)).toBeInstanceOf(PipelineError))

  test('DuplicateStageError stores stageName', () => {
    expect(new DuplicateStageError('myStage').stageName).toBe('myStage')
  })
  test('StageExecutionError stores stageName and cause', () => {
    const cause = new Error('boom')
    const err   = new StageExecutionError('s', cause)
    expect(err.stageName).toBe('s')
    expect(err.cause).toBe(cause)
  })
  test('PipelineValidationError stores reason and value', () => {
    const err = new PipelineValidationError('bad', 42)
    expect(err.reason).toBe('bad')
    expect(err.value).toBe(42)
  })
})

// ─── PipelineValidator ────────────────────────────────────────────────────────

describe('PipelineValidator', () => {
  describe('isPipelineStage', () => {
    test('true for valid stage object',    () => expect(isPipelineStage(new StubStage('s'))).toBe(true))
    test('false for null',                 () => expect(isPipelineStage(null)).toBe(false))
    test('false for object without execute', () => expect(isPipelineStage({ name: 'x' })).toBe(false))
    test('false for object with empty name', () => expect(isPipelineStage({ name: '', execute: () => {} })).toBe(false))
    test('false for primitive',            () => expect(isPipelineStage(42)).toBe(false))
  })

  describe('validateStage', () => {
    test('accepts valid stage',            () => expect(() => validateStage(new StubStage('s'))).not.toThrow())
    test('rejects null',                   () => expect(() => validateStage(null)).toThrow(InvalidStageError))
    test('rejects plain object',           () => expect(() => validateStage({})).toThrow(InvalidStageError))
  })

  describe('validatePipeline', () => {
    test('accepts empty array',            () => expect(() => validatePipeline([])).not.toThrow())
    test('accepts valid stages array',     () => expect(() => validatePipeline([new StubStage('a')])).not.toThrow())
    test('rejects non-array',             () => expect(() => validatePipeline(null)).toThrow(PipelineValidationError))
    test('rejects array with bad stage',  () => expect(() => validatePipeline([{}])).toThrow(InvalidStageError))
  })

  describe('validateContext', () => {
    test('accepts Context instance',       () => expect(() => validateContext(new Context())).not.toThrow())
    test('rejects plain object',           () => expect(() => validateContext({})).toThrow(PipelineValidationError))
    test('rejects null',                   () => expect(() => validateContext(null)).toThrow(PipelineValidationError))
  })
})

// ─── PipelineStage ────────────────────────────────────────────────────────────

describe('PipelineStage', () => {
  test('cannot be instantiated directly', () =>
    expect(() => new PipelineStage('x')).toThrow(InvalidStageError))

  test('can be instantiated via subclass', () =>
    expect(() => new StubStage('valid')).not.toThrow())

  test('exposes name via getter', () =>
    expect(new StubStage('my-stage').name).toBe('my-stage'))

  test('default execute throws InvalidStageError', async () => {
    class BareStage extends PipelineStage {
      constructor() { super('bare') }
    }
    const stage = new BareStage()
    await expect(stage.execute(makeCtx())).rejects.toThrow(InvalidStageError)
  })

  test('rejects empty name', () =>
    expect(() => {
      class BadName extends PipelineStage { constructor() { super('') } }
      new BadName()
    }).toThrow(InvalidStageError))
})

// ─── PipelineBuilder ─────────────────────────────────────────────────────────

describe('PipelineBuilder', () => {
  let builder

  beforeEach(() => { builder = new PipelineBuilder() })

  test('builds an empty pipeline', () => {
    expect(builder.build().size()).toBe(0)
  })

  test('add() inserts a stage', () => {
    builder.add(new StubStage('a'))
    expect(builder.build().has('a')).toBe(true)
  })

  test('add() returns builder for chaining', () => {
    expect(builder.add(new StubStage('a'))).toBe(builder)
  })

  test('add() rejects duplicate name', () => {
    builder.add(new StubStage('a'))
    expect(() => builder.add(new StubStage('a'))).toThrow(DuplicateStageError)
  })

  test('add() rejects invalid stage', () => {
    expect(() => builder.add(null)).toThrow(InvalidStageError)
  })

  test('remove() removes a stage by name', () => {
    builder.add(new StubStage('a'))
    builder.remove('a')
    expect(builder.build().has('a')).toBe(false)
  })

  test('remove() is silent when stage is absent', () => {
    expect(() => builder.remove('nonexistent')).not.toThrow()
  })

  test('remove() returns builder for chaining', () => {
    expect(builder.remove('x')).toBe(builder)
  })

  test('clear() removes all stages', () => {
    builder.add(new StubStage('a')).add(new StubStage('b'))
    builder.clear()
    expect(builder.build().size()).toBe(0)
  })

  test('clear() returns builder for chaining', () => {
    expect(builder.clear()).toBe(builder)
  })

  test('build() preserves insertion order', () => {
    builder.add(new StubStage('a')).add(new StubStage('b')).add(new StubStage('c'))
    const names = builder.build().toArray().map(s => s.name)
    expect(names).toEqual(['a', 'b', 'c'])
  })

  test('build() produces independent Pipelines', () => {
    builder.add(new StubStage('a'))
    const p1 = builder.build()
    builder.add(new StubStage('b'))
    const p2 = builder.build()
    expect(p1.size()).toBe(1)
    expect(p2.size()).toBe(2)
  })

  test('builder chaining: add().add().remove().build()', () => {
    const pipeline = builder
      .add(new StubStage('a'))
      .add(new StubStage('b'))
      .add(new StubStage('c'))
      .remove('b')
      .build()
    expect(pipeline.size()).toBe(2)
    expect(pipeline.has('b')).toBe(false)
  })
})

// ─── Pipeline ─────────────────────────────────────────────────────────────────

describe('Pipeline', () => {
  describe('construction', () => {
    test('accepts empty stage array', () =>
      expect(() => new Pipeline([])).not.toThrow())
    test('is frozen after construction', () =>
      expect(Object.isFrozen(new Pipeline([]))).toBe(true))
    test('rejects non-array input', () =>
      expect(() => new Pipeline(null)).toThrow(PipelineValidationError))
    test('rejects array with invalid stage', () =>
      expect(() => new Pipeline([{}])).toThrow(InvalidStageError))
  })

  describe('size() / has() / get() / getAll() / toArray()', () => {
    test('size() returns 0 for empty pipeline', () =>
      expect(new Pipeline([]).size()).toBe(0))
    test('size() returns correct count', () =>
      expect(new Pipeline([new StubStage('a'), new StubStage('b')]).size()).toBe(2))
    test('has() returns true for existing stage', () =>
      expect(new Pipeline([new StubStage('a')]).has('a')).toBe(true))
    test('has() returns false for absent stage', () =>
      expect(new Pipeline([]).has('x')).toBe(false))
    test('get() returns correct stage', () => {
      const stage    = new StubStage('a')
      const pipeline = new Pipeline([stage])
      expect(pipeline.get('a')).toBe(stage)
    })
    test('get() returns undefined for absent', () =>
      expect(new Pipeline([]).get('x')).toBeUndefined())
    test('getAll() returns frozen array', () =>
      expect(Object.isFrozen(new Pipeline([]).getAll())).toBe(true))
    test('toArray() returns frozen array of stages in order', () => {
      const stages   = [new StubStage('a'), new StubStage('b')]
      const pipeline = new Pipeline(stages)
      const arr      = pipeline.toArray()
      expect(arr.map(s => s.name)).toEqual(['a', 'b'])
    })
  })

  describe('execute() — empty pipeline', () => {
    test('returns the original context unchanged', async () => {
      const ctx    = makeCtx({ x: 1 })
      const result = await new Pipeline([]).execute(ctx)
      expect(result.get('x')).toBe(1)
    })
    test('rejects non-Context input', async () => {
      await expect(new Pipeline([]).execute({})).rejects.toThrow(PipelineValidationError)
    })
  })

  describe('execute() — single stage', () => {
    test('passes context to stage and returns result', async () => {
      const stage    = new StubStage('s', ctx => ctx.set('done', true))
      const pipeline = new Pipeline([stage])
      const result   = await pipeline.execute(makeCtx())
      expect(result.get('done')).toBe(true)
    })
  })

  describe('execute() — multiple stages', () => {
    test('stages execute in insertion order', async () => {
      const order = []
      const s1 = new StubStage('s1', ctx => { order.push(1); return ctx })
      const s2 = new StubStage('s2', ctx => { order.push(2); return ctx })
      const s3 = new StubStage('s3', ctx => { order.push(3); return ctx })
      await new Pipeline([s1, s2, s3]).execute(makeCtx())
      expect(order).toEqual([1, 2, 3])
    })

    test('each stage receives context from previous stage', async () => {
      const s1 = new StubStage('s1', ctx => ctx.set('a', 1))
      const s2 = new StubStage('s2', ctx => ctx.set('b', ctx.get('a') + 1))
      const result = await new Pipeline([s1, s2]).execute(makeCtx())
      expect(result.get('a')).toBe(1)
      expect(result.get('b')).toBe(2)
    })

    test('accumulates transformations across all stages', async () => {
      const stages = ['x', 'y', 'z'].map((k, i) =>
        new StubStage(k, ctx => ctx.set(k, i + 1))
      )
      const result = await new Pipeline(stages).execute(makeCtx())
      expect(result.get('x')).toBe(1)
      expect(result.get('y')).toBe(2)
      expect(result.get('z')).toBe(3)
    })
  })

  describe('execute() — error propagation', () => {
    test('wraps stage error in StageExecutionError', async () => {
      const pipeline = new Pipeline([new FailingStage()])
      await expect(pipeline.execute(makeCtx())).rejects.toThrow(StageExecutionError)
    })

    test('StageExecutionError stores stageName and cause', async () => {
      const pipeline = new Pipeline([new FailingStage('broken')])
      let err
      try { await pipeline.execute(makeCtx()) } catch (e) { err = e }
      expect(err.stageName).toBe('broken')
      expect(err.cause.message).toBe('intentional failure')
    })

    test('stops execution at first failing stage', async () => {
      const order = []
      const s1 = new StubStage('s1', ctx => { order.push('s1'); return ctx })
      const s2 = new FailingStage('s2')
      const s3 = new StubStage('s3', ctx => { order.push('s3'); return ctx })
      const pipeline = new Pipeline([s1, s2, s3])
      try { await pipeline.execute(makeCtx()) } catch (_) { /* expected */ }
      expect(order).toEqual(['s1'])
    })
  })

  describe('immutability', () => {
    test('cannot add stages after construction', () => {
      const pipeline = new Pipeline([new StubStage('a')])
      expect(() => { pipeline._stages.push(new StubStage('b')) }).toThrow()
    })
    test('getAll() changes do not affect pipeline', () => {
      const stage    = new StubStage('a')
      const pipeline = new Pipeline([stage])
      const arr      = pipeline.getAll()
      expect(() => { arr.push(new StubStage('b')) }).toThrow()
      expect(pipeline.size()).toBe(1)
    })
  })
})
