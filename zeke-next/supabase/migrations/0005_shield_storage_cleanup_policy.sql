-- Permit an uploader or admin to remove a private Shield object when a
-- metadata insert fails or an authorised evidence record is later withdrawn.

drop policy if exists shield_case_file_delete on storage.objects;
create policy shield_case_file_delete on storage.objects for delete to authenticated
using (
  bucket_id = 'shield-case-files'
  and array_length(storage.foldername(name), 1) >= 2
  and (
    (storage.foldername(name))[2] = auth.uid()::text
    or public.is_admin()
  )
  and exists (
    select 1 from public.shield_cases sc
    where sc.id::text = (storage.foldername(name))[1]
      and (sc.creator_id = auth.uid() or public.is_admin())
  )
);
