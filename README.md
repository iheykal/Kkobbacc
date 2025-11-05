# 🏰 Luxury Estates - Premium Real Estate Web App

A sophisticated, luxury-focused real estate web application built with modern technologies and premium design principles.

## ✨ Features

- **Luxury Design System** - Premium UI components with sophisticated styling
- **Modern Tech Stack** - Next.js 14, React 18, TypeScript, Tailwind CSS
- **Responsive Design** - Mobile-first approach with luxury aesthetics
- **Premium Animations** - Framer Motion for smooth, elegant interactions
- **Type Safety** - Full TypeScript implementation
- **Component Library** - Reusable luxury UI components

## 🎨 Design Philosophy

### Luxury Aesthetic
- **Sophisticated Color Palette**: Deep blacks, warm whites, gold accents
- **Premium Typography**: Playfair Display for headings, Inter for body text
- **Elegant Spacing**: Generous whitespace and balanced layouts
- **Subtle Animations**: Smooth transitions and micro-interactions
- **Glass Morphism**: Modern transparency effects

### Design Tokens
- **Primary Colors**: Sophisticated grays and blacks
- **Accent Colors**: Warm golds and oranges
- **Luxury Colors**: Gold, platinum, silver, bronze
- **Typography Scale**: Elegant font sizing system
- **Spacing System**: Consistent luxury spacing

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd luxury-real-estate-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles and luxury design system
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Homepage
├── components/             # Reusable components
│   ├── ui/                # Base UI components
│   │   ├── Button.tsx     # Luxury button component
│   │   ├── Card.tsx       # Premium card component
│   │   └── Input.tsx      # Luxury input component
│   ├── layout/            # Layout components
│   │   └── Header.tsx     # Navigation header
│   └── sections/          # Page sections
│       └── Hero.tsx       # Hero section component
├── lib/                   # Utility functions
│   └── utils.ts           # Helper functions
└── types/                 # TypeScript definitions
    └── index.ts           # App type definitions
```

## 🎯 Component Library

### Button Component
Premium button with multiple variants and luxury styling:
```tsx
<Button 
  variant="gold" 
  size="lg" 
  icon={<Search />}
>
  Search Properties
</Button>
```

**Variants**: `primary`, `secondary`, `outline`, `ghost`, `luxury`, `gold`
**Sizes**: `sm`, `md`, `lg`, `xl`

### Card Component
Elegant card component with premium styling:
```tsx
<Card variant="premium" padding="lg">
  <CardHeader>Property Details</CardHeader>
  <CardContent>Content here</CardContent>
  <CardFooter>Footer content</CardFooter>
</Card>
```

**Variants**: `default`, `elevated`, `glass`, `premium`, `featured`

### Input Component
Luxury input field with validation states:
```tsx
<Input
  label="Property Address"
  placeholder="Enter address"
  icon={<MapPin />}
  variant="luxury"
/>
```

## 🎨 Design System Usage

### Typography
```css
/* Display fonts for headings */
.font-display { font-family: var(--font-playfair); }
.font-elegant { font-family: var(--font-cormorant); }

/* Luxury text gradients */
.text-gradient-gold { /* Gold gradient text */ }
.text-gradient-primary { /* Primary gradient text */ }
```

### Colors
```css
/* Luxury color palette */
.bg-luxury-gradient { /* Luxury background gradient */ }
.border-luxury { /* Gold accent borders */ }
.text-luxury-gold { /* Gold accent text */ }
```

### Animations
```css
/* Luxury animations */
.animate-float { /* Floating animation */ }
.animate-glow { /* Glowing effect */ }
.card-luxury { /* Premium card hover */ }
```

## 🔧 Customization

### Tailwind Configuration
The `tailwind.config.js` file contains:
- Custom luxury color palette
- Typography scale
- Animation keyframes
- Custom spacing values
- Premium shadows and effects

### Global Styles
`src/app/globals.css` includes:
- Luxury design system utilities
- Custom component styles
- Animation definitions
- Luxury-specific classes

## 📱 Responsive Design

The app is built with a mobile-first approach:
- **Mobile**: Optimized for small screens
- **Tablet**: Enhanced layouts for medium screens
- **Desktop**: Full luxury experience on large screens

## 🚀 Deployment

### Build for Production
```bash
npm run build
npm start
```

### Environment Variables
Create a `.env.local` file:
```env
NEXT_PUBLIC_APP_NAME=Luxury Estates
NEXT_PUBLIC_API_URL=your-api-url
```

## 🎯 Future Enhancements

- [ ] Property listing components
- [ ] Advanced search functionality
- [ ] User authentication system
- [ ] Property management dashboard
- [ ] Interactive maps integration
- [ ] Virtual tour capabilities
- [ ] Agent profiles
- [ ] Contact forms
- [ ] Admin panel

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🏆 Acknowledgments

- **Design Inspiration**: Luxury real estate brands worldwide
- **Icons**: Lucide React for premium iconography
- **Animations**: Framer Motion for smooth interactions
- **Typography**: Google Fonts for premium typefaces

---

**Built with ❤️ for luxury real estate professionals and discerning clients.**
