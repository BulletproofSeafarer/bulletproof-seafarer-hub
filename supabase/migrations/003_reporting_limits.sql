begin;
create index hub_reports_by_reporter on public.hub_reports(reporter,created_at);
create index hub_feedback_by_owner on public.hub_feedback(owner,created_at);
create function public.hub_report_limit() returns trigger language plpgsql security definer set search_path='' as $$
declare n integer;u uuid:=auth.uid();
begin
 if u is null then raise exception 'Sign in required';end if;
 perform pg_advisory_xact_lock(hashtextextended('hub-report-'||u::text,0));
 if tg_table_name='hub_reports' then select count(*) into n from public.hub_reports where reporter=u and created_at>now()-interval '1 hour';
 else select count(*) into n from public.hub_feedback where owner=u and created_at>now()-interval '1 hour';end if;
 if n>=10 then raise exception 'You have sent several reports. Please try again later.';end if;
 return new;
end $$;
create trigger hub_report_limit before insert on public.hub_reports for each row execute function public.hub_report_limit();
create trigger hub_feedback_limit before insert on public.hub_feedback for each row execute function public.hub_report_limit();
revoke all on function public.hub_report_limit() from public,anon,authenticated;
commit;
