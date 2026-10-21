import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { ZodError } from 'zod';
import { bullResolver } from '#src/bullmq/bull-resolver.js';
import { BullQueueManager } from '#src/bullmq/modules/bull-queue-manager.module.js';
import type { BullMqs, PgFlowProducer, PgQueue, PgWorker } from '#src/bullmq/schema/bullmq-manager.js';

function fixture() {
	const worker = {} as PgWorker;
	const queue = {} as PgQueue;
	const flow = {} as PgFlowProducer;
	const deps: BullMqs = [
		{ getWorker: vi.fn(() => worker), endAll: vi.fn() },
		{ getQueue: vi.fn(() => queue), endAll: vi.fn() },
		{ getFlowProducer: vi.fn(() => flow), endAll: vi.fn() },
	];
	return { deps, worker, queue, flow };
}

// Model untyped JavaScript callers without weakening the public overloads.
const callUnchecked = bullResolver as (...args: unknown[]) => unknown;

describe('bullResolver', () => {
	it('infers and resolves each dependency with the original processor', () => {
		const { deps, worker, queue, flow } = fixture();
		const processor = vi.fn(async () => 'done');
		const resolvedWorker = bullResolver(deps, 'guardian', 'WORKER', 'onboarding', processor);
		const resolvedQueue = bullResolver(deps, 'guardian', 'QUEUE', 'onboarding');
		const resolvedFlow = bullResolver(deps, 'guardian', 'FLOW', 'onboarding');
		expectTypeOf(resolvedWorker).toEqualTypeOf<PgWorker>();
		expectTypeOf(resolvedQueue).toEqualTypeOf<PgQueue>();
		expectTypeOf(resolvedFlow).toEqualTypeOf<PgFlowProducer>();
		expect(resolvedWorker).toBe(worker);
		expect(resolvedQueue).toBe(queue);
		expect(resolvedFlow).toBe(flow);
		expect(deps[0].getWorker).toHaveBeenCalledExactlyOnceWith('guardian', 'onboarding', processor);
		expect(deps[1].getQueue).toHaveBeenCalledExactlyOnceWith('guardian', 'onboarding');
		expect(deps[2].getFlowProducer).toHaveBeenCalledExactlyOnceWith('guardian');
		expect(processor).not.toHaveBeenCalled();
		expect(bullResolver(deps, 'guardian', 'FLOW', 'legacy-name')).toBe(flow);
	});

	it('preserves class instances and their method receiver', () => {
		const { deps, queue } = fixture();
		const manager = new BullQueueManager();
		vi.spyOn(manager, 'getQueue').mockImplementation(function (this: BullQueueManager) {
			expect(this).toBe(manager);
			return queue;
		});
		deps[1] = manager;
		expect(bullResolver(deps, 'guardian', 'QUEUE', 'onboarding')).toBe(queue);
	});

	it.each([
		['agencyId', undefined, 'QUEUE', 'onboarding', undefined],
		['agencyId', '    ', 'QUEUE', 'onboarding', undefined],
		['agencyId', 'abcd', 'QUEUE', 'onboarding', undefined],
		['depType', 'guardian', 'INVALID', 'onboarding', undefined],
		['depName', 'guardian', 'QUEUE', undefined, undefined],
		['depName', 'guardian', 'QUEUE', '  ', undefined],
		['depName', 'guardian', 'WORKER', '', async () => {}],
		['processor', 'guardian', 'WORKER', 'onboarding', undefined],
		['processor', 'guardian', 'WORKER', 'onboarding', {}],
		['processor', 'guardian', 'QUEUE', 'onboarding', async () => {}],
		['processor', 'guardian', 'FLOW', undefined, async () => {}],
	])('rejects invalid %s before calling a manager', (path, agency, type, name, processor) => {
		const { deps } = fixture();
		let caught: unknown;
		try {
			callUnchecked(deps, agency, type, name, processor);
		} catch (error) {
			caught = error;
		}
		expect(caught).toBeInstanceOf(ZodError);
		expect((caught as ZodError).issues.some((issue) => issue.path[0] === path)).toBe(true);
		expect(deps[0].getWorker).not.toHaveBeenCalled();
		expect(deps[1].getQueue).not.toHaveBeenCalled();
		expect(deps[2].getFlowProducer).not.toHaveBeenCalled();
	});

	it.each([null, [], [{}, {}, {}], [null, null, null]])('rejects malformed manager tuples: %j', (deps) => {
		expect(() => callUnchecked(deps, 'guardian', 'QUEUE', 'onboarding')).toThrow(ZodError);
	});

	it('rejects swapped managers and extra tuple entries', () => {
		const { deps } = fixture();
		for (const invalid of [
			[deps[1], deps[0], deps[2]],
			[...deps, deps[0]],
		]) {
			expect(() => callUnchecked(invalid, 'guardian', 'QUEUE', 'onboarding')).toThrow(ZodError);
		}
	});

	it('preserves manager failures as the cause', () => {
		const { deps } = fixture();
		const cause = new Error('Connection configuration unavailable');
		vi.mocked(deps[1].getQueue).mockImplementation(() => {
			throw cause;
		});
		expect(() => bullResolver(deps, 'guardian', 'QUEUE', 'onboarding')).toThrow(
			expect.objectContaining({ message: 'bullResolver failed to resolve QUEUE', cause }),
		);
	});
});
