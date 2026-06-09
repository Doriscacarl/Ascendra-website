# CLAUDE.md — Frontend Website Rules

## Always Do First
- **Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions.

## Reference Images
- If a reference image is provided: match layout, spacing, typography, and color exactly. Swap in placeholder content (images via `https://placehold.co/`, generic copy). Do not improve or add to the design.
- If no reference image: design from scratch with high craft (see guardrails below).
- Screenshot your output, compare against reference, fix mismatches, re-screenshot. Do at least 2 comparison rounds. Stop only when no visible differences remain or user says so.

## Local Server
- **Always serve on localhost** — never screenshot a `file:///` URL.
- Start the dev server: `node serve.mjs` (serves the project root at `http://localhost:3000`)
- `serve.mjs` lives in the project root. Start it in the background before taking any screenshots.
- If the server is already running, do not start a second instance.

## Screenshot Workflow
- Puppeteer is installed at `C:/Users/nateh/AppData/Local/Temp/puppeteer-test/`. Chrome cache is at `C:/Users/nateh/.cache/puppeteer/`.
- **Always screenshot from localhost:** `node screenshot.mjs http://localhost:3000`
- Screenshots are saved automatically to `./temporary screenshots/screenshot-N.png` (auto-incremented, never overwritten).
- Optional label suffix: `node screenshot.mjs http://localhost:3000 label` → saves as `screenshot-N-label.png`
- `screenshot.mjs` lives in the project root. Use it as-is.
- After screenshotting, read the PNG from `temporary screenshots/` with the Read tool — Claude can see and analyze the image directly.
- When comparing, be specific: "heading is 32px but reference shows ~24px", "card gap is 16px but should be 24px"
- Check: spacing/padding, font size/weight/line-height, colors (exact hex), alignment, border-radius, shadows, image sizing

## Output Defaults
- Single `index.html` file, all styles inline, unless user says otherwise
- Tailwind CSS via CDN: `<script src="https://cdn.tailwindcss.com"></script>`
- Placeholder images: `https://placehold.co/WIDTHxHEIGHT`
- Mobile-first responsive

## Brand Assets
- Always check the `brand_assets/` folder before designing. It may contain logos, color guides, style guides, or images.
- If assets exist there, use them. Do not use placeholders where real assets are available.
- If a logo is present, use it. If a color palette is defined, use those exact values — do not invent brand colors.

## Anti-Generic Guardrails
- **Colors:** Never use default Tailwind palette (indigo-500, blue-600, etc.). Pick a custom brand color and derive from it.
- **Shadows:** Never use flat `shadow-md`. Use layered, color-tinted shadows with low opacity.
- **Typography:** Never use the same font for headings and body. Pair a display/serif with a clean sans. Apply tight tracking (`-0.03em`) on large headings, generous line-height (`1.7`) on body.
- **Gradients:** Layer multiple radial gradients. Add grain/texture via SVG noise filter for depth.
- **Animations:** Only animate `transform` and `opacity`. Never `transition-all`. Use spring-style easing.
- **Interactive states:** Every clickable element needs hover, focus-visible, and active states. No exceptions.
- **Images:** Add a gradient overlay (`bg-gradient-to-t from-black/60`) and a color treatment layer with `mix-blend-multiply`.
- **Spacing:** Use intentional, consistent spacing tokens — not random Tailwind steps.
- **Depth:** Surfaces should have a layering system (base → elevated → floating), not all sit at the same z-plane.

## Hard Rules
- Do not add sections, features, or content not in the reference
- Do not "improve" a reference design — match it
- Do not stop after one screenshot pass
- Do not use `transition-all`
- Do not use default Tailwind blue/indigo as primary color
# MOBILE-FIRST DEVELOPMENT RULE (MANDATORY)

## Critical Requirement

This website must always be built using a **mobile-first approach**.

Before creating, modifying, redesigning, or adding any component, page, section, animation, feature, dashboard element, modal, form, or layout:

1. Design and optimize for mobile devices first.
2. Ensure the mobile experience is fully functional before desktop enhancements are added.
3. Every feature must be tested and verified on:

   * Mobile phones (320px–480px)
   * Large phones (481px–768px)
   * Tablets (769px–1024px)
   * Desktop (1025px+)

## Mobile User Priority

Assume most visitors are using mobile devices.

The website must feel premium, fast, and effortless on mobile because restaurant customers commonly:

* Browse while traveling
* Browse while driving (passengers)
* Browse during lunch breaks
* Browse while making reservations
* Browse while deciding where to eat
* Browse on social media links

Mobile users are the primary audience.

## Responsive Standards

Every update must automatically include:

* Responsive layouts
* Responsive typography
* Responsive spacing
* Responsive images
* Responsive videos
* Responsive navigation
* Responsive forms
* Responsive modals
* Responsive buttons
* Responsive menus
* Responsive cards
* Responsive galleries

No horizontal scrolling is allowed.

No content may overflow containers.

No text may be cut off.

No buttons may become unusable.

No images may stretch or distort.

## Performance Standards

Mobile performance is mandatory.

Always:

* Optimize images
* Lazy-load media
* Minimize JavaScript
* Reduce layout shifts
* Maintain fast loading times
* Avoid unnecessary animations on mobile

Target:

* Lighthouse Mobile Score: 90+
* Excellent Core Web Vitals
* Fast 4G performance

## Feature Development Rule

Whenever a new feature is added:

Claude must automatically create:

1. Mobile layout
2. Tablet layout
3. Desktop layout

A feature is not considered complete until all three versions function correctly.

## UI/UX Requirements

Mobile users must be able to:

* Reserve a table with one hand
* View menus easily
* Browse cocktails comfortably
* Navigate the website effortlessly
* Read content without zooming
* Tap buttons accurately

Touch targets must be mobile friendly.

Minimum button height: 44px.

## Before Completing Any Task

Claude must verify:

✓ Mobile responsiveness
✓ Tablet responsiveness
✓ Desktop responsiveness
✓ Accessibility
✓ Performance
✓ Touch usability
✓ Responsive typography
✓ Responsive images

No task is complete until all checks pass.
