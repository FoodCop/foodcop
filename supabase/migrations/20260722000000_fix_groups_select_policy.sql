-- Fixes a real, fully-blocking bug found while verifying group chat
-- end-to-end (per the 2026-07-19 backlog's Group 0 item 2): creating a
-- group has always 403'd with "new row violates row-level security policy
-- for table groups" - confirmed via direct psql testing that this is NOT a
-- WITH CHECK failure on the INSERT itself (a bare INSERT with no RETURNING
-- succeeds cleanly), but a RETURNING/SELECT-policy failure: chatService.ts's
-- createGroup() does `.insert({...}).select().single()`, and Postgres/
-- PostgREST requires the newly-inserted row to also satisfy the table's
-- SELECT policy to return it. The existing SELECT policy
-- (`is_group_member(id, auth.uid())`) can never pass for a brand-new group,
-- because the creator's own group_members row is only inserted in a SEPARATE,
-- later query - a chicken-and-egg the original policy never accounted for.
--
-- This has been broken since 20260718000000_chat_and_social.sql shipped;
-- "Create Group" has never actually worked in this app until this fix.

drop policy if exists "Members can view their groups." on public.groups;

create policy "Members can view their groups."
on public.groups for select
using (
  is_group_member(id, auth.uid())
  or created_by = auth.uid()
);
