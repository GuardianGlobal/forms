import { describe, expect, it, vi } from 'vitest';
import type { PoolClient } from 'pg';
import { EmailMessageRepository, type EmailContextRow } from '#src/db/email-message-repo/email-message-repository.module.js';

const employeeId = '37951106000';
const agency = {
	agencyId: 'guardian',
	name: 'Guardian Home Care',
};
const formCompletionUrl =
	'https://portal.myguardiancares.com/form/one-time-token?employee=37951106000';
const actionDueOn = '2026-09-05';
const i9RequirementTypeId = '00000000-0000-4000-8000-000000000002';
const customFitTestRequirementTypeId = '00000000-0000-4000-8000-000000000012';

const defaultRequirements = [
	['00000000-0000-4000-8000-000000000001', 'Government ID', false, true],
	[i9RequirementTypeId, 'Form I-9', true, true],
	['00000000-0000-4000-8000-000000000003', 'Social Security Card', false, true],
	['00000000-0000-4000-8000-000000000004', 'TB Test', false, true],
	['00000000-0000-4000-8000-000000000005', 'CPR and First Aid Certification', false, false],
	['00000000-0000-4000-8000-000000000006', 'Handbook Acknowledgement', false, false],
	['00000000-0000-4000-8000-000000000007', 'Onboarding Form', false, true],
	['00000000-0000-4000-8000-000000000008', 'Employment Application', false, true],
	['00000000-0000-4000-8000-000000000009', 'Background Check', false, true],
	['00000000-0000-4000-8000-000000000010', 'Skills Test', false, false],
	['00000000-0000-4000-8000-000000000011', 'Form W-4', false, true],
	[customFitTestRequirementTypeId, 'Annual <Fit> Test', false, false],
] as const;

describe('EmailMessageRepository.getContext', () => {
	it('builds a missing-document context for a new employee with no documents on file', async () => {
		// These rows represent the MISSING issues opened by the document-resolution case.
		// No employee_documents rows exist for this employee.
		const rows: EmailContextRow[] = defaultRequirements.map(
			(
				[
					requirementTypeId,
					requirementDisplayName,
					requiresInPerson,
					containsSensitiveInformation,
				],
				index,
			) => ({
				employeeId,
				formToken: 'one-time-token',
				firstName: 'Avery',
				email: 'avery@example.com',
				issueId: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
				issueCode: 'MISSING' as const,
				requirementTypeId,
				requirementDisplayName,
				textTemplate:
					requirementTypeId === customFitTestRequirementTypeId
						? 'Please submit your {{requirement_display_name}}.'
						: `Your ${requirementDisplayName} is not currently on file.`,
				htmlTemplate:
					requirementTypeId === customFitTestRequirementTypeId
						? null
						: `<p>Your ${requirementDisplayName} is not currently on file.</p>`,
				expiresOn: null,
				actionDueAt: actionDueOn,
				requiresInPerson,
				containsSensitiveInformation,
				deadline: actionDueOn,
			}),
		);
		const query = vi.fn().mockResolvedValue({ rows, rowCount: rows.length });
		const pool = { query } as unknown as PoolClient;
		const repository = new EmailMessageRepository(agency, pool);

		const context = await repository.getContext(employeeId);

		expect(query).toHaveBeenCalledOnce();
		expect(query).toHaveBeenCalledWith(expect.any(String), [employeeId]);
		expect(context).toMatchObject({
			employee: {
				employeeId,
				firstName: 'Avery',
				email: 'avery@example.com',
			},
			agency,
			deadline: new Date('2026-09-05T00:00:00.000Z'),
			formCompletionUrl,
		});
		expect(context?.issues).toHaveLength(defaultRequirements.length);
		expect(context?.issues.every((issue) => issue.issueCode === 'MISSING')).toBe(true);
		expect(context?.issues).toContainEqual(
			expect.objectContaining({
				requirementTypeId: i9RequirementTypeId,
				requiresInPerson: true,
				containsSensitiveInformation: true,
				actionDueAt: new Date('2026-09-05T00:00:00.000Z'),
			}),
		);
		expect(context?.issues).toContainEqual(
			expect.objectContaining({
				requirementTypeId: customFitTestRequirementTypeId,
				textTemplate: 'Please submit your Annual <Fit> Test.',
				htmlTemplate: null,
			}),
		);
		expect(query).toHaveBeenCalledWith('SELECT * FROM api.get_context($1);', [employeeId]);
	});
});
