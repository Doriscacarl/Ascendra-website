## Brand & Style

This design system embodies the "Cinematic Luxury" aesthetic, specifically tailored for a world-class digital agency. The brand personality is confident and innovative, prioritizing high-impact visuals over information density. 

The style is a sophisticated evolution of **Glassmorphism**, characterized by ultra-thin borders, deep background blurs, and subtle reflections that suggest high-end physical materials like polished obsidian and precision-cut glass. The emotional response should be one of exclusivity and awe, achieved through expansive whitespace, high-contrast typography, and a "dark mode by default" interface that feels both premium and futuristic.

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