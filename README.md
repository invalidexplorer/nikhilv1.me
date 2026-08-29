# nikhil-verma.me

My personal site — a single-page portfolio: who I am, what I've shipped at AWS, research,
education, and how to reach me. Live at **[nikhil-verma.me](https://nikhil-verma.me/)**.

It's a California-sunset theme with two moods (`twilight` and `golden hour`) that you can
flip with the header toggle, by poking the sun, or by typing `sunset`.

## Stack

Hand-written HTML, CSS, and vanilla JavaScript. That's the whole list.

- **No build step.** No bundler, no transpiler, no CSS preprocessor.
- **No framework**, no jQuery, no Bootstrap.
- **No npm.** There is no `package.json` and there should never be one.
- **No dependencies vendored into the repo.** The only third-party code is loaded from a
  CDN at runtime: [Google Fonts](https://fonts.google.com/) and
  [Font Awesome](https://fontawesome.com/) (both over HTTPS).

What you see in the repo is exactly what gets served. Edit a file, reload the browser.

## Running it locally

Any static file server works. Python is already on macOS:

```sh
python3 -m http.server 4173
```

Then open <http://127.0.0.1:4173/>.

Serving over HTTP rather than opening `index.html` as a `file://` URL matters — it's the
only way root-absolute paths (`/css/styles.css`) and `404.html` behave the way they do in
production.

To check the 404 page, visit <http://127.0.0.1:4173/404.html>.

## Layout

```
.
├── index.html                    the entire site — every section lives here
├── 404.html                      not-found page; reuses css/styles.css
├── css/styles.css                all styles, incl. the :root design tokens
├── js/scripts.js                 theme toggle, scroll-spy, reveals, rotator, easter eggs
├── assets/
│   ├── img/profile.JPG           headshot (note the uppercase .JPG extension)
│   ├── img/favicon.ico
│   └── NikhilVerma-Resume.pdf    résumé, linked from the nav, hero, and contact section
├── CNAME                         custom domain for GitHub Pages
├── .nojekyll                     tells GitHub Pages to skip Jekyll processing
├── robots.txt
└── sitemap.xml
```

## Where to edit what

| I want to change...                    | Go to                                                     |
| -------------------------------------- | --------------------------------------------------------- |
| Any copy, section, or link             | `index.html` — sections are commented and in page order    |
| Colors, spacing, type, either theme    | the `:root` and `[data-theme="golden"]` blocks in `css/styles.css` |
| The rotating hero taglines             | the `PHRASES` array in `js/scripts.js`                     |
| The stat counters                      | `data-count` / `data-prefix` / `data-suffix` attributes in `index.html` |
| Résumé                                 | replace `assets/NikhilVerma-Resume.pdf`, same filename     |
| SEO / social preview text              | the `<meta>` and JSON-LD blocks in the `<head>` of `index.html` |

Two conventions worth knowing before you edit:

- **Asset paths are case-sensitive in production.** GitHub Pages is case-sensitive; macOS
  is not. `assets/img/profile.JPG` really is uppercase, so a lowercase `.jpg` reference
  will work on your laptop and 404 on the live site.
- **`index.html` uses relative paths; `404.html` uses root-absolute paths.** That's
  deliberate. GitHub Pages serves `404.html` for any unmatched request, including deep
  ones like `/a/b/c`, so relative URLs in it would resolve against the wrong directory.

## Deploying

GitHub Pages, straight off the default branch — push and it publishes. There is no CI step
and nothing to compile.

The custom domain comes from `CNAME`, which contains a single line: `nikhil-verma.me`.
**Don't delete or reformat that file** — losing it drops the site back to
`invalidexplorer.github.io/nikhilv1.me`. Note that changing the domain in the repository's
Pages settings rewrites `CNAME`, and vice versa.

`.nojekyll` disables Jekyll processing. Without it, GitHub Pages would silently ignore any
file or directory whose name starts with an underscore.
