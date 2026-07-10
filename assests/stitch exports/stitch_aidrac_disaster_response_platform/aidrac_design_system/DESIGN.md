---
name: AIDRAC Design System
colors:
  surface: '#faf8ff'
  surface-dim: '#d9d9e5'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3fe'
  surface-container: '#ededf9'
  surface-container-high: '#e7e7f3'
  surface-container-highest: '#e1e2ed'
  on-surface: '#191b23'
  on-surface-variant: '#434655'
  inverse-surface: '#2e3039'
  inverse-on-surface: '#f0f0fb'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#9d4300'
  on-secondary: '#ffffff'
  secondary-container: '#fd761a'
  on-secondary-container: '#5c2400'
  tertiary: '#943700'
  on-tertiary: '#ffffff'
  tertiary-container: '#bc4800'
  on-tertiary-container: '#ffede6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#ffdbca'
  secondary-fixed-dim: '#ffb690'
  on-secondary-fixed: '#341100'
  on-secondary-fixed-variant: '#783200'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb596'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7d2d00'
  background: '#faf8ff'
  on-background: '#191b23'
  surface-variant: '#e1e2ed'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-label:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 32px
  gutter: 24px
  card-padding: 20px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
---

## Brand & Style
The design system for this agentic AI disaster response platform is built on the principles of **Precision, Urgency, and Clarity**. It targets high-stakes decision-makers who require real-time, actionable intelligence without cognitive overload. 

The aesthetic is **Corporate Modern with a "Linear-Lite" influence**, utilizing a high-performance SaaS dashboard look. It leverages expansive whitespace, high-contrast typography, and subtle technical accents to evoke a sense of futuristic reliability. The UI avoids unnecessary decoration, focusing instead on "Information-Dense Minimalism" where data is the hero, supported by a professional and systematic interface.

## Colors
The palette is engineered for high-visibility and functional hierarchy. 
- **Primary Blue (#2563EB)**: Used for action-oriented elements, active states, and AI-agent signals.
- **Secondary Orange (#F97316)**: Specifically reserved for emergency alerts, pending disasters, and manual intervention points.
- **Surface (#F8FAFC)**: Used to define secondary containers, sidebars, and card backgrounds to create a subtle layered depth against the white base.
- **Semantic Colors**: Success (Green) and Danger (Red) follow standard utility patterns but are used sparingly to maintain the professional aesthetic.

## Typography
This design system utilizes **Geist** for its systematic, technical feel and superior legibility at small scales. 
- **Headlines**: Use tight letter-spacing and semi-bold weights to command attention.
- **Body Text**: Optimized for readability with a generous line-height to manage dense technical data.
- **Utility**: A secondary monospaced font (JetBrains Mono) is introduced exclusively for coordinate data, timestamps, and AI process logs to enhance the "technical coordinator" feel.

## Layout & Spacing
The layout follows a **Fluid Grid with fixed internal constraints**.
- **Dashboard Layout**: A persistent 280px sidebar for navigation, with a flexible main content area that utilizes a 12-column system.
- **Breakpoints**: 
  - Desktop: 1280px+ (full sidebar)
  - Tablet: 768px - 1279px (collapsed sidebar, 2-column card layout)
  - Mobile: <767px (hidden sidebar, single-column stack, reduced container padding to 16px)
- **Rhythm**: All spacing is derived from a 4px baseline. Components primarily use 16px or 24px gaps to maintain "air" within the interface.

## Elevation & Depth
Elevation is achieved through a mix of **Tonal Layering** and **Soft Multi-layered Shadows**.
- **Level 0 (Base)**: Pure White (#FFFFFF) for the application canvas.
- **Level 1 (Surface)**: Surface (#F8FAFC) cards with a 1px border in #E2E8F0.
- **Level 2 (Active/Floating)**: Cards with a multi-layered shadow: `0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)`.
- **Glassmorphism**: Modals and dropdown menus use a backdrop blur (12px) with a semi-transparent white background (80% opacity) to maintain context of the underlying data while providing focus.

## Shapes
The shape language is consistently **Rounded** to soften the technical nature of the application. 
- **Standard Components**: Buttons, inputs, and small widgets use an 8px radius.
- **Main Containers**: Dashboard cards and main content areas use a 16px radius.
- **Status Pills**: Fully rounded (pill-shaped) to distinguish them from interactive buttons.

## Components
- **Buttons**: Primary buttons are solid #2563EB with white text. Secondary buttons use a ghost style with a subtle border. All buttons feature a 200ms ease-in-out transition on hover.
- **Cards**: Feature a 16px border-radius, #F8FAFC background, and a subtle 1px border (#E2E8F0). Titles inside cards should use `headline-md`.
- **Status Chips**: Use high-saturation backgrounds at 10% opacity with 100% opacity text for the label (e.g., Orange text on light orange background for "Active Alert").
- **Input Fields**: Minimalist style; 1px border (#E2E8F0) that transitions to Primary Blue on focus. Labels sit outside the field in `label-md`.
- **AI Agent Indicator**: A custom component featuring a pulsating ring effect using the Primary Blue to indicate active agentic background processing.
- **Data Tables**: Row-based with no vertical borders. Hover states highlight the entire row in #F1F5F9 for rapid scanning.