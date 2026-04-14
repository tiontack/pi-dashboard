create table if not exists public.pi_documents (
  doc_key text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create or replace function public.set_pi_documents_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists trg_pi_documents_updated_at on public.pi_documents;
create trigger trg_pi_documents_updated_at
before update on public.pi_documents
for each row
execute function public.set_pi_documents_updated_at();

alter table public.pi_documents enable row level security;

drop policy if exists "allow anon select pi_documents" on public.pi_documents;
create policy "allow anon select pi_documents"
on public.pi_documents
for select
to anon
using (true);

drop policy if exists "allow anon insert pi_documents" on public.pi_documents;
create policy "allow anon insert pi_documents"
on public.pi_documents
for insert
to anon
with check (true);

drop policy if exists "allow anon update pi_documents" on public.pi_documents;
create policy "allow anon update pi_documents"
on public.pi_documents
for update
to anon
using (true)
with check (true);
