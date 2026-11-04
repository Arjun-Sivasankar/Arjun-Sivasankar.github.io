# arjun-sivasankar.github.io

Personal site of **Arjun Sivasankar**, AI Engineer — <https://arjun-sivasankar.github.io/>

Plain HTML, one stylesheet, one small script. No framework, no build step, no package manager, no third-party requests. GitHub Pages serves the repository root directly.

## Layout

| Path | Purpose |
| --- | --- |
| `index.html` | The whole page: hero, experience, education, projects, skills, research, contact |
| `assets/css/site.css` | All styling, including print rules |
| `assets/js/site.js` | ~1 KB of progressive enhancement (copy-email, current year) |
| `assets/img/portrait.jpg` | Web-sized portrait, 883 × 1040 |
| `assets/img/social-card.jpg` | 1200 × 630 Open Graph card |
| `assets/img/apple-touch-icon.png` | 180 × 180 touch icon |
| `assets/img/favicon-32.png` | Raster favicon fallback |
| `favicon.svg` | Primary icon |
| `robots.txt`, `sitemap.xml` | Crawler hints |
| `.nojekyll` | Skip Jekyll processing on Pages |

## Editing

- Content is plain markup in `index.html`, grouped into `<section>` blocks with ids that the header navigation links to.
- Styling lives in a single file, driven by CSS custom properties at the top (`--bg`, `--fg`, `--accent`, `--maxw`). Change a token there rather than hunting for hex codes.
- Typography uses a system font stack on purpose: nothing is fetched from Google or any other host, which keeps the page fast and avoids the GDPR problems that third-party font loading creates in Germany.
- Icons are text labels with arrows, so there is no icon font to load.

## Deploying

Push to `main`; Pages rebuilds in about a minute.

```sh
git add -A
git commit -m "Update site"
git push
```

The repository name must stay `Arjun-Sivasankar.github.io` (matching the hyphenated username) for GitHub to serve it at the domain root instead of under a project subpath.

## Content source of truth

Copy is derived from `Arjun_Sivasankar_Master_Profile.md`, which lives outside this repository. Facts are never invented here — if something changes on the page, change the master profile as well.

## Credits

The site was rebuilt from scratch in November 2026. Its earlier version used the **Dimension** template by [HTML5 UP](https://html5up.net) (CCA 3.0); that code and its licence file remain in git history at commit `725bae4`, and no template code is used by the current page.
