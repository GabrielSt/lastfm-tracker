# Last.fm Tracker

App que sincroniza seus scrobbles do Last.fm diariamente e exibe rankings com evolução de posição ao longo do tempo.

## Arquitetura

```
GitHub Actions (cron diário)
  → busca dados da API do Last.fm
  → salva snapshots em frontend/public/data/
  → commit automático no repositório

Vercel (deploy automático)
  → detecta o commit do GitHub Actions
  → publica o frontend estático
  → frontend lê os JSONs de /data/ diretamente
```

**Sem backend rodando em produção.** O sync é feito pelo GitHub Actions, os dados ficam no próprio repositório como arquivos JSON estáticos.

---

## Setup inicial

### 1. Fork / clone este repositório no GitHub

```bash
git clone https://github.com/SEU_USER/lastfm-tracker
cd lastfm-tracker
```

### 2. Crie sua API key gratuita do Last.fm

1. Acesse https://www.last.fm/api/account/create
2. Preencha qualquer nome em "Application name" (ex: `meu tracker`)
3. Copie a **API key** (não o Shared Secret)

### 3. Configure os secrets no GitHub

No repositório → **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Valor |
|--------|-------|
| `LASTFM_USERNAME` | Seu username do Last.fm (ex: `bielnn`) |
| `LASTFM_API_KEY` | A API key copiada no passo 2 |

Opcional — em **Variables** (não Secrets):

| Variable | Valor padrão | Descrição |
|----------|-------------|-----------|
| `MAX_PAGES` | `0` | Limite de páginas por sync (0 = tudo) |

### 4. Rode o primeiro sync manualmente

No GitHub → **Actions → Daily Last.fm Sync → Run workflow**

Isso vai buscar seus dados e fazer o primeiro commit com os snapshots.

### 5. Deploy no Vercel

1. Acesse https://vercel.com e crie conta (gratuita)
2. **Add New Project** → importe seu repositório do GitHub
3. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Deploy

A partir daí, toda vez que o GitHub Actions fizer commit (diariamente às 6h UTC), o Vercel faz deploy automático.

---

## Desenvolvimento local

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend local: http://localhost:3001

Em desenvolvimento, o frontend detecta automaticamente se o backend Express está rodando e usa ele. Se não estiver, lê os JSONs de `frontend/public/data/`.

Configure o backend local em http://localhost:5173/settings (username + API key).

---

## Sync manual em produção

No GitHub → **Actions → Daily Last.fm Sync → Run workflow**

Ou via GitHub CLI:
```bash
gh workflow run sync.yml
```

---

## Estrutura dos dados

```
frontend/public/data/
  config.json              # { username, lastSync }
  snapshots/
    index.json             # { dates: ["2026-05-13", ...] }
    2026-05-13.json        # snapshot do dia
    2026-05-14.json
    ...
```

Cada snapshot tem:
```json
{
  "date": "2026-05-13",
  "username": "bielnn",
  "syncedAt": "2026-05-13T06:00:00Z",
  "artists": [{ "rank": 1, "name": "...", "scrobbles": 1234 }],
  "tracks":  [{ "rank": 1, "name": "...", "artist": "...", "scrobbles": 89 }]
}
```
