# Cat Future Lab AI Control Extension Plan

## Scope
- Preserve the existing Cat Future Lab website content and extend it with a smart navigator control layer.
- Keep the site as a left/right SPA rather than rebuilding it as a vertical landing page.
- Use local mock parsing first so page, theme, background, font, marquee, progress, and presentation controls work without a live AI key.

## Implementation Steps
1. Centralize page, theme, background, font, shape, and section-explanation config.
2. Add AppState, cookie persistence, reset-to-default behavior, and a small subscription model for UI synchronization.
3. Add AI Action validation, mock natural-language parsing, and a safe Action Router.
4. Wire the existing chat form into the Smart Navigator control flow.
5. Add wheel navigation, marquee, font controls, and bottom progress line.
6. Update the existing experience shell to read AppState and pageMap.
7. Add CSS variables and theme/background/shape transitions without replacing existing content.
8. Run static checks and short browser/runtime checks without leaving a long-running server.
