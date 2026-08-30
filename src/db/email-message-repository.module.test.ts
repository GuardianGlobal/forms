import { describe, expect, it, vi } from 'vitest';
import type { Pool } from 'pg';
import { EmailMessageRepository } from '#src/db/email-message-repository.module.js';

const employeeId = '37951106000';
const agency = {
	agencyId: 'guardian',
	name: 'Guardian Home Care',
};
const formCompletionUrl =
	'https://portal.myguardiancares.com/forms/one-time-token?employee=37951106000';
const actionDueOn = '2026-09-05';

const defaultRequirements = [
	['GOVERNMENT_ID', 'Government ID', false, true],
	['I_9', 'Form I-9', true, true],
	['SOCIAL_SECURITY_CARD', 'Social Security Card', false, true],
	['TB_TEST', 'TB Test', false, true],
	['CPR_FIRST_AID', 'CPR and First Aid Certification', false, false],
	['HANDBOOK_ACK', 'Handbook Acknowledgement', false, false],
	['ONBOARDING_FORM', 'Onboarding Form', false, true],
	['APPLICATION', 'Employment Application', false, true],
	['BACKGROUND', 'Background Check', false, true],
	['SKILLS TEST', 'Skills Test', false, false],
	['W_4', 'Form W-4', false, true],
	['CUSTOM_FIT_TEST', 'Annual <Fit> Test', false, false],
] as const;

describe('EmailMessageRepository.getContext', () => {
	it('builds a missing-document context for a new employee with no documents on file', async () => {
		// These rows represent the MISSING issues opened by the document-resolution case.
		// No employee_documents rows exist for this employee.
		const rows = defaultRequirements.map(
			([requirementCode, requirementDisplayName, requiresInPerson, containsSensitiveInformation], index) => ({
				employeeId,
				firstName: 'Avery',
				email: 'avery@example.com',
				issueId: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
				issueCode: 'MISSING' as const,
				requirementCode,
				requirementDisplayName,
				textTemplate:
					requirementCode === 'CUSTOM_FIT_TEST'
						? 'Please submit your {{requirement_display_name}}.'
						: `Your ${requirementDisplayName} is not currently on file.`,
				htmlTemplate:
					requirementCode === 'CUSTOM_FIT_TEST'
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
		const pool = { query } as unknown as Pool;
		const repository = new EmailMessageRepository(agency, pool);

		const context = await repository.getContext(employeeId, formCompletionUrl);

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
				requirementCode: 'I_9',
				requiresInPerson: true,
				containsSensitiveInformation: true,
				actionDueAt: new Date('2026-09-05T00:00:00.000Z'),
			}),
		);
		expect(context?.issues).toContainEqual(
			expect.objectContaining({
				requirementCode: 'CUSTOM_FIT_TEST',
				textTemplate: 'Please submit your Annual <Fit> Test.',
				htmlTemplate: null,
			}),
		);
		expect(query.mock.calls[0]?.[0]).toContain(
			'LEFT JOIN public.requirement_message_fragments',
		);
		expect(query.mock.calls[0]?.[0]).toContain('rit.default_text_template');
	});
});
