-- Run once in a NEW Hub Supabase project. Do not also run the individual migration files.
-- Bulletproof Seafarer Hub: separate Supabase project, never Gangway's database.
begin;
create table public.hub_profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 name text not null default '' check(char_length(name)<=60),
 rank text not null default '' check(char_length(rank)<=70),
 department text not null default '' check(department in ('','Engine','Deck','Electrical','General')),
 bio text not null default '' check(char_length(bio)<=500),
 experience text not null default '' check(char_length(experience)<=10),
 country text not null default '' check(char_length(country)<=70),
 photo text not null default '' check(char_length(photo)<=200)
);
create table public.hub_roles(user_id uuid primary key references auth.users(id) on delete cascade,role text not null check(role in ('admin','moderator')));
create function public.hub_staff() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.hub_roles where user_id=auth.uid() and role in ('admin','moderator'));
$$;
create table public.hub_workspaces (
 user_id uuid primary key references auth.users(id) on delete cascade,
 data jsonb not null default '{}' check(jsonb_typeof(data)='object' and octet_length(data::text)<=700000),
 version integer not null default 1 check(version>0),updated_at timestamptz not null default now()
);
create table public.hub_questions (
 id uuid primary key,owner uuid not null default auth.uid() references public.hub_profiles(id),
 title text not null check(char_length(trim(title)) between 8 and 160),
 body text not null check(char_length(trim(body)) between 10 and 12000),
 department text not null check(department in ('Engine','Deck','Electrical','General')),
 equipment text not null check(char_length(equipment) between 1 and 90),
 tags text[] not null default '{}' check(cardinality(tags)<=5 and char_length(array_to_string(tags,''))<=250),
 photos text[] not null default '{}' check(cardinality(photos)<=5),
 status text not null default 'Open' check(status in ('Open','Resolved')),
 outcome text not null default '' check(char_length(outcome)<=6000),
 accepted uuid,hidden boolean not null default false,created_at timestamptz not null default now()
);
create table public.hub_answers (
 id uuid primary key,question_id uuid not null references public.hub_questions(id) on delete cascade,
 owner uuid not null default auth.uid() references public.hub_profiles(id),
 text text not null check(char_length(trim(text)) between 2 and 12000),
 basis text not null check(basis in ('Firsthand experience','Manual or reference','Suggested explanation')),
 photos text[] not null default '{}' check(cardinality(photos)<=3),
 hidden boolean not null default false,created_at timestamptz not null default now()
);
create table public.hub_question_votes(user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,question_id uuid not null references public.hub_questions(id) on delete cascade,primary key(user_id,question_id));
create table public.hub_answer_votes(user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,answer_id uuid not null references public.hub_answers(id) on delete cascade,primary key(user_id,answer_id));
create table public.hub_reports(id uuid primary key,reporter uuid not null default auth.uid() references auth.users(id),question_id uuid references public.hub_questions(id),reason text not null check(char_length(trim(reason)) between 3 and 1500),created_at timestamptz not null default now());
create table public.hub_feedback(id uuid primary key,owner uuid not null default auth.uid() references auth.users(id),message text not null check(char_length(trim(message)) between 3 and 3000),topic text not null check(char_length(topic)<=100),created_at timestamptz not null default now());
create table public.hub_moderation_log(id bigint generated always as identity primary key,actor uuid not null,kind text not null,target uuid not null,hidden boolean not null,reason text not null,created_at timestamptz not null default now());
create index on public.hub_questions(created_at desc);
create index on public.hub_answers(question_id,created_at);
create index on public.hub_questions(owner);
create index on public.hub_answers(owner);

-- Validate references and rate limits server-side; clients cannot alter identity/timestamps.
create function public.hub_content_guard() returns trigger language plpgsql security definer set search_path='' as $$
declare p text; n integer;
begin
 if tg_table_name='hub_profiles' then
  if new.photo<>'' and new.photo not like new.id::text||'/%' then raise exception 'Invalid photo owner'; end if;
  return new;
 end if;
 foreach p in array new.photos loop
  if p not like new.owner::text||'/%' or p like '%..%' or length(p)>200 then raise exception 'Invalid photo owner'; end if;
 end loop;
 if tg_table_name='hub_questions' then
  if new.status='Resolved' and length(trim(new.outcome))<3 then raise exception 'Add a reported outcome'; end if;
  if new.accepted is not null and not exists(select 1 from public.hub_answers a where a.id=new.accepted and a.question_id=new.id and not a.hidden) then raise exception 'Answer does not belong to this discussion'; end if;
  if tg_op='INSERT' then
   perform pg_advisory_xact_lock(hashtextextended(new.owner::text,0));
   select count(*) into n from public.hub_questions where owner=new.owner and created_at>now()-interval '1 hour';
   if n>=10 then raise exception 'Question limit reached. Please return later.';end if;
  end if;
 else
  if not exists(select 1 from public.hub_questions where id=new.question_id and not hidden) then raise exception 'Question is unavailable';end if;
  if tg_op='INSERT' then
   perform pg_advisory_xact_lock(hashtextextended(new.owner::text,0));
   select count(*) into n from public.hub_answers where owner=new.owner and created_at>now()-interval '1 hour';
   if n>=30 then raise exception 'Answer limit reached. Please return later.';end if;
  end if;
 end if;
 return new;
end $$;
create trigger hub_profile_guard before insert or update on public.hub_profiles for each row execute function public.hub_content_guard();
create trigger hub_question_guard before insert or update on public.hub_questions for each row execute function public.hub_content_guard();
create trigger hub_answer_guard before insert or update on public.hub_answers for each row execute function public.hub_content_guard();

alter table public.hub_profiles enable row level security;
alter table public.hub_roles enable row level security;
alter table public.hub_workspaces enable row level security;
alter table public.hub_questions enable row level security;
alter table public.hub_answers enable row level security;
alter table public.hub_question_votes enable row level security;
alter table public.hub_answer_votes enable row level security;
alter table public.hub_reports enable row level security;
alter table public.hub_feedback enable row level security;
alter table public.hub_moderation_log enable row level security;
create policy profiles_read on public.hub_profiles for select to authenticated using(true);
create policy profiles_insert on public.hub_profiles for insert to authenticated with check(id=auth.uid());
create policy profiles_update on public.hub_profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy roles_own on public.hub_roles for select to authenticated using(user_id=auth.uid());
create policy workspace_own on public.hub_workspaces for select to authenticated using(user_id=auth.uid());
create policy questions_read on public.hub_questions for select to authenticated using(not hidden or owner=auth.uid() or public.hub_staff());
create policy questions_insert on public.hub_questions for insert to authenticated with check(owner=auth.uid() and not hidden and status='Open' and outcome='' and accepted is null);
create policy questions_update on public.hub_questions for update to authenticated using(owner=auth.uid() and not hidden) with check(owner=auth.uid() and not hidden);
create policy answers_read on public.hub_answers for select to authenticated using((not hidden or owner=auth.uid() or public.hub_staff()) and exists(select 1 from public.hub_questions q where q.id=question_id and not q.hidden));
create policy answers_insert on public.hub_answers for insert to authenticated with check(owner=auth.uid() and not hidden and exists(select 1 from public.hub_questions q where q.id=question_id and not q.hidden));
create policy qvotes_read on public.hub_question_votes for select to authenticated using(true);
create policy qvotes_insert on public.hub_question_votes for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from public.hub_questions q where q.id=question_id and q.owner<>auth.uid() and not q.hidden));
create policy qvotes_delete on public.hub_question_votes for delete to authenticated using(user_id=auth.uid());
create policy avotes_read on public.hub_answer_votes for select to authenticated using(true);
create policy avotes_insert on public.hub_answer_votes for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from public.hub_answers a where a.id=answer_id and a.owner<>auth.uid() and not a.hidden));
create policy avotes_delete on public.hub_answer_votes for delete to authenticated using(user_id=auth.uid());
create policy reports_insert on public.hub_reports for insert to authenticated with check(reporter=auth.uid());
create policy reports_read on public.hub_reports for select to authenticated using(reporter=auth.uid() or public.hub_staff());
create policy feedback_insert on public.hub_feedback for insert to authenticated with check(owner=auth.uid());
create policy feedback_read on public.hub_feedback for select to authenticated using(owner=auth.uid() or public.hub_staff());
create policy moderation_read on public.hub_moderation_log for select to authenticated using(public.hub_staff());

revoke all on public.hub_profiles,public.hub_roles,public.hub_workspaces,public.hub_questions,public.hub_answers,public.hub_question_votes,public.hub_answer_votes,public.hub_reports,public.hub_feedback,public.hub_moderation_log from anon,authenticated;
grant select on public.hub_profiles,public.hub_roles,public.hub_workspaces,public.hub_questions,public.hub_answers,public.hub_question_votes,public.hub_answer_votes,public.hub_reports,public.hub_feedback,public.hub_moderation_log to authenticated;
grant insert(id,name,rank,department,bio,experience,country,photo), update(name,rank,department,bio,experience,country,photo) on public.hub_profiles to authenticated;
grant insert(id,title,body,department,equipment,tags,photos),update(title,body,status,outcome,accepted) on public.hub_questions to authenticated;
grant insert(id,question_id,text,basis,photos) on public.hub_answers to authenticated;
grant insert,delete on public.hub_question_votes,public.hub_answer_votes to authenticated;
grant insert(id,question_id,reason) on public.hub_reports to authenticated;
grant insert(id,message,topic) on public.hub_feedback to authenticated;
create function public.hub_save_workspace(payload jsonb,expected_version integer) returns integer language plpgsql security definer set search_path='' as $$
declare v integer; u uuid:=auth.uid();
begin
 if u is null then raise exception 'Sign in required';end if;
 if jsonb_typeof(payload)<>'object' or octet_length(payload::text)>700000 then raise exception 'Workspace too large';end if;
 if expected_version=0 then insert into public.hub_workspaces(user_id,data) values(u,payload) on conflict do nothing returning version into v;
 else update public.hub_workspaces set data=payload,version=version+1,updated_at=now() where user_id=u and version=expected_version returning version into v;end if;
 if v is null then raise exception using errcode='40001',message='Your data changed on another device. Reload before saving again.';end if;
 return v;
end $$;
create function public.hub_moderate(kind text,target uuid,hide boolean,reason text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.hub_staff() or length(trim(reason))<3 then raise exception 'Moderator access and a reason are required';end if;
 if kind='question' then update public.hub_questions set hidden=hide where id=target;
 elsif kind='answer' then update public.hub_answers set hidden=hide where id=target;
 else raise exception 'Invalid target';end if;
 insert into public.hub_moderation_log(actor,kind,target,hidden,reason) values(auth.uid(),kind,target,hide,reason);
end $$;
revoke all on function public.hub_staff(),public.hub_content_guard(),public.hub_save_workspace(jsonb,integer),public.hub_moderate(text,uuid,boolean,text) from public,anon;
grant execute on function public.hub_staff(),public.hub_save_workspace(jsonb,integer),public.hub_moderate(text,uuid,boolean,text) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('hub-photos','hub-photos',false,2097152,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create function public.hub_can_read_photo(path text) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and (
 split_part(path,'/',1)=auth.uid()::text or
 exists(select 1 from public.hub_profiles p where p.photo=path) or
 exists(select 1 from public.hub_questions q where path=any(q.photos) and not q.hidden) or
 exists(select 1 from public.hub_answers a join public.hub_questions q on q.id=a.question_id where path=any(a.photos) and not a.hidden and not q.hidden));
$$;
revoke all on function public.hub_can_read_photo(text) from public,anon;
grant execute on function public.hub_can_read_photo(text) to authenticated;
create policy hub_photo_insert on storage.objects for insert to authenticated with check(bucket_id='hub-photos' and (storage.foldername(name))[1]=auth.uid()::text);
create policy hub_photo_read on storage.objects for select to authenticated using(bucket_id='hub-photos' and public.hub_can_read_photo(name));
create policy hub_photo_delete on storage.objects for delete to authenticated using(bucket_id='hub-photos' and (storage.foldername(name))[1]=auth.uid()::text);
commit;

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
