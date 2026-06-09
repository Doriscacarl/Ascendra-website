---
name: Ascendra Cinematic Luxury
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#c8c6c5'
  on-secondary: '#313030'
  secondary-container: '#4a4949'
  on-secondary-container: '#bab8b7'
  tertiary: '#c6c6cf'
  on-tertiary: '#2f3037'
  tertiary-container: '#909099'
  on-tertiary-container: '#282930'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474646'
  tertiary-fixed: '#e2e1eb'
  tertiary-fixed-dim: '#c6c6cf'
  on-tertiary-fixed: '#1a1b22'
  on-tertiary-fixed-variant: '#45464e'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: Bodoni Moda
    fontSize: 120px
    fontWeight: '700'
    lineHeight: 110%
    letterSpacing: -0.04em
  display-lg-mobile:
    fontFamily: Bodoni Moda
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 110%
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Bodoni Moda
    fontSize: 72px
    fontWeight: '600'
    lineHeight: 120%
  headline-xl-mobile:
    fontFamily: Bodoni Moda
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 120%
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 140%
    letterSpacing: 0.02em
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '400'
    lineHeight: 160%
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 160%
  label-caps:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 100%
    letterSpacing: 0.2em
  mono-technical:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 150%
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  section-gap-lg: 160px
  section-gap-md: 80px
  container-max: 1440px
  gutter: 32px
  margin-desktop: 64px
  margin-mobile: 24px
---

## Brand & Style

This design system embodies the "Cinematic Luxury" aesthetic, specifically tailored for a world-class digital agency. The brand personality is confident and innovative, prioritizing high-impact visuals over information density. 

The style is a sophisticated evolution of **Glassmorphism**, characterized by ultra-thin borders, deep background blurs, and subtle reflections that suggest high-end physical materials like polished obsidian and precision-cut glass. The emotional response should be one of exclusivity and awe, achieved through expansive whitespace, high-contrast typography, and a "dark mode by default" interface that feels both premium and futuristic.

## Colors

The palette is rooted in a deep, monochromatic base to allow the Electric Blue accent to pulse with energy. 

- **Midnight Black (#050505):** The primary canvas. It should feel infinite and void-like.
- **Obsidian (#101010):** Used for elevated surfaces and containers to create subtle depth.
- **Electric Blue (#3B82F6):** A high-vibrancy accent used sparingly for calls to action, active states, and focal points.
- **Accent Glow:** A functional glow effect derived from the primary blue, used to simulate light emission from interactive elements.
- **Typography:** Pure White is reserved for primary headings to ensure maximum legibility against the dark void, while Soft Silver Gray handles metadata and secondary information to maintain visual hierarchy.

## Typography

The typography system utilizes a high-contrast pairing of **Bodoni Moda** for an editorial, luxurious feel and **Hanken Grotesk** for modern, technical clarity. 

- **Editorial Headlines:** Use Bodoni Moda for large display text. It should feel dramatic and cinematic. Tighten letter spacing on larger sizes to maintain a "lockup" feel.
- **Functional UI:** Hanken Grotesk provides a sharp, contemporary counterpoint for body copy and navigation.
- **Technical/Labels:** **Geist** is used for micro-copy and labels to evoke a sense of precision and innovation. 

Always prioritize generous leading (line height) to reinforce the premium, "unrushed" nature of the brand.

## Layout & Spacing

The layout philosophy is built on **Expansive Fluidity**. Content is rarely cramped; instead, it is given room to breathe through massive vertical gaps (80px to 160px) between sections.

- **Grid:** Use a 12-column grid for desktop with 32px gutters. 
- **Margins:** Desktop layouts should maintain a minimum of 64px side margins to push content toward the center, creating a "widescreen" cinematic focus.
- **Reflow:** On mobile, section gaps should compress to 60px, and margins to 24px, ensuring the typography remains the hero.
- **Alignment:** Use asymmetrical layouts to create visual interest, but ensure all elements snap to the underlying grid to maintain a sense of structured intentionality.

## Elevation & Depth

Hierarchy is established through **Refractive Layering** rather than traditional drop shadows.

1.  **Base Layer:** The Midnight Black (#050505) background.
2.  **Glass Layer:** Elements appear to float using a `backdrop-filter: blur(20px)` and a semi-transparent Obsidian fill. 
3.  **Border Illumination:** Surfaces are defined by a 1px top-down gradient border (from white at 15% opacity to white at 5% opacity).
4.  **Shadows:** When elements need to feel "highly elevated," use deep, ultra-diffused shadows (`box-shadow: 0 40px 80px rgba(0,0,0,0.8)`). 
5.  **Interactive Glow:** The primary blue accent should emit a soft, localized glow (`blur(40px)`) when an element is active or hovered.

## Shapes

The design system uses a **Refined Rounded** language. 

- **Containers & Cards:** Use a 1rem (16px) radius to soften the high-contrast visuals, making the "glass" feel like a manufactured tech product.
- **Small Elements:** Buttons and tags follow the 0.5rem (8px) standard for a precise, "machined" look.
- **Exceptions:** Quote calculator steps and large immersive sections may use 1.5rem (24px) for a more "encapsulated" feel.

## Components

### Buttons
Primary buttons are high-gloss. Use a subtle linear gradient for the background and a `1px` inner border. On hover, the button should trigger a subtle Electric Blue outer glow and a slight scale increase (1.02x).

### Glass Cards
Cards must feature `backdrop-filter: blur(24px)` and a background color of `rgba(16, 16, 16, 0.6)`. Use parallax hover effects where the internal content shifts slightly slower than the card container.

### Quote Calculator
Designed as a "Configurator." Use a multi-step vertical or horizontal layout with large, selectable tiles. Pricing updates should be animated using a "rolling number" effect. Each selection should be confirmed with a micro-glow interaction.

### Input Fields
Inputs should be "ghost" style: no background fill, only a 1px bottom border (#ffffff20). On focus, the bottom border transitions to Electric Blue with a soft 4px glow beneath it.

### Progress Indicators
For multi-step processes, use thin, horizontal lines. The "active" segment should be Electric Blue with a trailing gradient effect to imply motion and forward momentum.