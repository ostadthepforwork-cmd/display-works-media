-- Tighten cms-media storage access.
-- Public buckets can serve files by URL without a SELECT policy on storage.objects.
-- Removing this policy prevents authenticated clients from listing every file in the bucket.

drop policy if exists "cms-media auth read" on storage.objects;
