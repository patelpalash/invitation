# The Garden Edit — visual and interaction QA

Date: 2026-11-01

## Evidence and comparison target

- Source visual truth: `/workspace/generated_images/exec-e64fc7c0-7f71-46dd-bbda-9812b85aa4cd.png`.
- Source dimensions: 1469 × 1071 px; normalized to 1440 × 1050 px for comparison. This is a generated art-direction concept, not an existing production screen.
- Implementation: `/workspace/invitation/artifacts/desktop-preview.png`, 1440 × 1050 px; browser viewport 1440 × 1050 CSS px, deviceScaleFactor 1. State: initial sample invitation, Sage, both dialogs closed, completed entrance animation. Reduced motion was enabled for deterministic final still captures; ordinary animations were separately recorded and tested.
- Production browser evidence: `artifacts/production-preview.png`, same viewport and density. The compiled app rendered and opened sharing without console or page errors.
- Full-view combined comparison: `artifacts/qa-final-comparison.jpg`, source on the left and implementation on the right in one 2880 × 1050 px comparison.
- Focused combined comparison: `artifacts/qa-typography-comparison.jpg`, matched hero text regions, 1110 × 680 px. The display hierarchy, readable invitation copy, action, and date were inspected at this larger scale.
- Responsive evidence: `artifacts/mobile-preview.png` and `artifacts/mobile-full.jpg`, 390 × 844 CSS px, density 1; browser tests also covered widths 320, 768, 1024, and 1440 px.
- Interaction evidence: `artifacts/share-preview.png`, `artifacts/editor-preview.png`, `artifacts/mobile-share.png`, and the real browser recording `artifacts/animated-preview.mp4` (15 seconds).
- Alternate palettes: `artifacts/rose-preview.png` and `artifacts/nocturne-preview.png`.

## Findings

No actionable P0, P1, or P2 issues remain in the reviewed scope.

### Fonts and typography

Cormorant Garamond supplies the high-contrast serif names, italic accent, narrative copy, and editorial headings. DM Sans supplies compact utility text and forms. Fonts are hosted locally and loaded correctly. The name hierarchy and two-line arrangement follow the source; long names scale to remain contained. The real font's calligraphic ampersand differs from the generated reference's glyph; this is an accepted font interpretation for the original template. Editable copy is intentionally different from the concept, and remains coherent across the hero, schedule, card, and share flow.

### Spacing and layout rhythm

The revised desktop hero uses an approximately 40/60 split, generous page margins, an arched photograph, and a clear names → invitation → action → date hierarchy. The next chapter is visible at the bottom of the reference viewport. Section spacing, dividers, event columns, and mobile stacking were reviewed in full-page captures. No horizontal overflow or clipped primary controls was observed at the tested widths. The mobile story photograph now has the intended crop rather than retaining its intrinsic HTML height.

### Colors and visual tokens

Ivory, moss, and terracotta preserve the concept's palette. Accent colors were darkened slightly for readable small text. Rose's secondary text was also darkened after a contrast failure. Sage, Rose, and Nocturne, plus the editor and sharing dialogs, pass the selected automated WCAG A/AA rules. Focus indicators and selected palettes remain visible. Automated checks supplement, rather than replace, manual keyboard and visual inspection.

### Image quality, assets, and icons

The hero and table-detail photographs were generated as individual raster assets with matching warm light, ivory flowers, palace setting, and natural green palette. WebP versions preserve detail while reducing transfer size. Masking, focal placement, and responsive crops were inspected. The portrait download is a real 1080 × 1350 PNG using the selected names and palette. The source's partially visible botanical decoration at the next section is omitted as a nonessential concept embellishment; primary photographic content is implemented. UI icons and the favicon use the Phosphor library. No illustrative assets were substituted with CSS drawings or handcrafted SVGs.

### Content, states, and interaction

The sample names, future wedding date, venue, and coherent wedding copy appear throughout the page. Personalization persists on reload and renders for a guest in a fresh browser context through the shared URL, including Unicode names. WhatsApp, email, Facebook, native sharing, and clipboard payloads were checked. PNG and calendar downloads complete; the calendar's 4 PM IST ceremony is represented as 10:30 AM UTC. Maps uses the selected venue. Accordions, form validation, cancel, reset, and save controls work. Dialog focus is trapped and restored, and Escape discards unsaved edits. Reduced-motion preference disables entrance/parallax travel and notification motion. No browser page or console errors were recorded.

## Comparison history

1. **Initial comparison — blocked.** Evidence: `artifacts/qa-first-comparison.jpg`, `artifacts/desktop-first-pass.png`, `artifacts/mobile-full-first-pass.png`. P2: hero typography and spacing pushed the next chapter below the source's composition. P2: the mobile story photograph retained its HTML height, creating an excessively tall section. Fixes: adjusted hero column proportions, name scale and vertical spacing; set the story image's CSS height to auto and provided the intended aspect ratio.
2. **Interaction/accessibility review — blocked.** The first keyboard test found that React autofocus ran before the native dialog opened. The first accessibility runs found an unlabeled countdown role and insufficient text contrast in the original accent and Rose secondary text. Fixes: explicitly focus the first field after `showModal()`, give the countdown timer semantics without live second-by-second announcements, darken the relevant tokens, and respect reduced motion in notifications. Tests retained the original assertions.
3. **Final comparison — passed.** The final combined full-view and typography comparisons, mobile full-page capture, stable dialog captures, both alternate palettes, and browser recording were inspected after the fixes. The final browser suite completed 13 tests successfully. Production build and compiled-page smoke checks passed. No P0/P1/P2 differences remain; the image and font variations noted above are intentional art-direction interpretations.

## Open questions and limits

- Instagram blocked access to all six supplied references. This is an original template; no claim is made that the reels were inspected or reproduced.
- This is a locally running, frontend-only website, not a public deployment. Guest sharing requires a publicly reachable HTTPS address. Social crawler thumbnails show the static sample; per-couple crawler thumbnails require future server-rendered metadata. Personalized card downloads already work.
- No RSVP backend is included. Real social-platform delivery was not performed; tests verify outgoing sharing URLs and browser-native payloads without sending messages.
- Responsive Chromium coverage is verified; physical-device Safari and Android testing remains optional follow-up.

## Implementation checklist

- [x] Inspect the source and final full-view/focused combined comparisons.
- [x] Fix the initial layout, image-height, focus, semantics, and contrast findings.
- [x] Verify desktop, tablet, phone, reduced motion, and keyboard use.
- [x] Verify personalization and guest sharing end to end.
- [x] Verify actual PNG and calendar output.
- [x] Complete 13 browser tests, clean lockfile installation, production build, and production smoke check.

## Delivery follow-up

The user could not open the workspace artifact links in the cloud-onboarding chat. Those links were internal files, not public web URLs. No public site has been deployed. The chat has no connected hosting or preview service, and the read-only GitHub API request returned Forbidden. Public delivery remains blocked on an available hosting target and its required access; this does not change the visual QA result.

Production assets now use a relative base and base-aware image URLs. A production browser smoke check under `/invitation/` verified the rendered page, hero image, share URL, and personalized card download without browser errors. The static website archive was refreshed. This permits root-domain hosting and project-subdirectory hosting without missing assets.

final result: passed
