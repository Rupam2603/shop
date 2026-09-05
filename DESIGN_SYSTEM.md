# Modern UI/UX Design System - Subhasis Store
## Design Brief & Strategy

**Project**: Subhasis Store - Pharma & Healthcare E-commerce Platform  
**Audience**: Health-conscious consumers, retail pharmacy partners, delivery personnel  
**Primary Jobs**:
1. Browse & purchase medicines, health supplements, lab tests
2. Track orders and delivery in real-time
3. Manage prescriptions and health documents
4. For retailers: Bulk ordering and sales analytics

---

## DESIGN PLAN

### Color Palette (6 Core Colors)

```
Primary Brand: #0F766E (Deep Teal) - Trust, healthcare, growth
Secondary: #EF6461 (Coral Red) - Energy, urgency, wellness
Accent: #F59E0B (Amber) - Alerts, discounts, CTAs
Surface Light: #F8FFFE (Almost White) - Clean backgrounds
Surface Dark: #0D1117 (Deep Navy) - Text, contrast
Neutral: #9CA3AF (Cool Gray) - Secondary text, dividers
```

**Rationale**: 
- Teal conveys healthcare trust + modern tech (replacing generic green #006a39)
- Coral provides warmth and energy without cliché (avoids warm terracotta)
- Amber for actionable moments (offers, alerts) stands out naturally
- Cool palette feels contemporary, not medical-sterile

---

### Typography System

**Display / Headlines**: 
- **Font**: Manrope (keep existing)
- **Weight**: 700–800
- **Usage**: Page titles, CTAs, stat numbers
- **Line-height**: 1.1 (tight, commanding)
- **Letter-spacing**: -0.02em (humanized)

**Body / UI Text**:
- **Font**: Inter (replace Hanken Grotesk)
- **Weight**: 400–600
- **Usage**: Body copy, labels, card content
- **Line-height**: 1.6 (readable, accessible)
- **Constraint**: Max 75 characters per line

**Type Scale**:
```
h1: 3.5rem (56px) / 700
h2: 2.5rem (40px) / 700
h3: 1.75rem (28px) / 600
body-lg: 1.125rem (18px) / 400
body: 1rem (16px) / 400
body-sm: 0.875rem (14px) / 500 (labels)
caption: 0.75rem (12px) / 500 (meta)
```

**Rationale**: 
- Manrope for headlines: Bold, geometric, tech-forward
- Inter for body: Neutral, highly legible at all sizes (replaces Hanken which feels dated)
- Tighter h1 line-height creates sophistication
- Body at 1rem baseline for mobile friendliness

---

### Layout Principles

**Grid**: 
- Desktop: 12-column grid, 24px gutter
- Tablet: 8-column, 20px gutter
- Mobile: 4-column, 16px gutter

**Spacing Scale**: 4px base unit
- xs: 4px | sm: 8px | md: 16px | lg: 24px | xl: 32px | 2xl: 48px | 3xl: 64px

**Content Width**:
- Full bleed on mobile
- Constrained to 1440px max on desktop (with side margins)
- Centered alignment for asymmetry (not left-aligned everywhere)

**Cards & Surfaces**:
- No rounded corners > 12px (clean, modern, not cute)
- Subtle shadow: `0 4px 12px rgba(15, 118, 110, 0.08)`
- 1px divider lines (not 2px), using `#E5E7EB`
- Hover state: Slight lift (shadow increase) + color shift

**Hero Moment**:
- Large, minimal hero on homepage with medical imagery (not generic gradient)
- Real product photography, not illustrations
- Headline + single CTA, no marketing copy dump

---

### Design Principles

1. **Clarity Over Decoration**: Every visual element must communicate, not decorate
2. **Healthcare Professionalism**: Modern teal + warm coral (approachable but trustworthy)
3. **Performance First**: Minimal animations, instant feedback
4. **Mobile-Native**: Design for thumb interaction on small screens
5. **Accessibility**: WCAG AA minimum, keyboard navigation, reduced motion respected
6. **One Bold Choice Per Section**: Teal hero, coral CTAs, amber alerts — not everywhere

---

### What We're Changing

❌ **Old Approach** (Generic):
- Cream background with warm gradient
- Rounded corners on everything
- Glassmorphism on every card
- Soft shadows everywhere
- Green accents (#006a39)
- Hanken Grotesk for body

✅ **New Approach** (Distinctive):
- Clean white/near-white surface
- Subtle borders over shadows
- Strategic glassmorphism (hero, overlays only)
- Sharp, readable UI
- Teal + coral color story
- Inter for clarity, Manrope for personality

---

## REVIEW AGAINST BRIEF

✅ **Subject-Specific**: Healthcare context drives palette (trust + energy)  
✅ **Not Generic**: Teal/coral combination is distinctive, avoids SaaS card defaults  
✅ **Typography Intentional**: Manrope (tech-forward) + Inter (readable), not defaults  
✅ **One Bold Choice**: Teal hero is the memorable element, rest is disciplined  
✅ **Modern but Professional**: Suitable for health retail, not trendy/dated  

---

## IMPLEMENTATION

Ready to build components using this system. See next file for component library & CSS tokens.
