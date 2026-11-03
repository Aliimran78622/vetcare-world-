-- VetCare World community likes and comments
-- Run once in Supabase SQL Editor after the posts table exists.
-- Assumes public.posts.id is UUID and public.posts.user_id references auth.users.

create table if not exists public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 1000),
  created_at timestamptz not null default now()
);

alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;

drop policy if exists "Public can read post likes" on public.post_likes;
create policy "Public can read post likes" on public.post_likes
for select to anon, authenticated using (true);

drop policy if exists "Members can like posts" on public.post_likes;
create policy "Members can like posts" on public.post_likes
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "Members can remove own likes" on public.post_likes;
create policy "Members can remove own likes" on public.post_likes
for delete to authenticated using (user_id = auth.uid());

drop policy if exists "Public can read comments" on public.post_comments;
create policy "Public can read comments" on public.post_comments
for select to anon, authenticated using (true);

drop policy if exists "Members can comment" on public.post_comments;
create policy "Members can comment" on public.post_comments
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "Members can delete own comments" on public.post_comments;
create policy "Members can delete own comments" on public.post_comments
for delete to authenticated using (user_id = auth.uid());

create index if not exists post_likes_post_id_idx on public.post_likes(post_id);
create index if not exists post_comments_post_id_created_at_idx on public.post_comments(post_id, created_at);
