# arjun-sivasankar.github.io

Personal site of **Arjun Sivasankar**, AI Engineer: <https://arjun-sivasankar.github.io/>

Plain HTML, one stylesheet, one script. No framework, no build step, no package manager, no third-party requests. GitHub Pages serves the repository root directly.

## What is on the page

1. **Intro and hero**: a short portrait reel plays full screen once per browser session (skippable, never under reduced motion), then hands over to the hero, where the same reel sits in a studio-grey spotlight.
2. **Selected work**: four case studies, each with a live system diagram. The diagrams are inline SVG: an amber packet travels the real pipeline, each stage lights up as it arrives, and a caption narrates the stage. They only run while on screen.
3. **Also shipped**, **Experience** (newest first, a timeline whose rail fills as you scroll), **Research and recognition**.
4. **The stack**: a cross-section of one system, from the interface down to the GPUs. Each layer lists its tools, where it was shipped and one proof figure; a request packet travels down the rail as you scroll and lights each layer it reaches. Evaluation and compliance sit beside it as the spine around every layer.
5. **Education**, **Contact**.

## Layout

| Path | Purpose |
| --- | --- |
| `index.html` | The whole page, including the four diagram SVGs |
| `assets/css/site.css` | All styling, including print and reduced-motion rules |
| `assets/js/site.js` | Progressive enhancement: intro, hero reel, diagrams, current-section marker, timeline rail, stack packet |
| `assets/fonts/` | Schibsted Grotesk, self-hosted (no Google Fonts request, which matters under GDPR) |
| `assets/video/reel.mp4` | The portrait reel |
| `assets/img/` | Reel poster frames, portrait, social card, touch icon, raster favicon |
| `favicon.svg` | Primary icon |
| `robots.txt`, `sitemap.xml` | Crawler hints |
| `.nojekyll` | Skip Jekyll processing on Pages |

## Editing

- Content is plain markup in `index.html`, grouped into `<section>` blocks with ids that the navigation links to.
- Colours and sizes are CSS custom properties at the top of `site.css`. Amber (`--amber`) means one thing on the page: data moving.
- **Diagrams.** Each `<figure data-sys>` holds an SVG with one or more `.sys-path` lines, `.node` groups and `.packet` circles. A node belongs to a path through `data-path="<index>"` and says its caption through `data-say`. A packet sets its loop time in seconds with `data-dur`. The script finds where each node sits along its path by itself, so moving a node only means moving its `<rect>` and `<text>`.
- The page works without JavaScript: diagrams show their static state, the timeline rail is fully drawn, and the hero shows its poster frame.

## Local preview

Asset paths are root-relative, so serve the folder rather than opening the file:

```sh
python -m http.server 8765
```

Then open <http://127.0.0.1:8765/>.

## Deploying

Push to `main`; Pages rebuilds in about a minute.

```sh
git add -A
git commit -m "Update site"
git push
```

The repository name must stay `Arjun-Sivasankar.github.io` (matching the hyphenated username) for GitHub to serve it at the domain root instead of under a project subpath.

## Content source of truth

Copy is derived from `Arjun_Sivasankar_Master_Profile.md`, which lives outside this repository. Facts are never invented here. If something changes on the page, change the master profile as well.

## Credits

The site was rebuilt from scratch in November 2026. Its earlier version used the **Dimension** template by [HTML5 UP](https://html5up.net) (CCA 3.0); that code and its licence file remain in git history at commit `725bae4`, and no template code is used by the current page.
