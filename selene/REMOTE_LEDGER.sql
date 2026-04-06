create table if not exists projects (
  project_id text primary key,
  name text not null,
  repo_url text,
  default_branch text,
  created_at timestamptz not null default now()
);

create table if not exists runs (
  run_id text primary key,
  project_id text not null references projects(project_id),
  spec_id text,
  goal text not null,
  intent text not null,
  status text not null,
  base_commit text,
  branch text,
  actor_id text,
  editor text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists specs (
  spec_id text primary key,
  project_id text not null references projects(project_id),
  run_id text references runs(run_id),
  goal text not null,
  intent text not null,
  status text not null,
  target_files jsonb not null,
  verification_plan jsonb not null,
  exit_criteria jsonb not null,
  split_tasks jsonb,
  content_md text,
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  task_id text primary key,
  run_id text not null references runs(run_id),
  spec_id text not null references specs(spec_id),
  owner text,
  status text not null,
  target_files jsonb not null,
  verification_plan jsonb,
  base_commit text,
  branch text,
  created_at timestamptz not null default now()
);

create table if not exists events (
  event_id bigserial primary key,
  run_id text not null references runs(run_id),
  task_id text references tasks(task_id),
  actor_id text,
  step text not null,
  status text not null,
  failure_type text,
  payload_json jsonb,
  created_at timestamptz not null default now()
);

create table if not exists artifacts (
  artifact_id text primary key,
  run_id text not null references runs(run_id),
  task_id text references tasks(task_id),
  type text not null,
  url text not null,
  metadata_json jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_runs_project_id on runs(project_id);
create index if not exists idx_runs_spec_id on runs(spec_id);
create index if not exists idx_tasks_run_id on tasks(run_id);
create index if not exists idx_tasks_spec_id on tasks(spec_id);
create index if not exists idx_events_run_id on events(run_id);
create index if not exists idx_events_task_id on events(task_id);
create index if not exists idx_artifacts_run_id on artifacts(run_id);
