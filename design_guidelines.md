# ZeroTrustLab Design Guidelines

## Design Approach
**System-Based with Security Tool Aesthetics**
Drawing from Material Design principles for data visualization combined with professional cybersecurity dashboard patterns seen in Splunk, Datadog, and security operations centers. Prioritizing clarity, trust, and technical precision over decorative elements.

## Layout Architecture

**Dashboard Structure:**
- Full-width app layout with persistent left sidebar (280px desktop, collapsible on tablet/mobile)
- Main content area with header bar (64px height) containing breadcrumbs, policy status indicators, and action buttons
- Network graph canvas occupies primary viewport real estate (70% width, full remaining height)
- Right panel (30% width) for live policy controls, trust score breakdown, and connection logs
- Responsive: Stack to single-column on mobile with tabbed navigation between graph and controls

**Spacing System:**
Use Tailwind units: 1, 2, 4, 6, 8, 12, 16 for consistent rhythm
- Section padding: p-6 to p-8
- Component gaps: gap-4 to gap-6
- Container spacing: mx-auto max-w-7xl
- Graph canvas: p-0 (full bleed visualization)

## Typography Hierarchy

**Font Stack:** 
Primary: Inter (body, UI elements, labels)
Monospace: JetBrains Mono (code snippets, device IDs, IP addresses, technical data)

**Hierarchy:**
- Page titles: text-2xl font-bold tracking-tight
- Section headers: text-lg font-semibold
- Card titles: text-base font-medium
- Body text: text-sm font-normal
- Labels/metadata: text-xs font-medium uppercase tracking-wider
- Technical data: text-sm font-mono
- Status badges: text-xs font-bold uppercase

## Component Library

**Navigation Sidebar:**
- Logo/brand area at top (h-16)
- Vertical nav stack with icons + labels
- Active state: subtle border-l-4 indicator
- Sections: Dashboard, Simulations, Policies, Audit Logs, Settings
- Collapsible on mobile with hamburger trigger

**Network Graph Canvas:**
- Full-height visualization area with zoom/pan controls
- Floating legend showing node types (users=circles, devices=squares, services=hexagons)
- Edge styling: solid (ALLOW), dashed (CHALLENGE_MFA), dotted (DENY)
- Mini-map overview in bottom-right corner (150x100px)
- Toolbar overlay: zoom controls, layout algorithms (force-directed, hierarchical, circular), fullscreen toggle

**Policy Control Panel:**
- Segmented cards for each policy category
- Toggle switches with clear labels and current state
- Each toggle shows affected connection count in muted text below
- Policy categories: MFA Requirements, Geographic Access, Role Permissions, Device Trust
- Live impact preview: "X connections would be affected" helper text
- Apply/Reset action buttons at panel bottom

**Trust Score Display:**
- Large prominent score (0-100) with radial progress indicator
- Breakdown list showing point deductions with icons:
  - Device unverified: -40pts
  - MFA disabled: -30pts
  - Restricted region: -20pts
  - Unauthorized role: -10pts
- Verdict badge (large, bold): ALLOW / CHALLENGE / DENY
- Historical score chart (line graph) showing last 10 simulations

**Connection Attempt Cards:**
- Compact list view of recent attempts
- Each card: User ID → Device ID, timestamp, verdict badge
- Expandable accordion for detailed breakdown
- Infinite scroll or pagination for history

**Action Buttons:**
- Primary: "Run Simulation" - prominent, high-emphasis
- Secondary: "Reset Policies", "Export Report"
- Icon buttons for graph controls (zoom, pan, reset view)
- All buttons on graph overlays: backdrop-blur-md with semi-transparent background

**Status Indicators:**
- Inline badges for verdicts with corresponding semantic treatment
- Policy status chips (Active/Inactive) in control panel
- Connection count badges in navigation
- Real-time indicators for active simulations

**Data Tables:**
- Audit log table with sortable columns: Timestamp, User, Device, Action, Verdict, Score
- Sticky header row
- Alternating row treatment for readability
- Hover state highlighting entire row
- Row actions: View Details, Export

## Images

**No hero image for this application.** This is a functional dashboard tool, not a marketing page. The network graph visualization serves as the primary visual element.

**Icon Requirements:**
- Use Heroicons throughout for consistency
- Navigation icons: chart-bar, shield-check, document-text, cog
- Status icons: check-circle (allow), exclamation-triangle (challenge), x-circle (deny)
- Action icons: play (simulate), download (export), refresh (reset)
- Node type icons in graph legend

## Interaction Patterns

**Network Graph:**
- Click node: highlight connections and show info panel
- Hover node: tooltip with entity details
- Drag nodes: reposition in canvas
- Scroll: zoom in/out
- Click edge: show connection details and trust calculation

**Policy Toggles:**
- Instant visual feedback on toggle
- Subtle animation on affected connection count update
- No page reload required

**Simulation Flow:**
- Click "Run Simulation" → modal or slide-over panel appears
- Form: select user, device, action type
- Submit → loading state → graph animates update → verdict appears
- New connection added to history log

## Accessibility

- All interactive elements keyboard navigable
- Graph navigation via arrow keys when focused
- Screen reader announcements for verdict changes
- Sufficient contrast for all text on backgrounds
- Focus indicators on all interactive elements
- Form labels properly associated with inputs

## Professional Polish

- Subtle shadows on elevated panels (shadow-lg)
- Smooth transitions on interactive states (transition-all duration-200)
- Loading skeletons for async data
- Empty states with helpful guidance when no simulations run yet
- Error states with clear messaging and recovery actions
- Confirmation dialogs for destructive actions (reset policies)
- Toast notifications for successful actions