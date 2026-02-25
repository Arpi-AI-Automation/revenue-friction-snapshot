# ARPI Design Tokens

All tokens are defined in `tailwind.config.ts` under `theme.extend`.
Use only these values. Do not hardcode hex values, pixel values, or spacing
values anywhere in component code.

---

## Colors

All colors extend Tailwind's color system. Reference via `text-*`, `bg-*`, `border-*`.

| Token | Value | Usage |
|---|---|---|
| `background` | `#F9F8F6` | Page background — warm white, not pure white |
| `surface` | `#FFFFFF` | Card and panel backgrounds |
| `border` | `#E5E2DC` | All borders, dividers, separator lines |
| `primary` | `#1A1917` | Primary text, headings, icons |
| `muted` | `#7A7670` | Secondary text, labels, placeholders |
| `accent` | `#C8B89A` | Brand accent — logo dot, CTA hover, focus rings |
| `accent-dim` | `#8A7A64` | Eyebrow labels, section labels, icon fills |

### Friction score colors

Used only for score rings, score labels, and friction level badges.
Do not use these for general UI.

| Token | Value | Usage |
|---|---|---|
| `friction-low` | `#2D6A4F` | Low Friction score text and ring fill |
| `friction-mid` | `#B45309` | Moderate Friction score text and ring fill |
| `friction-high` | `#991B1B` | High Friction score text and ring fill |
| `friction-low-bg` | `#F0F7F4` | Background tint for low friction output panels |
| `friction-mid-bg` | `#FEF3E2` | Background tint for moderate friction chips |

### Usage rules

- Never use Tailwind's default color palette (blue, green, red, etc.) in this project.
- `surface` is for elevated content (cards). `background` is for the page.
- `accent` is warm; use it sparingly for trust and brand moments.
- Friction colors carry meaning — only use them in scoring contexts.

---

## Typography

Three font families. Each has a specific role. Do not mix roles.

| Token | Family | Role |
|---|---|---|
| `font-serif` | Instrument Serif, Georgia | Hero headlines and report domain h1 only |
| `font-sans` | DM Sans, system-ui | All UI text, body copy, labels, navigation |
| `font-mono` | JetBrains Mono, Menlo | Scores, numbers, confidence chips, code-like labels |

### Type scale

Defined in `tailwind.config.ts` `fontSize`. All sizes include line-height.

| Token | Size | Line Height | Use |
|---|---|---|---|
| `text-2xs` | 12px | 16px | Micro labels, chip text, disclaimers, tracking info |
| `text-xs` | 14px | 20px | Finding labels, card body text, button text |
| `text-sm` | 16px | 24px | Subheadlines, form inputs, body paragraphs |
| `text-md` | 20px | 28px | Section headings (h2) |
| `text-lg` | 28px | 34px | Large headings, logo mark |
| `text-xl` | 40px | 46px | Hero h1 only — use `text-lg sm:text-xl` for mobile safety |

### Responsive rule

`text-xl` must always be paired with a mobile fallback:
```html
<!-- Correct -->
<h1 class="font-serif text-lg sm:text-xl ...">

<!-- Wrong — overflows on 375px -->
<h1 class="font-serif text-xl ...">
```

### Letter spacing

- `label-track` utility: `letter-spacing: 0.1em` — use on all uppercase mono labels
- `text-lg` has `letter-spacing: -0.01em` built in
- `text-xl` has `letter-spacing: -0.02em` built in

---

## Spacing

Defined in `tailwind.config.ts` `spacing`. These extend Tailwind's default scale.

| Token | Value | Usage |
|---|---|---|
| `section` (64px) | `py-section` | Vertical padding between major page sections |
| `card` (32px) | `gap-card` | Gap between cards in grids |
| `inner` (24px) | `p-inner` | Internal card padding (via `Card` primitive) |
| `micro` (12px) | `gap-micro` | Micro spacing between inline elements |
| `18` (72px) | `py-18` | Alternate large section spacing when needed |

### Spacing rules

- Never use arbitrary values like `p-[20px]` or `mt-[36px]`. Use the scale.
- `p-inner` is applied by the `Card` primitive — do not add padding inside `Card` children.
- Use Tailwind's default scale (4, 6, 8, etc.) for micro adjustments within components.

---

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `rounded-sm` | 2px | All cards, inputs, buttons, chips |
| `rounded-md` | 4px | Tooltips |
| `rounded-full` | 9999px | Spinner, toggle dots |

Sharp corners are intentional. Do not use `rounded-lg` or `rounded-xl`.

---

## Shadows

| Token | Value | Usage |
|---|---|---|
| `shadow-card` | `0 1px 3px rgba(26,25,23,0.06), 0 1px 2px -1px rgba(26,25,23,0.04)` | Default card elevation |
| `shadow-card-hover` | `0 4px 12px rgba(26,25,23,0.08)` | Card on hover (category cards on homepage) |

No `shadow-lg`, `shadow-xl`, or colored shadows.

---

## Borders

All borders use `border-border` (`#E5E2DC`).

| Pattern | Class | Usage |
|---|---|---|
| Default border | `border border-border` | Cards, inputs, chips, dividers |
| Section divider | `divider` utility | Full-width `<div class="divider" />` between sections |
| Focus ring | `focus-visible:ring-1 focus-visible:ring-accent` | Interactive elements |

---

## Component Primitives

These components encode the most common UI patterns. Always use them instead of repeating raw classes.

| Component | File | Encodes |
|---|---|---|
| `Card` | `components/ui/Card.tsx` | `bg-surface border border-border rounded-sm p-inner shadow-card` |
| `Button` | `components/ui/Button.tsx` | Primary and ghost button variants with loading state |
| `Input` | `components/ui/Input.tsx` | Text input with error state |
| `Tooltip` | `components/ui/Tooltip.tsx` | Accessible hover tooltip, top/bottom auto-position |

### Card usage

```tsx
// Default — renders as <div>
<Card>...</Card>

// Semantic override
<Card as="article">...</Card>
<Card as="li">...</Card>

// Extra classes (append only — do not override shadow or border)
<Card className="flex flex-col gap-4">...</Card>
```

---

## Content Layout

| Token | Value | Class |
|---|---|---|
| Max content width | 720px | `content-wrap` utility (includes `mx-auto px-6`) |
| Mobile horizontal padding | 24px | Built into `content-wrap` via `px-6` |

### Grid layout for bucket cards

```html
<!-- 2x2 desktop, stacked mobile -->
<div class="grid grid-cols-1 sm:grid-cols-2 gap-card">
```

---

## Accessibility

- Focus styles use `focus-visible` (not `focus`) to avoid showing rings on mouse click.
- Focus ring color: `accent` (`#C8B89A`).
- All icon-only elements must have `aria-hidden="true"`.
- All interactive elements must have visible or `sr-only` labels.
- Confidence chips include `aria-label` with full text for screen readers.
