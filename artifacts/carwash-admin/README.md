# Mig Flares Car Wash Admin Portal

A professional admin dashboard for managing car wash operations, tracking revenue, and issuing receipts.

## Design Direction

**Layout**: Dashboard grid with sidebar navigation — information-dense, organized by functional zones

**Aesthetic**: Precision instrument — sharp, confident, high-contrast interface that feels like a professional business tool

**Color Palette**: 
- Deep slate foundation (#222) with electric cyan accents (#00D9FF)
- Memorable, professional color choice that suggests both water (car wash) and digital precision
- High contrast for excellent readability during long work sessions

**Typography**:
- **Space Grotesk**: Headings — geometric, technical feel
- **DM Sans**: UI text — clean, highly legible at small sizes
- **JetBrains Mono**: Numeric data — tabular figures for perfect alignment

**Key Features**:
- Real-time dashboard with today/week/month revenue summaries
- Complete transaction history with filtering
- Quick receipt issuing workflow
- Detailed revenue reports with charts (daily/weekly/monthly)
- Service package management with pricing
- Information-dense tables optimized for scanning large datasets
- Monospace numbers throughout for visual consistency

## Routes

- `/` — Dashboard overview
- `/transactions` — Full transaction history
- `/transactions/new` — Issue new receipt
- `/reports` — Revenue analytics with charts
- `/services` — Manage car wash service packages

## Tech Stack

- React + TypeScript + Vite
- Wouter (routing)
- TanStack Query (data fetching)
- Recharts (revenue visualizations)
- shadcn/ui (component library, heavily customized)
- Tailwind CSS (styling)

## Running Locally

```bash
npm run dev
```

## Design Philosophy

Built for business owners who run tight operations. Every wash logged, every coin accounted for. The interface prioritizes information density without sacrificing clarity — users can scan large datasets quickly thanks to consistent spacing, monospace numbers, and clear visual hierarchy.

The electric cyan accent cuts through the slate foundation like a laser, drawing attention to primary actions and key metrics. Dark sidebar provides spatial anchoring while keeping the main content area bright and readable.
