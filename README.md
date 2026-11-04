# arjun-sivasankar.github.io

Personal site of **Arjun Sivasankar**, AI Engineer — <https://arjun-sivasankar.github.io/>

A static single-page site built on the [Dimension](https://html5up.net/dimension) template by HTML5 UP (CCA 3.0). There is no build step and nothing to install: GitHub Pages serves `index.html` straight from `main`.

## Layout

| Path | Purpose |
| --- | --- |
| `index.html` | All page content, metadata and structured data |
| `assets/css/main.css` | The stylesheet that actually ships |
| `assets/sass/` | Readable SCSS sources for that stylesheet |
| `assets/js/` | jQuery, browser/breakpoint detection and the section logic |
| `assets/webfonts/` | Font Awesome 5 files used by the icon set |
| `assets/favicon.svg` | Site icon |
| `images/` | Photography and project artwork |
| `LICENSE.txt` | CCA 3.0 licence inherited from the template |

## Editing

- **Content** lives in `index.html`. Each section is an `<article>` with an `id` that the navigation links to (`#intro`, `#resume`, `#projects`, `#research`, `#contact`); `assets/js/main.js` turns those into the modal transitions.
- **Styles**: edit the partials in `assets/sass/`, then recompile, because Pages only serves the pre-built `assets/css/main.css`:

  ```sh
  sass assets/sass/main.scss assets/css/main.css
  ```

  Small tweaks can be made directly in `main.css`, which carries a short block of site-specific rules at the end.
- **No external requests.** Fonts resolve through a system stack and Font Awesome is self-hosted, so the page loads nothing from third-party servers.
- **Fonts** are intentionally a system stack rather than a webfont: no Google Fonts request, nothing to pay for GDPR-wise, and no layout shift.

## Deploying

Push to `main`. GitHub Pages rebuilds automatically and the site is served at the repository's root URL within about a minute.

```sh
git add -A
git commit -m "Update site"
git push
```

The repository must be named `Arjun-Sivasankar.github.io` for GitHub to serve it at the domain root rather than under a project path.

## Content source of truth

Copy is derived from `Arjun_Sivasankar_Master_Profile.md`, kept outside this repository. Facts are not invented here; if something on the page changes, change it there first and in both places.
