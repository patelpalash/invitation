# amarā — The Garden Edit

One animated wedding invitation, with a romantic Udaipur garden and an editorial visual style. Built with React, TypeScript, Vite, Motion, Phosphor icons, and locally hosted fonts and photographs.

## Run

```sh
cd /workspace/invitation
npm ci
npm run dev -- --port 5173 --strictPort
```

Use the existing checkout; a separate Git worktree is unnecessary. Node.js 24 and npm 11 were used for this build.

## The experience

- Cinematic entrance, scroll reveals, subtle photographic parallax, live countdown, and reduced-motion support.
- Responsive story, celebration schedule, venue directions, guest details, and calendar download.
- “Make it yours” edits names, date, location, messages, and the Sage, Rose, or Nocturne colour palette. This is one template with three palettes.
- Save updates the invitation URL and saves a local draft. Cancel discards the editing session.
- The share link contains the invitation itself, so a guest can open the personalized page without an account or access to the creator’s browser storage.
- WhatsApp, email, Facebook, copy-link, and native browser sharing; a personalized 1080 × 1350 PNG invitation card for social stories.

The sample event and generated editorial photographs are illustrative. The schedule uses India Standard Time. Calendar downloads convert the 4 PM ceremony to UTC correctly.

## Verify

```sh
npm run build
npm test
```

Browser tests use `/usr/bin/chromium`, which is installed in this cloud environment. They start the dev server if needed and exercise fresh-guest sharing, Unicode names, clipboard and native share payloads, PNG and calendar downloads, dialog keyboard behavior, responsive layouts, and automated WCAG AA checks. Visual evidence is in `artifacts/`; `design-qa.md` records the comparison with the generated concept.

To regenerate screenshots and the default social preview while the dev server is running:

```sh
node scripts/capture.mjs
```

## Public sharing

GitHub Pages is the selected deployment target. `.github/workflows/deploy-pages.yml` builds and deploys pushes to `main` and also supports a manual run. In the GitHub repository, **Settings → Pages → Build and deployment → Source** must be **GitHub Actions**. The workflow uses GitHub's built-in token, so the website itself needs no deployment token. The expected address is `https://patelpalash.github.io/invitation/`; this is not a claim that deployment has completed. Confirm the workflow succeeds and the public page renders before sharing it.

`npm run build` creates `dist/`, which can be served by a static host at its root domain or in a project subdirectory, such as GitHub Pages. No API credentials or database are required. The site has not been deployed by this build. Local preview URLs only work where the development server is reachable; deploy to a public HTTPS domain before sending invitations to guests.

Social apps can preview `public/social-card.jpg` with the sample names. Link fragments are not visible to social crawlers, so per-couple social thumbnails need a future server-rendered sharing endpoint. Personalized card downloads already use the edited names, date, and palette.

Anyone with an invitation URL can read its details; link encoding is not encryption. No RSVP or guest-response backend is included. Nothing is sent to social platforms until the visitor chooses a sharing action.

## Extend

Invitation data, validation, share encoding, calendar files, and card rendering live in `src/invitation.ts`. The page and editor are in `src/App.tsx`; styling and responsive breakpoints are in `src/styles.css`. Add future templates as separate page components that consume the same invitation data and sharing functions.
