# Save State documentation site

The site uses [Fumadocs](https://fumadocs.dev/) for its MDX-driven documentation, navigation, search, responsive reading layout, and code blocks. [Radix Themes](https://www.radix-ui.com/themes) provides the accessible layout and control components used by the landing page and live examples.

The docs use the actual `savestate` workspace package. Examples do not duplicate the library components.

## Run locally

From the repository root:

```bash
pnpm install
pnpm --filter docs dev
```

The docs development and build scripts build `packages/savestate` first, so the exported `savestate/styles.css` resolves from a clean checkout.

## Deploy to GitHub Pages

The docs app is statically exported to `apps/docs/out`. Its documentation search index is generated at build time and searched in the browser, so Pages does not need a server or API route.

The `Deploy docs to GitHub Pages` workflow handles project-site base paths automatically, including repository sites such as `https://<org>.github.io/<repo>/` and organization sites such as `https://<org>.github.io/`.

In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**. Push to `main` or run the workflow manually to publish.

### Use a custom domain

Add a file at `apps/docs/public/CNAME` containing only your domain, for example `docs.example.com`. The Pages workflow will then build the site at the domain root instead of adding the repository-name path. Configure the same custom domain under **Settings → Pages**, point your domain's DNS records to GitHub Pages, and enable HTTPS after DNS verification.

## Documentation content

Write guides in `content/docs` as MDX:

- `index.mdx` — installation and first autosaving editor
- `components.mdx` — live component gallery and component APIs
- `api.mdx` — hook options, values, statuses, events, and storage
- `examples.mdx` — common save patterns and customization
