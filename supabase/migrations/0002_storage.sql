-- Public bucket for task photos (issue photos + completion photos).
-- Public read (so photo URLs work in emails/UI without signed URLs),
-- authenticated write, owner-or-admin delete.

insert into storage.buckets (id, name, public)
values ('task-photos', 'task-photos', true)
on conflict (id) do nothing;

create policy "task-photos public read"
  on storage.objects for select
  using (bucket_id = 'task-photos');

create policy "task-photos authenticated upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'task-photos');

create policy "task-photos owner or admin delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'task-photos'
    and (owner = auth.uid() or public.current_role() = 'admin')
  );
