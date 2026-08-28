BEGIN;

CREATE TABLE public.outbound_email_issues (
    outbound_email_id UUID NOT NULL
        REFERENCES public.outbound_emails (outbound_email_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    issue_id UUID NOT NULL
        REFERENCES public.requirement_issues (issue_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    PRIMARY KEY (outbound_email_id, issue_id)
);

CREATE INDEX outbound_email_issues_issue_id_idx
    ON public.outbound_email_issues (issue_id);

COMMIT;
