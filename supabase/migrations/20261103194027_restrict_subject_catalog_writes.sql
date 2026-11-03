-- Codes are allocated only through the guarded RPC; catalog entries are immutable.
revoke all on public.certificate_subjects from anon,authenticated;
grant select on public.certificate_subjects to authenticated;
