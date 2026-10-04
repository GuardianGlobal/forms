import { describe, expect, it, vi } from 'vitest';
import { DocumentsManager } from '#src/document-manager/documents-manager.module.js';
import type { EmployeeDocumentsRepository } from '#src/db/employee-documents-repository.module.js';

describe('DocumentsManager', () => {
	it.each([['resolveEmployeeRequirements', 'getRequirements'], ['initializeEmployeeRequirements', 'createRequirements']] as const)('%s returns requirement rows', async (method, repositoryMethod) => {
		const rows = [{ requirementId: 'requirement' }];
		const operation = vi.fn().mockResolvedValue({ rows });
		const manager = new DocumentsManager({ [repositoryMethod]: operation } as unknown as EmployeeDocumentsRepository);
		expect(await manager[method]('employee')).toBe(rows);
		expect(operation).toHaveBeenCalledExactlyOnceWith('employee');
	});
	it('propagates initialization failures', async () => {
		const error = new Error('failed');
		const manager = new DocumentsManager({ createRequirements: vi.fn().mockRejectedValue(error) } as unknown as EmployeeDocumentsRepository);
		await expect(manager.initializeEmployeeRequirements('employee')).rejects.toBe(error);
	});
});
