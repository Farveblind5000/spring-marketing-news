---
title: "Komandoer — copy-paste reference"
type: reference
protection: normal
claude_write_access: true
updated: 2026-05-07
---

# 🖥️ Komandoer

> Copy-paste reference. Hver blok er én kommando — kopier kun selve kommandoen, ikke kommentarerne (linjer der starter med `#`).

---

## 📂 Working directory

Alle kommandoer kører fra projekt-roden:

```
cd "C:\Users\mieo\OneDrive - Spring Family ApS\Desktop\Projects\spring-marketing-news"
```

---

## 🔄 Prompt-ændringer (Obsidian → Supabase)

### 1) Sync prompts til Supabase

```
node scripts/sync-prompt.js
```

Kør efter du har redigeret en fil i `01_docs/Prompts/`.
Synker BÅDE Digest System Prompt OG Short Summary Prompt.

### 2) Ryd short_summary cache (kun hvis nødvendigt)

Kør i **Supabase Dashboard → SQL Editor**:

```sql
UPDATE articles
SET short_summary = NULL, short_summary_generated_at = NULL
WHERE short_summary IS NOT NULL;
```

Bruges KUN når du har ændret Short Summary Prompt og vil have eksisterende cached opsummeringer regenereret.

---

## 👤 Auth (manuel brugeroprettelse)

### Bekræft ny bruger

Kør i **Supabase SQL Editor** efter du har oprettet bruger via dashboard:

```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'NY_EMAIL@spring-cc.com';
```

Erstat `NY_EMAIL@spring-cc.com` med den faktiske email.

---

## 🚀 Deployment

### Vercel — frontend deploy

```
vercel --prod
```

Kører fra projekt-roden. Tager 30-60 sekunder.

### Git — commit + push

```
git add -A
```

Erstat commit-message:

```
git commit -m "feat: din besked her"
```

```
git push origin main
```

### Edge Function deploy (kun hvis du ændrer i `supabase/functions/`)

```
.\supabase-cli\supabase.exe functions deploy NAVN --project-ref mdevyscqhpaogvsblfyp
```

Erstat `NAVN` med fx `scrape-articles` eller `generate-digest`.

---

## 🔧 Lokal udvikling

### Dev server (test lokalt)

```
npm run dev
```

Åbn `http://localhost:3000`

### Build check (verificér alt compilerer)

```
npm run build
```

### Install nye dependencies

```
npm install
```

---

## ⚙️ Manuelle triggers

### Trigger scraper (hent nye artikler nu)

I **Supabase Dashboard → Edge Functions → `scrape-articles` → Test**.
HTTP method: `POST`. Body: `{}`. Klik **Send Request**.

---

## 🗃️ DB inspektion

### Antal artikler i feed

```sql
SELECT COUNT(*) FROM articles WHERE scraped_at >= NOW() - INTERVAL '30 days';
```

### Mine valgte digest-artikler

```sql
SELECT a.title, a.url, q.added_at
FROM user_digest_queue q
JOIN articles a ON a.id = q.article_id
WHERE q.user_id = auth.uid()
ORDER BY q.added_at DESC;
```

### Aktive RSS-kilder

```sql
SELECT name, feed_url, last_scraped FROM sources WHERE active = true;
```

### Tjek prompts i settings

```sql
SELECT key, LEFT(content, 100) AS preview, updated_at FROM settings;
```

---

## 🆘 Fejlsøgning

### "Cannot find module ... .js#"

Du har inkluderet `#`-tegnet i kommandoen. Kopier kun selve `node scripts/sync-prompt.js` — ikke kommentaren foran (`# 1. I terminalen`).

### Vercel deploy fejler med ECONNRESET

Netværksfejl. Kør `vercel --prod` igen. Selve deployet er sandsynligvis allerede gennemført (tjek dashboard).

### `npm run build` fejler med EPERM på `.next`

Dev-server holder filer låst. Kør:

```
rmdir /s /q .next
```

```
npm run build
```

---

## 🎯 Typiske workflows

### Workflow A — Justér prompt for short summary

Trin 1: Sync prompt til Supabase

```
node scripts/sync-prompt.js
```

Trin 2: Ryd cache (i Supabase SQL Editor)

```sql
UPDATE articles SET short_summary = NULL, short_summary_generated_at = NULL WHERE short_summary IS NOT NULL;
```

Trin 3: Test ved at klikke ⚡ på en artikel.

### Workflow B — Justér prompt for digest

Trin 1: Sync prompt til Supabase

```
node scripts/sync-prompt.js
```

Trin 2: Gå til `/digest` → klik "Generer digest". Den nye prompt bruges automatisk.

### Workflow C — Fuld redeploy (kode-ændring + push)

```
git add -A
```

```
git commit -m "din besked"
```

```
git push origin main
```

```
vercel --prod
```

---

_Tilføj nye kommandoer her efterhånden som workflows udvikles._
