# Nenasala UI Brand System

The UI palette is derived from the supplied Nenasala logo and the two approved palette references.

## Extracted anchors

| Role | Color | Source / use |
|---|---|---|
| Primary orange | `#FF6405` | Dominant orange from the supplied logo; primary actions and active states |
| Bright orange | `#FF570C` | Approved palette reference; accent/highlight |
| Soft orange | `#FE7642` | Approved palette reference; supporting highlights |
| Deep slate | `#283F4F` | Approved palette reference; headings/dark branded surfaces |
| Charcoal | `#323642` | Approved palette reference; strong text/secondary dark surface |
| Cool grey | `#606470` | Approved palette reference; secondary text |
| Warm ivory | `#EFEEEA` | Approved palette reference; muted surface |
| Near white | `#F7F7F7` | Approved palette reference; page background |

## Usage principle

Orange is the brand anchor, **not the page background everywhere**. Use it mainly for:

- primary buttons
- selected/active navigation
- links and micro-interactions
- progress indicators
- focused form states
- important highlights

Use deep slate for structural contrast and warm ivory/white for breathing room.

Status colours (success, warning, error, info) are separate semantic tokens in `globals.css` so the interface does not misuse brand orange to communicate every state.

## Source of truth

All colors used by UI code should be defined in:

```text
src/app/globals.css
```

Feature components should reference semantic variables instead of hardcoded HEX/RGB/HSL or framework palette colors.

## Corner geometry

Use the agreed smooth-corner relationship:

```text
outer radius = inner radius + padding
```

The current shared radius scale is:

- 8px
- 12px
- 16px
- 24px
- 32px
- 40px

Choose nested values based on the actual container padding rather than applying a random radius to each component.
