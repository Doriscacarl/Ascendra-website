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
  on-surface-variant: '#c4c7c4'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#8e918e'
  outline-variant: '#444845'
  surface-tint: '#c7c6c4'
  primary: '#ffffff'
  on-primary: '#303130'
  primary-container: '#e3e2e0'
  on-primary-container: '#646463'
  inverse-primary: '#5e5e5d'
  secondary: '#c5c6ca'
  on-secondary: '#2e3034'
  secondary-container: '#47494d'
  on-secondary-container: '#b7b8bc'
  tertiary: '#ffffff'
  on-tertiary: '#313030'
  tertiary-container: '#e5e2e1'
  on-tertiary-container: '#656464'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e3e2e0'
  primary-fixed-dim: '#c7c6c4'
  on-primary-fixed: '#1b1c1b'
  on-primary-fixed-variant: '#464746'
  secondary-fixed: '#e2e2e6'
  secondary-fixed-dim: '#c5c6ca'
  on-secondary-fixed: '#1a1c1f'
  on-secondary-fixed-variant: '#45474a'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#474646'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: Bodoni Moda
    fontSize: 72px
    fontWeight: '600'
    lineHeight: 80px
    letterSpacing: 0.05em
  headline-lg:
    fontFamily: Bodoni Moda
    fontSize: 48px
    fontWeight: '500'
    lineHeight: 56px
    letterSpacing: 0.03em
  headline-md:
    fontFamily: Bodoni Moda
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
    letterSpacing: 0.02em
  headline-sm:
    fontFamily: Bodoni Moda
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: 0.02em
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: 0.01em
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0.01em
  technical-data:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-secondary:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
spacing:
  unit: 8px
  container-max: 1440px
  gutter: 32px
  margin-desktop: 80px
  margin-mobile: 24px
---

## Brand & Style
The brand personality is **Elite Consultancy**. This design system evokes an atmosphere of exclusive authority, precision, and architectural permanence. It is tailored for high-stakes decision-makers who value discretion, heritage, and structural integrity over fleeting trends.

The visual direction is a fusion of **Architectural Minimalism** and **Cinematic Luxury**. The interface should feel like a high-end physical space—think polished obsidian, brushed metals, and controlled lighting. 

**Visual Tokens:**
*   **Architectural:** Precision-engineered layouts with intentional use of negative space to convey scale.
*   **Metallic:** Use of Platinum and Brushed Silver to denote value and industrial strength.
*   **Glass:** Sophisticated use of backdrop filters to create depth without clutter.
*   **Cinematic Lighting:** Directional light sources and specular highlights that mimic high-end photography.

## Colors
The palette is strictly monochromatic and high-contrast, designed to mimic a luxury automotive or high-jewelry editorial.

*   **Primary (Platinum Silver - #E5E4E2):** Used for primary typography, icons, and high-importance UI elements.
*   **Secondary (Brushed Metal Silver - #A8A9AD):** Used for borders, inactive states, and structural lines.
*   **Background (Deep Matte Black - #050505):** The primary canvas. It must remain dark to allow specular highlights to pop.
*   **Surface (Charcoal Black - #111111):** Used for elevated containers, cards, and navigation bars to provide subtle depth against the matte background.

**Lighting Note:** Avoid all neon or electric glows. Instead, use thin 1px gradients and "rim lighting" effects on the edges of components to simulate light reflecting off metal.

## Typography
The typographic hierarchy creates a tension between the classical elegance of **Bodoni Moda** and the technical precision of **Geist**.

*   **Headlines (Bodoni Moda):** Set with increased letter spacing to achieve an "Elite Editorial" look. The contrast between thick and thin strokes should be celebrated. Use for narrative titles and prestigious callouts.
*   **Technical Details & Body (Geist):** Provides a modern, engineered feel. 
*   **Secondary Text Hierarchy:** All secondary labels or metadata must utilize Geist at **60% opacity** to ensure the primary silver content remains the focal point.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy on desktop to maintain a composed, gallery-like feel. 

*   **Rhythm:** An 8px base unit drives all spacing.
*   **Desktop:** Use a 12-column grid with wide 32px gutters to prevent elements from feeling crowded. High-status layouts should utilize generous "Safe Areas" (80px+) to frame content.
*   **Mobile:** Transition to a 4-column grid with 24px margins. Typography scales down, but letter spacing remains wide to preserve the editorial character.
*   **Alignment:** Strict adherence to vertical and horizontal axes. Elements should feel "anchored" to the grid, echoing architectural blueprints.

## Elevation & Depth
Depth is not communicated through shadows, but through **light and material layering**.

*   **Specular Highlights:** Instead of drop shadows, use 1px "inner borders" on the top and left edges of cards with a linear gradient (Platinum Silver to Transparent) to simulate light hitting a sharp metallic edge.
*   **Glassmorphism:** Use high-quality backdrop blurs (20px+) on overlays and navigation bars with a very low opacity (10-15%) Charcoal Black fill.
*   **Tonal Tiers:** Level 0 is Deep Matte Black. Level 1 (Cards/Modals) is Charcoal Black. Level 2 (Active elements) is a subtle gradient of Brushed Metal Silver.

## Shapes
The shape language is **Sharp (0px)**. 

To maintain the architectural and elite consultancy feel, all UI elements—buttons, cards, input fields, and images—must have hard 90-degree corners. Rounded corners are perceived as too "approachable" or "consumer-grade" for this system. The precision of a sharp corner reflects the precision of the consultancy.

## Components
Consistent application of metallic materials and sharp geometry.

*   **Buttons:** Primary buttons use a Brushed Metal Silver background with Deep Matte Black text. Hover states trigger a subtle specular "sheen" gradient across the surface.
*   **Input Fields:** Ghost-style inputs with a 1px Brushed Metal bottom border only. Technical Geist labels sit above at 60% opacity.
*   **Cards:** Charcoal Black backgrounds with no visible borders, except for a 1px Platinum Silver specular highlight on the top edge.
*   **Lists:** Separated by thin 0.5px Brushed Metal horizontal rules with significant padding (24px+) between items.
*   **Data Visualization:** Use thin lines and monochrome gradients. No vibrant colors; use varying opacities of Platinum Silver to differentiate data sets.
*   **Navigation:** Top-tier navigation should be minimal, utilizing Bodoni Moda in small caps for a prestigious, boutique feel.