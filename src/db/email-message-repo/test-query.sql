SELECT t1.*
FROM public.employee_requirements AS t1
WHERE
    CONCAT_WS(
        ' ',
        t1.expires_on
    ) ILIKE '%' || $1 || '%'

    OR EXISTS (
        SELECT 1
        FROM public.requiremet_issues AS t2
        WHERE t2.requirement_id = t1.requirement_id
          AND CONCAT_WS(
              ' ',
                t2.issue_id,
                t2.issue_code,
                t2.actionDueAt,
          ) ILIKE '%' || $1 || '%'
    )

    OR EXISTS (
        SELECT 1
        FROM public.requirement_types AS t3
        WHERE t3.requirement_code = t1.requirement_code
          AND CONCAT_WS(
              ' ',
              t3.requirement_code,
              t3.requirement_display_name
              t3.requires_in_person,
              t3.contains_sensitive_info
          ) ILIKE '%' || $1 || '%'
    )

    OR EXISTS (
        SELECT 1
        FROM public.requirement_issue_types AS t4
        WHERE t4.issue_code = t2.issue_code
          AND CONCAT_WS(
              ' ',
              t4.html_template,
              t4.text_template
          ) ILIKE '%' || $1 || '%'
    )

    OR EXISTS (
        SELECT 1
        FROM public.employees AS t5
        WHERE t5.employee_id = t1.employee_id
          AND CONCAT_WS(
              ' ',
               t5.employee_id
                t5.first_name,
                t5.email,
          ) ILIKE '%' || $1 || '%'
);