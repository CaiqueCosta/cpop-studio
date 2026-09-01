# CPoP Studio website

Public site for [cpopstudio.com](https://cpopstudio.com) — studio home plus per-app Privacy Policy and Support pages for App Store Connect.

This repository is the **live source of truth** for the studio site. It is published with **GitHub Pages** from the `main` branch root (`/`).

## Preview locally

```bash
python3 -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080).

## App Store URLs (after Pages + domain are live)

| App | Privacy Policy | Support |
|-----|----------------|---------|
| Pinta Puzzle | `https://cpopstudio.com/apps/pinta-puzzle/privacy.html` | `https://cpopstudio.com/apps/pinta-puzzle/support.html` |
| Seabay | `https://cpopstudio.com/apps/seabay/privacy.html` | `https://cpopstudio.com/apps/seabay/support.html` |

Seabay email confirmation / Auth redirect (set as the hosted Supabase **Site URL**, and add it under **Additional Redirect URLs**):

`https://cpopstudio.com/apps/seabay/confirmed.html`

The previous path `https://cpopstudio.com/apps/vessla/confirmed.html` still redirects to the new URL.

## GitHub Pages

1. Repo **Settings → Pages**
2. Source: Deploy from branch **`main`**, folder **`/`**
3. Custom domain: **`cpopstudio.com`** (this repo includes a `CNAME` file)
4. After DNS verifies, enable **Enforce HTTPS**

### DNS (apex domain)

At your registrar, point `cpopstudio.com` at GitHub Pages:

**A records**

- `185.199.108.153`
- `185.199.109.153`
- `185.199.110.153`
- `185.199.111.153`

**AAAA records**

- `2606:50c0:8000::1111`
- `2606:50c0:8001::1111`
- `2606:50c0:8002::1111`
- `2606:50c0:8003::1111`

Optional: CNAME `www` → `caiquecosta.github.io`

Until DNS is ready, the project site URL is:

`https://caiquecosta.github.io/cpop-studio/`

## Contact

support@cpopstudio.com
