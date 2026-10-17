begin;
alter table public.hub_question_votes add column created_at timestamptz not null default now();
alter table public.hub_answer_votes add column created_at timestamptz not null default now();
-- Column grants prevent clients from backdating reaction events to qualify early.
revoke insert on public.hub_question_votes,public.hub_answer_votes from authenticated;
grant insert(question_id) on public.hub_question_votes to authenticated;
grant insert(answer_id) on public.hub_answer_votes to authenticated;
alter table public.hub_questions add column accepted_at timestamptz;
create function public.hub_accept_time() returns trigger language plpgsql set search_path='' as $$
begin
 if new.accepted is distinct from old.accepted then new.accepted_at=case when new.accepted is null then null else now() end;end if;return new;
end $$;
create trigger hub_accept_time before update on public.hub_questions for each row execute function public.hub_accept_time();
create table public.hub_rounds(week date primary key,created_at timestamptz not null default now());
create table public.hub_candidates(week date not null references public.hub_rounds(week),user_id uuid not null references public.hub_profiles(id),points integer not null check(points>0),primary key(week,user_id));
create table public.hub_support(week date not null,voter uuid not null default auth.uid() references auth.users(id),candidate uuid not null,primary key(week,voter,candidate),foreign key(week,candidate) references public.hub_candidates(week,user_id));
alter table public.hub_rounds enable row level security;
alter table public.hub_candidates enable row level security;
alter table public.hub_support enable row level security;
create policy rounds_read on public.hub_rounds for select to authenticated using(true);
create policy candidates_read on public.hub_candidates for select to authenticated using(true);
create policy support_read on public.hub_support for select to authenticated using(true);
create policy support_insert on public.hub_support for insert to authenticated with check(voter=auth.uid() and candidate<>auth.uid() and week=date_trunc('week',now() at time zone 'UTC')::date and exists(select 1 from public.hub_candidates c where c.week=hub_support.week and c.user_id=candidate));
create policy support_delete on public.hub_support for delete to authenticated using(voter=auth.uid() and week=date_trunc('week',now() at time zone 'UTC')::date);
revoke all on public.hub_rounds,public.hub_candidates,public.hub_support from anon,authenticated;
grant select on public.hub_rounds,public.hub_candidates,public.hub_support to authenticated;
grant insert(week,candidate),delete on public.hub_support to authenticated;
create function public.hub_get_leaderboard() returns jsonb language plpgsql security definer set search_path='' as $$
declare w date:=date_trunc('week',now() at time zone 'UTC')::date;result jsonb;
begin
 if auth.uid() is null then raise exception 'Sign in required';end if;
 perform pg_advisory_xact_lock(hashtextextended('hub-round-'||w::text,0));
 if not exists(select 1 from public.hub_rounds where week=w) then
  insert into public.hub_rounds(week) values(w);
  insert into public.hub_candidates(week,user_id,points)
  with events as (
   select q.owner as user_id,1 as points from public.hub_question_votes v join public.hub_questions q on q.id=v.question_id where not q.hidden and v.user_id<>q.owner and v.created_at<w::timestamp at time zone 'UTC'
   union all
   select a.owner,2 from public.hub_answer_votes v join public.hub_answers a on a.id=v.answer_id join public.hub_questions q on q.id=a.question_id where not a.hidden and not q.hidden and a.owner<>q.owner and v.user_id<>a.owner and v.created_at<w::timestamp at time zone 'UTC'
   union all
   select a.owner,5 from public.hub_questions q join public.hub_answers a on a.id=q.accepted where not q.hidden and not a.hidden and a.owner<>q.owner and q.accepted_at<w::timestamp at time zone 'UTC'
  ), scores as(select user_id,sum(points)::integer points from events group by user_id)
  select w,s.user_id,s.points from scores s join public.hub_profiles p on p.id=s.user_id where p.name<>'' order by s.points desc,s.user_id limit 10;
 end if;
 select coalesce(jsonb_agg(rowdata order by votes desc,points desc,user_id),'[]') into result from (
  select c.user_id,c.points,count(s.voter)::integer votes,jsonb_build_object('id',c.user_id,'name',p.name,'rank',p.rank,'department',p.department,'points',c.points,'votes',count(s.voter),'supported',coalesce(bool_or(s.voter=auth.uid()),false)) rowdata
  from public.hub_candidates c join public.hub_profiles p on p.id=c.user_id left join public.hub_support s on s.week=c.week and s.candidate=c.user_id where c.week=w group by c.user_id,c.points,p.name,p.rank,p.department
 ) ranked;
 return jsonb_build_object('week',w,'candidates',result);
end $$;
revoke all on function public.hub_accept_time(),public.hub_get_leaderboard() from public,anon;
grant execute on function public.hub_get_leaderboard() to authenticated;
commit;
