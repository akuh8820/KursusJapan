-- 0002: izinkan siapa pun MEMBACA laporan/feedback lewat anon key.
-- INSERT sudah terbuka sejak 0001. SELECT dibuka agar feedback masa beta
-- bisa ditinjau tanpa akun (isi tabel tidak memuat data sensitif;
-- kolom user_id sengaja null untuk laporan tanpa login).

create policy "siapa pun boleh membaca laporan"
  on public.error_reports for select
  using (true);
