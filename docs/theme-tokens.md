Theme Tokens — Board Game

Palette
- Primary: `primary-50`, `primary-500`, `primary-700` (felt green)
- Accent: `accent-400` (gold), `accent-600`
- Wood tones: `wood-100`, `wood-300`, `wood-500`
- Panels: `panel-50`, `panel-100`, `panel-500`
- Neutral: `neutral-100`, `neutral-300`, `neutral-700`

Key tokens
- Card surface: `card-board` (use for group panels and match cards)
- Felt background: utility `.felt-bg` (applies `linen.svg` texture)
- Score badge: `.score-badge` and `.winner` modifier
- Borders: `border-border-200` (soft, warm)

Spacing & radius
- Card radius: `rounded-card` = 0.5rem
- Pill radius: `rounded-pill` (9999px)
- Row height: `h-12` (desktop), `h-10` (mobile)

Shadows
- `card-md` and `table-md` for depth; prefer subtle shadows and small inset to emulate layered cards.

Accessibility
- Use `aria-live="polite"` for score updates
- Ensure contrast for `accent-400` on text and badges

Usage examples
- Card: `<div class="card-board p-3">…</div>`
- Felt background: `<main class="felt-bg">…</main>`
- Winner badge: `<span class="score-badge winner">3</span>`

Place this file at `docs/theme-tokens.md`