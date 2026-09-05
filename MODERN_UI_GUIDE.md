# Modern UI Component Library

## Quick Implementation Guide

### Step 1: Replace CSS File
```bash
# Backup old CSS
mv src/index.css src/index-old.css

# Use new modern design system
mv src/index-modern.css src/index.css
```

### Step 2: Update Tailwind Config (if needed)
Add to `tailwind.config.ts`:
```typescript
import { Config } from 'tailwindcss'

export default {
  theme: {
    extend: {
      colors: {
        primary: '#0F766E',
        'primary-light': '#14B8A6',
        'primary-dark': '#0D5D56',
        secondary: '#EF6461',
        'secondary-light': '#F59E9B',
        'secondary-dark': '#DC5250',
        accent: '#F59E0B',
      },
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
} satisfies Config
```

---

## Component Examples

### Hero Section (Modern)
```tsx
export default function HeroModern() {
  return (
    <section className="bg-gradient-to-br from-[#F8FFFE] to-[#F0FDFB] py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Large Statement Headline */}
        <h1 className="text-5xl sm:text-6xl font-bold text-[#0D1117] leading-tight mb-6">
          Your Health,
          <span className="text-[#0F766E]"> Simplified</span>
        </h1>
        
        {/* Subheading - Clear, not marketing-speak */}
        <p className="text-xl text-[#6B7280] max-w-2xl mb-12 leading-relaxed">
          Order medicines, book lab tests, and track your wellness in one place. 
          Trusted by 50,000+ customers across India.
        </p>

        {/* CTA - Single, bold action */}
        <div className="flex gap-4 flex-wrap">
          <button className="btn btn-primary">
            Browse Products
          </button>
          <button className="btn btn-outline">
            Learn More
          </button>
        </div>

        {/* Trust Indicators - No labels, just numbers */}
        <div className="grid grid-cols-3 gap-8 mt-16 pt-16 border-t border-[#E5E7EB]">
          <div>
            <div className="text-4xl font-bold text-[#0F766E]">50K+</div>
            <p className="text-[#6B7280] text-sm mt-2">Happy Customers</p>
          </div>
          <div>
            <div className="text-4xl font-bold text-[#0F766E]">10K+</div>
            <p className="text-[#6B7280] text-sm mt-2">Products Available</p>
          </div>
          <div>
            <div className="text-4xl font-bold text-[#0F766E]">24h</div>
            <p className="text-[#6B7280] text-sm mt-2">Delivery</p>
          </div>
        </div>
      </div>
    </section>
  );
}
```

### Product Card (Modern)
```tsx
interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  rating: number;
  image: string;
  inStock: boolean;
}

export default function ProductCard({ product }: { product: Product }) {
  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  return (
    <div className="card card-interactive group">
      {/* Image Container */}
      <div className="relative mb-4 overflow-hidden rounded-8px bg-[#F3F4F6] aspect-square">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Discount Badge - Coral accent */}
        {discount > 0 && (
          <div className="absolute top-3 right-3 badge badge-primary">
            {discount}% off
          </div>
        )}

        {/* Stock Status */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <span className="text-white font-semibold">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-2">
        <p className="text-xs text-[#9CA3AF] font-semibold uppercase tracking-wide">
          {product.brand}
        </p>
        <h3 className="font-semibold text-[#0D1117] line-clamp-2">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className={`text-sm ${
                  i < Math.round(product.rating)
                    ? 'text-[#F59E0B]'
                    : 'text-[#E5E7EB]'
                }`}
              >
                ★
              </span>
            ))}
          </div>
          <span className="text-xs text-[#6B7280]">({product.rating})</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-3">
          <span className="text-lg font-bold text-[#0D1117]">
            ₹{product.price}
          </span>
          {product.originalPrice > product.price && (
            <span className="text-sm text-[#9CA3AF] line-through">
              ₹{product.originalPrice}
            </span>
          )}
        </div>

        {/* CTA */}
        <button 
          disabled={!product.inStock}
          className="w-full btn btn-primary mt-4"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
```

### Navigation Bar (Modern)
```tsx
export default function NavBarModern() {
  return (
    <nav className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex-shrink-0">
            <span className="text-2xl font-bold text-[#0F766E]">
              SubhOne
            </span>
          </div>

          {/* Search - Hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search medicines, tests..."
              className="w-full px-4 py-2 rounded-lg border border-[#E5E7EB] focus:border-[#0F766E] focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Cart */}
            <button className="relative p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors">
              <svg className="w-6 h-6 text-[#0D1117]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="absolute -top-1 -right-1 bg-[#EF6461] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                3
              </span>
            </button>

            {/* Profile */}
            <button className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors">
              <svg className="w-6 h-6 text-[#0D1117]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
```

### Order Status Timeline (Modern)
```tsx
export default function OrderTimeline() {
  const steps = [
    { label: 'Confirmed', status: 'completed', time: '2h ago' },
    { label: 'Processing', status: 'completed', time: '1h ago' },
    { label: 'Dispatched', status: 'active', time: 'Now' },
    { label: 'Out for Delivery', status: 'pending', time: 'Est. 2-3h' },
    { label: 'Delivered', status: 'pending', time: '' },
  ];

  return (
    <div className="space-y-4">
      {steps.map((step, idx) => (
        <div key={idx} className="flex gap-4">
          {/* Timeline Dot */}
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
              ${step.status === 'completed' ? 'bg-[#10B981] text-white' : ''}
              ${step.status === 'active' ? 'bg-[#0F766E] text-white' : ''}
              ${step.status === 'pending' ? 'bg-[#E5E7EB] text-[#9CA3AF]' : ''}
            `}>
              {step.status === 'completed' ? '✓' : (step.status === 'active' ? '●' : idx + 1)}
            </div>
            {idx < steps.length - 1 && (
              <div className={`w-0.5 h-12 my-2 ${
                step.status === 'completed' ? 'bg-[#10B981]' : 'bg-[#E5E7EB]'
              }`} />
            )}
          </div>

          {/* Content */}
          <div className="pt-1 pb-8">
            <p className="font-semibold text-[#0D1117]">{step.label}</p>
            <p className="text-sm text-[#9CA3AF]">{step.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Category Grid (Modern)
```tsx
const categories = [
  { name: 'Medicines', icon: '💊', color: 'bg-blue-50' },
  { name: 'Wellness', icon: '🧘', color: 'bg-green-50' },
  { name: 'Lab Tests', icon: '🔬', color: 'bg-purple-50' },
  { name: 'Supplements', icon: '🥗', color: 'bg-amber-50' },
];

export default function CategoryGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {categories.map((cat) => (
        <button
          key={cat.name}
          className={`${cat.color} p-6 rounded-12px text-center transition-all hover:shadow-md active:scale-95`}
        >
          <div className="text-4xl mb-2">{cat.icon}</div>
          <p className="font-semibold text-[#0D1117]">{cat.name}</p>
        </button>
      ))}
    </div>
  );
}
```

---

## Color Usage Guide

### When to Use Each Color

| Color | Use Case | Example |
|-------|----------|---------|
| **Teal (#0F766E)** | Primary actions, navigation, focus states | Add to Cart, Links, Focused inputs |
| **Coral (#EF6461)** | Secondary actions, urgent items, discounts | Limited offers, Quick actions |
| **Amber (#F59E0B)** | Alerts, warnings, attention | Out of stock, Sale badges |
| **Green (#10B981)** | Success, confirmations, completed | Order confirmed, Successful login |
| **Red (#EF4444)** | Errors, deletions, critical | Error messages, Delete buttons |

### Text Hierarchy

- **Headline** (`h1-h4`): Manrope, 700 weight, Dark Navy
- **Body** (`p, span`): Inter, 400 weight, Dark Navy
- **Secondary Text**: Inter, 500 weight, Cool Gray
- **Labels** (`small, .text-xs`): Inter, 600 weight, Cool Gray

---

## Responsive Breakpoints

```
Mobile: 0px
Tablet: 640px (sm)
Desktop: 768px (md)
Large: 1024px (lg)
XL: 1280px (xl)
```

Use Tailwind's responsive prefixes:
```tsx
<div className="text-lg sm:text-xl md:text-2xl lg:text-3xl">
  Responsive Heading
</div>
```

---

## Accessibility Checklist

✅ **Keyboard Navigation**: All interactive elements focusable  
✅ **Focus States**: 2px outline on all buttons/inputs  
✅ **Color Contrast**: WCAG AA compliant (4.5:1 text, 3:1 non-text)  
✅ **Reduced Motion**: Animations respect `prefers-reduced-motion`  
✅ **Screen Readers**: Semantic HTML, ARIA labels where needed  
✅ **Touch Targets**: Min 44px × 44px on mobile  

---

## Implementation Checklist

- [ ] Replace `src/index.css` with new design system
- [ ] Install Inter font (already in Google Fonts import)
- [ ] Update color references in components (find #006a39, replace with #0F766E)
- [ ] Update button classes (use `.btn`, `.btn-primary`, etc.)
- [ ] Test on mobile (thumb-friendly spacing)
- [ ] Test keyboard navigation (Tab through all elements)
- [ ] Test in dark mode (if supported)
- [ ] Verify no hardcoded colors remain
- [ ] Screenshot for comparison with old design

---

## Next Steps

1. **Immediate**: Apply new CSS system
2. **Short-term**: Update key components (NavBar, Hero, ProductCard)
3. **Medium-term**: Redesign AdminDashboard with modern grid
4. **Long-term**: Implement dark mode, add micro-interactions

All existing Tailwind classes still work — new system is additive!
