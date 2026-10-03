# Faithful Footing app port

## Goal
Rebuild the uploaded **Footing — a numerology companion** as the project’s `/` experience, preserving its current copy, styling, calculations, navigation, browser storage, and interactions before making any redesign or product changes.

## Implementation
- Recreate the single-page flow at `/`: intake, Your reading, Today, and Journal, including sticky navigation, footer, validation, start-over behavior, and smooth screen changes.
- Port the existing visual system exactly: Fraunces and Work Sans, night/paper/amber palette, narrow reading column, panels, grids, chips, disclosures, forms, mobile behavior, and safe-area handling.
- Move the original calculation engine into browser-safe TypeScript modules without changing formulas, maps, reduction rules, meanings, or edge cases.
- Preserve all generated reading sections and tools: Chaldean and Pythagorean numbers, Hebrew-style values, Chinese numerology and zodiac, Sun and Rising signs, Kua direction, Lo Shu grid, karmic debt, Pinnacles and Challenges, letterology, name checks, compatibility, day/date guidance, moon dates, brand lookup, and color guidance.
- Preserve local-only persistence for profile and journal entries using the same storage keys and behavior. No backend will be added.
- Keep the Claude-only feng shui photo panel feature-detected and hidden in ordinary hosting, matching the source app’s current behavior rather than replacing it with a new service.
- Add route-specific page metadata using the app’s existing name and description.

## Technical details
- Use React state and event handlers for the interface while retaining the original numeric algorithms and content tables verbatim in dedicated modules.
- Load Google Fonts through document-head links; keep all global tokens and styles in the project stylesheet.
- Avoid server-only APIs so every result remains calculated in the visitor’s browser.
- Add focused regression tests for representative master-number, karmic-debt, Lo Shu, zodiac, ascendant, cycle, and persistence paths.

## Verification
- Compare the rebuilt app against the uploaded file at desktop and mobile widths.
- Exercise intake validation, restored profile, every navigation view, expandable calculators, start-over, journal save/restore, and representative calculation outputs.
- Confirm the preview builds cleanly with no runtime or console errors.
