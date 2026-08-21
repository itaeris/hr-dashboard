# HR Recruitment Dashboard
# Aeris Beaute & From This Island

Next.js + Tailwind + Framer Motion + Supabase.

## Menjalankan lokal

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000), lalu pilih perusahaan.

Tanpa kredensial Supabase, dashboard memakai **data demo** yang tetap bisa diubah di sesi itu.

## Hubungkan Supabase

1. Buat project di [supabase.com](https://supabase.com).
2. SQL Editor → jalankan `supabase/schema.sql` (tabel + data awal).
3. Salin Project URL dan anon key ke `.env.local`:

```bash
cp .env.example .env.local
```

4. Restart `npm run dev`. Badge sidebar berubah menjadi **Supabase live**.

Kebijakan RLS di schema sengaja terbuka untuk MVP internal. Tambahkan auth sebelum dipakai produksi.
