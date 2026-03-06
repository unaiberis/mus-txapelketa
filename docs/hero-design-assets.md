**Hero Design Assets**

Overview
- A bold, memorable hero built from distinctive geometry, a dramatic gradient, a single accent token and subtle texture and motion.

Color tokens (CSS variables)
- `--color-hero-bg`: deep page background (recommended fallback: `#071129`)
- `--color-hero-gradient-from`: gradient start (recommended fallback: `#0f172a`)
- `--color-hero-gradient-to`: gradient end (recommended fallback: `#020617`)
- `--color-hero-accent`: primary accent used for geometric mark and CTA (recommended fallback: `#FF6B6B`)
- `--color-hero-text`: heading text color (recommended fallback: `#FFFFFF`)

Gradient example (CSS)
```
/* Use these variables in the hero container */
.hero {
  background: linear-gradient(135deg, var(--color-hero-gradient-from), var(--color-hero-gradient-to));
}
```

Accent usage
- Use `--color-hero-accent` for the key geometric mark, primary CTA, and subtle highlights. In the SVG we provided the mark with an inline fallback and supports `var(--color-hero-accent)`.

Typography
- Display (headline): "Poppins" (Google): https://fonts.google.com/specimen/Poppins — great for geometric, bold headings. Local fallback: -apple-system, BlinkMacSystemFont, 'Segoe UI'.
- Alternative display (characterful serif): "Playfair Display" (Google): https://fonts.google.com/specimen/Playfair+Display — use for editorial, mixed-logo treatments. Local fallback: Georgia, 'Times New Roman'.

Suggested font-stack variables
- `--font-display`: 'Poppins', 'Playfair Display', system-ui
- `--font-ui`: Inter, system-ui, -apple-system

Sizing & spacing
- Use a modular scale for hero content (desktop):
  - `--space-0`: 4px
  - `--space-1`: 8px
  - `--space-2`: 16px
  - `--space-3`: 24px
  - `--space-4`: 40px
  - `--space-5`: 64px
- Headline sizing examples (responsive):
  - Mobile headline: clamp(28px, 6.4vw, 40px)
  - Desktop headline: clamp(40px, 6vw, 72px)

Texture
- Use `public/textures/hero-texture.svg` as a subtle overlay with low opacity to add tactile grain. Example:
```
.hero::after {
  content: "";
  position: absolute; inset: 0;
  background-image: url('/public/textures/hero-texture.svg');
  opacity: 0.08; pointer-events: none;
}
```

Motion guidelines
- Subtle entrance: headline and geometric mark fade/slide in from below (duration 520ms, cubic-bezier(0.2,0.9,0.2,1)).
- Parallax tilt: a slow, subtle transform on the SVG composite (translateY -6px to 6px) tied to scroll or pointer for depth. Keep motion limited to small translations and minor rotates (<4deg).

Accessibility
- Ensure text over hero meets WCAG contrast (use `--color-hero-text` with sufficient contrast against `--color-hero-bg` / gradient).
- When embedding SVGs, preserve `<title>` and `<desc>` or provide `aria-hidden="true"` when decorative.

Assets
- Illustration: public/images/hero-illustration.svg
- Texture: public/textures/hero-texture.svg

Notes for the Coder
- Use the following CSS variables in stylesheets: `--color-hero-bg`, `--color-hero-gradient-from`, `--color-hero-gradient-to`, `--color-hero-accent`, `--color-hero-text`, `--font-display`, `--font-ui`, and the spacing tokens above.
- Example JS-friendly theme override: `document.documentElement.style.setProperty('--color-hero-accent', '#00D1B2')` to change the accent at runtime.

End of spec.
**Hero Design Assets**

Overview
- A bold, memorable hero built from distinctive geometry, a dramatic gradient, a single accent token and subtle texture and motion.

Color tokens (CSS variables)
- `--color-hero-bg`: deep page background (recommended fallback: `#071129`)
- `--color-hero-gradient-from`: gradient start (recommended fallback: `#0f172a`)
- `--color-hero-gradient-to`: gradient end (recommended fallback: `#020617`)
- `--color-hero-accent`: primary accent used for geometric mark and CTA (recommended fallback: `#FF6B6B`)
- `--color-hero-text`: heading text color (recommended fallback: `#FFFFFF`)

Gradient example (CSS)
```
/* Use these variables in the hero container */
.hero {
  background: linear-gradient(135deg, var(--color-hero-gradient-from), var(--color-hero-gradient-to));
}
```

Accent usage
- Use `--color-hero-accent` for the key geometric mark, primary CTA, and subtle highlights. In the SVG we provided the mark with an inline fallback and supports `var(--color-hero-accent)`.

Typography
- Display (headline): "Poppins" (Google): https://fonts.google.com/specimen/Poppins — great for geometric, bold headings. Local fallback: `-apple-system, BlinkMacSystemFont, 'Segoe UI'`.
- Alternative display (characterful serif): "Playfair Display" (Google): https://fonts.google.com/specimen/Playfair+Display — use for editorial, mixed-logo treatments. Local fallback: `Georgia, 'Times New Roman'`.

Suggested font-stack variables
- `--font-display`: 'Poppins', 'Playfair Display', system-ui
- `--font-ui`: Inter, system-ui, -apple-system

Sizing & spacing
- Use a modular scale for hero content (desktop):
  - `--space-0`: 4px
  - `--space-1`: 8px
  - `--space-2`: 16px
  - `--space-3`: 24px
  - `--space-4`: 40px
  - `--space-5`: 64px
- Headline sizing examples (responsive):
  - Mobile headline: clamp(28px, 6.4vw, 40px)
  - Desktop headline: clamp(40px, 6vw, 72px)

Texture
- Use `public/textures/hero-texture.svg` as a subtle overlay with low opacity to add tactile grain. Example:
```
.hero::after {
  content: "";
  position: absolute; inset: 0;
  background-image: url('/public/textures/hero-texture.svg');
  opacity: 0.08; pointer-events: none;
}
```

Motion guidelines
- Subtle entrance: headline and geometric mark fade/slide in from below (duration 520ms, cubic-bezier(0.2,0.9,0.2,1)).
- Parallax tilt: a slow, subtle transform on the SVG composite (translateY -6px to 6px) tied to scroll or pointer for depth. Keep motion limited to small translations and minor rotates (<4deg).

Accessibility
- Ensure text over hero meets WCAG contrast (use `--color-hero-text` with sufficient contrast against `--color-hero-bg` / gradient).
- When embedding SVGs, preserve `<title>` and `<desc>` or provide `aria-hidden="true"` when decorative.

Assets
- Illustration: public/images/hero-illustration.svg
- Texture: public/textures/hero-texture.svg

Notes for the Coder
- Use the following CSS variables in stylesheets: `--color-hero-bg`, `--color-hero-gradient-from`, `--color-hero-gradient-to`, `--color-hero-accent`, `--color-hero-text`, `--font-display`, `--font-ui`, and the spacing tokens above.
- Example JS-friendly theme override: `document.documentElement.style.setProperty('--color-hero-accent', '#00D1B2')` to change the accent at runtime.

End of spec.
