---
name: Obsidian Command
colors:
  surface: '#0c1324'
  surface-dim: '#0c1324'
  surface-bright: '#33394c'
  surface-container-lowest: '#070d1f'
  surface-container-low: '#151b2d'
  surface-container: '#191f31'
  surface-container-high: '#23293c'
  surface-container-highest: '#2e3447'
  on-surface: '#dce1fb'
  on-surface-variant: '#c3c6d7'
  inverse-surface: '#dce1fb'
  inverse-on-surface: '#2a3043'
  outline: '#8d90a0'
  outline-variant: '#434655'
  surface-tint: '#b4c5ff'
  primary: '#b4c5ff'
  on-primary: '#002a78'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#0053db'
  secondary: '#ffb690'
  on-secondary: '#552100'
  secondary-container: '#ec6a06'
  on-secondary-container: '#4a1c00'
  tertiary: '#89ceff'
  on-tertiary: '#00344d'
  tertiary-container: '#0074a6'
  on-tertiary-container: '#e4f2ff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#ffdbca'
  secondary-fixed-dim: '#ffb690'
  on-secondary-fixed: '#341100'
  on-secondary-fixed-variant: '#783200'
  tertiary-fixed: '#c9e6ff'
  tertiary-fixed-dim: '#89ceff'
  on-tertiary-fixed: '#001e2f'
  on-tertiary-fixed-variant: '#004c6e'
  background: '#0c1324'
  on-background: '#dce1fb'
  surface-variant: '#2e3447'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  title-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style

This design system is engineered for high-stakes, mission-critical environments where rapid information processing and visual clarity are paramount. The aesthetic merges **Modern Corporate** reliability with a **Glassmorphic** overlay, creating a sophisticated "heads-up display" (HUD) feel suitable for emergency response and data-intensive monitoring.

The target audience consists of first responders, incident commanders, and logistics coordinators who require a UI that minimizes eye strain during prolonged night shifts or low-light operations. The emotional response is one of calm authority, precision, and unwavering stability. The interface utilizes translucent layers and vibrant accents to highlight actionable data against a deep, nocturnal foundation.

## Colors

The palette is optimized for a low-light, high-contrast environment. The foundation is a deep slate-black to eliminate glare and maximize the perceived brightness of interactive elements.

- **Primary (Emergency Blue):** #2563EB is used for primary actions and "active" states. On dark backgrounds, ensure this is paired with high-contrast white text.
- **Secondary (Emergency Orange):** #F97316 is reserved for warnings, critical alerts, and secondary call-to-actions that require immediate peripheral attention.
- **Surface & Background:** The background uses #020617. Surfaces and cards use a tiered approach with #0F172A for base containers and #1E293B for elevated or hovered elements.
- **Typography:** Primary text is set in Slate-100 (#F1F5F9) to provide a soft yet clear contrast that reduces the "halo effect" common with pure white text on black backgrounds.

## Typography

The typographic system prioritizes legibility and technical precision. 

- **Headlines:** Hanken Grotesk provides a clean, contemporary sans-serif look that feels professional and sharp.
- **Body:** Inter is utilized for its exceptional readability in long-form data and status reports.
- **Technical Labels:** JetBrains Mono is used for status codes, timestamps, and data labels to evoke a sense of precision and algorithmic accuracy.

For mobile, headlines scale down to prevent awkward line breaks, while body text maintains a minimum of 16px to ensure accessibility in high-stress physical environments.

## Layout & Spacing

The layout follows a **Fluid Grid** philosophy to accommodate various screen sizes from ruggedized tablets to large-scale command center monitors. 

- **Grid System:** A 12-column grid for desktop, 8-column for tablet, and 4-column for mobile.
- **Rhythm:** An 8px linear scale (with a 4px step for tight UI) governs all padding and margins to ensure a consistent vertical and horizontal cadence.
- **Adaptation:** On mobile, margins tighten to 16px to maximize screen real estate, while desktop layouts use a 40px outer margin to provide visual breathing room. Content cards should span full-width on mobile but stack or form multi-column layouts on larger viewports.

## Elevation & Depth

In this dark mode system, depth is communicated through **Glassmorphism** and **Tonal Layering** rather than traditional heavy shadows.

1.  **Background Layer:** Deep slate (#020617).
2.  **Surface Layer:** Dark navy slate (#0F172A) with a subtle 1px inner border (opacity 10% white) to define edges.
3.  **Glass Layer:** Elements like navigation bars and floating modals use a backdrop filter (`blur(12px)`) combined with a semi-transparent fill of the primary surface color at 70% opacity.
4.  **Interactive Glow:** Instead of dark shadows, active elements may emit a subtle, low-opacity outer glow of the primary color (#2563EB) to indicate focus or "on" states.

## Shapes

The design system uses a **Rounded** (Level 2) shape language to soften the technical nature of the UI, making it more approachable.

- **Standard Elements:** Buttons, input fields, and small tags use a 0.5rem (8px) radius.
- **Large Containers:** Cards, modals, and main content areas use `rounded-lg` (16px) as the primary container corner radius.
- **Dynamic Elements:** Status indicators and specific buttons may utilize `rounded-xl` (24px) for a more distinct, pill-like appearance when they represent isolated actions.

## Components

- **Buttons:**
    - *Primary:* Solid #2563EB with white text. High-gloss finish optional via a subtle top-down gradient.
    - *Secondary:* Ghost style with a #F1F5F9 border at 20% opacity and white text.
    - *Emergency:* Solid #F97316 for high-priority actions.
- **Cards:** Background #0F172A, 16px corner radius, 1px border (#F1F5F9, 10% opacity). On hover, transition background to #1E293B.
- **Input Fields:** Darker fill than the surface (#020617), 8px radius. Active state features a 2px #2563EB border. Use JetBrains Mono for input text.
- **Chips/Status:** High-contrast labels with low-opacity background tints (e.g., a "Critical" chip uses 15% opacity #F97316 background with 100% opacity text).
- **Lists:** Separated by thin 1px lines (#F1F5F9 at 5% opacity). Interactive list items should have a 4px left-accent border of the Primary color on hover.
- **Checkboxes & Radios:** Use the Primary color (#2563EB) for the checked state. Unchecked states should be #1E293B with a subtle border.
- **Data Visualizations:** Use a palette of Primary, Secondary, and Tertiary colors. All chart backgrounds should be transparent to sit natively on the #0F172A surfaces.