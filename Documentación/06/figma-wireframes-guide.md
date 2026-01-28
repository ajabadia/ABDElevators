# FIGMA WIREFRAMES GUIDE - ABD RAG UX Redesign

## 📊 Complete Wireframe Assets Generated

### Main Dashboards (4 core screens)

1. **Admin Dashboard Wireframe**
   - Sticky "Atención Requerida" widget at top
   - 4-column metrics grid (Users, Storage, API, RAG Search)
   - User Management table with inline actions
   - Security Incidents section
   - Quick Admin Actions buttons
   - Draggable widgets for personalization

2. **Tecnico Workspace Wireframe**
   - Sticky action panel (top-left) with pending tasks
   - 4-quadrant layout:
     - Top-left: Recent documents with upload/template buttons
     - Top-right: Quick RAG search with examples
     - Bottom-left: My pedidos with progress bars
     - Bottom-right: My open tickets
   - My Analysis table (Fecha, Query, Resultados, Acciones)
   - Resources quick links

3. **Engineering Dashboard Wireframe**
   - Pinned Quality Metrics at top (Faithfulness, Answer Relevance, Context Precision)
   - Side-by-side columns:
     - Left: Prompts management (Active, Test Mode, History, Compare)
     - Right: Model comparison (Current, Latency, Cost, Alternatives)
   - Performance Trends section (3 charts)
   - Embeddings & Vectors info
   - A/B Testing section with experiments
   - Detailed Evaluation with queries and scores

4. **Settings Modal Wireframe**
   - Clear sections: Perfil | Seguridad | Notificaciones | Zona de Peligro
   - Perfil: Name, Email, Photo, Language, Timezone, Theme
   - Seguridad: Change Password, MFA status, Active Sessions list, IP Allowlist
   - Notificaciones: Global preferences + per-event granular controls
   - Danger Zone: Account deletion, GDPR data export

---

### Navigation & Layout Components (3 screens)

5. **Top Navbar Wireframe**
   - Left: Hamburger + Logo "ABD RAG"
   - Center: Breadcrumb navigation (e.g., "Admin > Users")
   - Right: Search (Cmd+K), Help icon, Notification bell (with badge count), Avatar dropdown
   - Always sticky/visible
   - Minimal design with teal accents

6. **Sidebar States Wireframe** (Comparison)
   - EXPANDED (250px): Full navigation with icons + labels
     - Dashboard, Administración, Documentos, Pedidos, Casos, Ajustes
     - Nested items visible (Tenants, Usuarios, Config, Auditoría under Administración)
   - COLLAPSED (60px): Icons only with hover tooltips
   - Shows toggle button between states
   - Different per role (Admin vs Tecnico vs Ingenieria)

7. **Role-Based Sidebars Comparison**
   - Three sidebars side-by-side showing role-specific navigation
   - ADMIN: Dashboard Operativo, Administración (expanded), Documentos Técnicos, Pedidos, Casos, Ajustes
   - TECNICO: Mi Workspace, Documentos Disponibles, Mis Pedidos, Soporte, Análisis Guardados, Perfil
   - INGENIERIA: Engineering Dashboard, RAG Configuration, Evaluación de Calidad, Modelos & Prompts, Preferencias

---

### Core Interaction Patterns (6 screens)

8. **Documents File Explorer**
   - Hierarchical folder structure with breadcrumb
   - [+ Upload] [+ Create] [Import from...] buttons
   - Search box with [Filters ▼] [View ▼]
   - Tree view: 2024 folder (Q1.pdf, Q2.pdf), Manuales, Especificaciones
   - Right-click context menu: Open, Download, Share, Rename, Move, Archive, Delete, Metadata
   - Drag-and-drop support for reorganization
   - File metadata shown on hover

9. **User Management Table**
   - Columns: Email | Role | Last Active | Status
   - [+ New User] [Bulk Import] [Export] buttons above
   - Hover state on each row reveals: [Edit] [Disable] [Delete]
   - Status badges: Active (green), Pending (yellow), Inactive (gray)
   - "Pendientes: 2 flagged" indicator
   - Inline actions (no modal for simple operations)

10. **Notification Hub Wireframe**
    - Dropdown panel from bell icon
    - Tabs: [Inbox] [Archive] [Preferences]
    - Grouped by severity:
      - 🔴 CRÍTICAS (2 items, red) with action buttons (Approve/Reject)
      - 🟡 IMPORTANTES (3 items, yellow)
      - ⚪ RECIENTES (20+ items, gray with archive/delete)
    - Each notification shows: icon, title, time, contextual actions
    - Badge with count visible on bell

11. **Global Search Results**
    - Prominent search box with "Cmd+K" indicator
    - "Quick Examples" section with clickable tags
    - Results section with "Showing results for..." label
    - Result cards grouped by type (documents, users, tickets)
    - Each result shows: icon, title, metadata (date/email/status), click-to-navigate arrow
    - Color-coded by type (teal for docs, blue for users, orange for tickets)

12. **RAG Search Interface**
    - Large search input at top: "¿Qué quieres saber?"
    - Below: Quick Examples section
    - Results area: "Showing 5 results" with [Load More]
    - Each result card: Document title, Score badge (0.92), Excerpt with highlights, [View Full], [Mark Relevant]
    - Right sidebar (collapsible):
      - 📊 Answer Summary (LLM-generated)
      - 📝 Sources Cited (clickable links)
      - 💾 [Save Analysis] [Share] [Export]
      - 🔄 [Regenerate with Different Model]
      - 📚 [Related Searches]

---

### Interactive States (3 screens)

13. **Inline Confirmation Pattern**
    - Normal state: Table row with document name, type, date, size, [Open] [Download] [Share] buttons
    - Delete state: Row turns red background, [Confirm Delete] button (red), [Undo] link
    - Toast notification: "Document will be deleted in 5 seconds" with Undo option
    - No modal interruption
    - Auto-hides after 5 seconds if no action

14. **Expandable Row Pattern**
    - Normal state: Ticket row showing #ID, title, status badge
    - Expanded state: Row expands vertically, inline comments section appears below
      - Shows comment 1 from User A "2h ago"
      - Shows comment 2 from User B "1h ago"
      - Text area: [+ Add Comment]
    - Delete state: Row background turns red, [Confirm Delete], [Undo] link
    - Multiple rows can be in different states simultaneously

15. **Progressive Disclosure Form (3-Step Wizard)**
    - Step 1/3: Essential fields only (Nombre, Email, Rol) + [Siguiente] button
    - Step 2/3: Secondary config (Timezone, Idioma, MFA toggle) + [Crear] button
    - Step 3/3: Success screen "¡Estás listo!" with next steps + [Ir a Dashboard]
    - No overwhelm, contextual help at each step
    - Back button available to previous step

---

### Mobile & Empty States (3 screens)

16. **Mobile Responsive Layout**
    - Full-screen hamburger menu instead of sidebar
    - Table transforms to stacked card layout
    - Each ticket shows as individual card:
      - Status badge (color-coded)
      - Ticket ID, brief title
      - Status line, Last activity time
      - [View & Reply] action button
    - Bottom: Floating [+ New] button + [FAQ] link
    - Touch-friendly spacing and text size

17. **New User Onboarding (Empty State)**
    - Centered content with welcome icon
    - "👋 Welcome to ABD RAG Platform!"
    - "You're all set up. Here's what's next:"
    - Step 1: Upload Your First Document
      - [+ Upload PDF] [Sample Docs] buttons
      - "Takes < 1 min"
    - Step 2: Run Your First Search
      - Example query shown
      - "See AI-powered search in action"
    - Step 3: Explore Settings
      - [Configure Notifications] [Setup MFA]
      - "Optional, but recommended"
    - 📚 Resources: [Video Tutorial] [Quick Start Guide] [Chat with Support]
    - Bottom actions: [Start Uploading] [Take Tour] [Later]

18. **No Documents Empty State**
    - Icon + heading "No documents yet"
    - [+ Upload Your First] [Browse Samples] buttons
    - "Why upload documents?" section explaining benefits
    - File format info: "Max: 50MB/doc | Formats: PDF, TXT, etc"
    - Inviting, helpful tone

---

## 🎨 Figma Project Structure

```
ABD RAG - UX Redesign (Main Project)
│
├─ WIREFRAMES (Page 1)
│  ├─ 📱 Mobile & Responsive
│  ├─ 📊 Dashboards (Admin, Tecnico, Ingenieria)
│  ├─ ⚙️  Settings & Notifications
│  ├─ 🗂️  Navigation (Navbar, Sidebar)
│  ├─ 🎯 Patterns (Confirmations, Expandable rows, Progressive disclosure)
│  ├─ 📄 Documents & Search
│  └─ 🚀 Empty States & Onboarding
│
├─ DESIGN SYSTEM (Page 2)
│  ├─ 🎨 Colors
│  │  ├─ Primary: Teal (#208091, #1E747B, #1A6873)
│  │  ├─ Secondary: Gray (#245245, #5E5240, #A7A9A9)
│  │  ├─ Status: Red (#C0152F), Yellow (#E6815F), Green (#208091)
│  │  └─ Backgrounds: 8-color palette
│  ├─ 📝 Typography
│  │  ├─ H1: Inter 30px Bold
│  │  ├─ H2: Inter 24px Semibold
│  │  ├─ Body: Inter 14px Regular
│  │  └─ Caption: Inter 12px Regular
│  ├─ 📏 Spacing Scale (2, 4, 6, 8, 12, 16, 20, 24, 32, 48)
│  ├─ ◎ Border Radius (sm: 6px, base: 8px, lg: 12px, full: 9999px)
│  ├─ 💫 Shadows (xs, sm, md, lg, inset)
│  └─ 🎯 Icons (Navigation, Status, Actions)
│
├─ HIGH FIDELITY (Page 3)
│  ├─ Admin Dashboard [Styled + Interactions]
│  ├─ Tecnico Workspace [Styled + Interactions]
│  ├─ Engineering Dashboard [Styled + Interactions]
│  ├─ Settings Modal [Styled]
│  ├─ Search Interface [Styled]
│  └─ Mobile Layouts [Responsive]
│
├─ COMPONENTS (Page 4)
│  ├─ 🔘 Button
│  │  ├─ Primary / Default, Hover, Active, Disabled
│  │  ├─ Secondary / Default, Hover, Active, Disabled
│  │  ├─ Danger / Default, Hover
│  │  └─ Icon buttons
│  ├─ 🃏 Card
│  │  ├─ Default, Hover, Loading
│  │  ├─ Elevated, Flat
│  │  └─ With shadow states
│  ├─ 📍 Sidebar Item
│  │  ├─ Default, Active, Hover
│  │  ├─ Nested items
│  │  └─ Collapsed state (icon only)
│  ├─ 🏷️  Badge
│  │  ├─ Status: Active, Pending, Critical, Warning
│  │  ├─ Color variants
│  │  └─ With icons
│  ├─ 📋 Table Row
│  │  ├─ Default, Hover, Selected
│  │  ├─ Expanded (inline content)
│  │  └─ Delete state (red row)
│  ├─ 📬 Notification Item
│  │  ├─ Critical, Important, Recent
│  │  ├─ With action buttons
│  │  └─ With archive/dismiss
│  ├─ ✏️  Form Input
│  │  ├─ Default, Focus, Error, Disabled
│  │  ├─ With labels & hints
│  │  └─ With validation states
│  ├─ 📌 Sticky Panel (Actions, Notifications)
│  ├─ ⚠️  Empty State (Illustration, CTA, Text)
│  └─ 💬 Modal (Fullscreen, Centered, Drawer)
│
├─ PROTOTYPES (Page 5)
│  ├─ 🔄 User Flow: Admin adds user
│  │  ├─ Frame 1: Dashboard + [+ New User] button
│  │  ├─ Frame 2: Modal opens with form
│  │  ├─ Frame 3: Success confirmation
│  │  └─ Frame 4: Back to Dashboard
│  ├─ 📄 User Flow: Tecnico uploads document
│  │  ├─ Frame 1: Documents page
│  │  ├─ Frame 2: Upload modal
│  │  ├─ Frame 3: Processing
│  │  └─ Frame 4: Search and save
│  ├─ 🔐 User Flow: Settings navigation
│  │  ├─ Frame 1: Settings page
│  │  ├─ Frame 2: Security section
│  │  └─ Frame 3: MFA setup
│  ├─ 🔔 User Flow: Notification interaction
│  │  ├─ Frame 1: Notification bell with count
│  │  ├─ Frame 2: Dropdown opens
│  │  ├─ Frame 3: Click notification
│  │  └─ Frame 4: Archive
│  └─ 📱 User Flow: Mobile navigation
│     ├─ Frame 1: Mobile home
│     ├─ Frame 2: Hamburger menu open
│     ├─ Frame 3: Select navigation item
│     └─ Frame 4: Page loads
│
└─ HANDOFF (Page 6)
   ├─ 📐 Dev Specs
   │  ├─ Spacing rules
   │  ├─ Color tokens (RGB, Hex, CSS vars)
   │  └─ Typography (font-family, size, weight, line-height)
   ├─ 🧩 Component Props
   │  ├─ All variants
   │  ├─ States (hover, active, disabled)
   │  └─ Optional slots
   ├─ 📱 Responsive Breakpoints
   │  ├─ Mobile: <768px
   │  ├─ Tablet: 768-1024px
   │  └─ Desktop: >1024px
   ├─ ⏱️  Animation Specs
   │  ├─ Transition durations
   │  ├─ Easing functions
   │  └─ Hover/Click animations
   ├─ ♿ Accessibility Notes
   │  ├─ WCAG 2.1 AA compliance
   │  ├─ Color contrast ratios
   │  ├─ Focus states
   │  └─ ARIA labels
   └─ ✅ Implementation Checklist
      ├─ Responsive tested
      ├─ Accessibility verified
      ├─ Dark mode working
      ├─ Performance optimized
      └─ Cross-browser tested
```

---

## 🚀 How to Set Up in Figma

### Step 1: Create Project
1. Go to figma.com
2. Click "New File"
3. Name it: "ABD RAG - UX Redesign"
4. Create pages as listed above

### Step 2: Import Wireframes as Reference
1. Go to Page 1: WIREFRAMES
2. For each wireframe image:
   - Menu → Insert → Image
   - Upload wireframe PNG
   - Lock layer (so it doesn't move)
   - Set opacity to 25-30%
   - Use as underlay for component design

### Step 3: Build Design System (Page 2)
1. Create Color Styles:
   ```
   Primary/Teal-600: #208091
   Primary/Teal-500: #1E747B
   Primary/Teal-400: #1A6873
   Secondary/Gray-900: #245245
   Status/Error: #C0152F
   Status/Warning: #E6815F
   Status/Success: #208091
   ```

2. Create Typography Styles:
   ```
   Heading/H1: Inter, 30px, Bold (600), 1.2 line-height
   Heading/H2: Inter, 24px, Semibold (550), 1.2 line-height
   Heading/H3: Inter, 20px, Semibold (550), 1.2 line-height
   Body/Regular: Inter, 14px, Regular (400), 1.5 line-height
   Body/Small: Inter, 12px, Regular (400), 1.5 line-height
   Caption: Inter, 11px, Regular (400), 1.5 line-height
   ```

3. Create Spacing Variables:
   ```
   2px, 4px, 6px, 8px, 10px, 12px, 16px, 20px, 24px, 32px, 48px
   ```

### Step 4: Design High-Fidelity Mockups (Page 3)
1. Duplicate wireframes
2. Apply design system colors, typography, spacing
3. Create interactive states (hover, active, disabled)
4. Add micro-interactions and animations
5. Test responsive scaling with auto-layout

### Step 5: Build Component Library (Page 4)
1. Create master components for:
   - Button (all variants)
   - Card (all states)
   - Form inputs
   - Tables
   - Notifications
   - Modals
   - Sidebar items
   - Badges
   - Empty states
2. Document variants in description
3. Use "Copy as code" for dev handoff

### Step 6: Create Prototypes (Page 5)
1. Design key user flows
2. Add interactions:
   - Button click → Next frame
   - Hover → State change
   - Esc key → Close modal
3. Test in Prototype mode
4. Share prototype link with stakeholders

### Step 7: Generate Dev Specs (Page 6)
1. Enable Figma Dev Mode
2. Select each component
3. Generate CSS snippets
4. Document:
   - Spacing (margin, padding)
   - Colors (RGB, hex, CSS variables)
   - Typography (font, size, weight)
   - Shadows and radius
5. Create implementation checklist

---

## 🎯 Figma Best Practices

### Organization
- ✅ Use frames for each screen size
- ✅ Name components clearly: `Button/Primary/Default`
- ✅ Group related components in folders
- ✅ Use auto-layout for responsive scaling
- ✅ Create tokens for reusable values

### Collaboration
- ✅ Share link with Dev team (View-only for specs)
- ✅ Use comments for design decisions
- ✅ Pin important notes on complex interactions
- ✅ Create "Design Brief" page with project goals
- ✅ Update component library when changes needed

### Handoff Quality
- ✅ Export components as PNG for documentation
- ✅ Use Inspect feature (right panel) for CSS values
- ✅ Create detailed specs page with measurements
- ✅ Document responsive breakpoints
- ✅ Include animation and interaction specs
- ✅ Provide accessibility notes (WCAG 2.1 AA)

---

## 📋 Implementation Priority

### Tier 1: Do First (2-3 weeks)
1. ✅ Role-based dashboards (Admin, Tecnico, Ingenieria)
2. ✅ Sidebar reorganization (clear hierarchy)
3. ✅ Notification hub (centralized)
4. ✅ Inline confirmations (no modals)

### Tier 2: Do Next (2-3 weeks)
5. 📌 Sticky action panel
6. 🔍 Global search (Cmd+K)
7. 💬 Floating support widget
8. 🎨 Empty states with guidance

### Tier 3: Polish (1-2 weeks)
9. ⌨️ Keyboard shortcuts
10. 📱 Mobile responsiveness
11. 🎭 Micro-interactions
12. 🌗 Dark mode support

---

## 📊 Success Metrics

### Task Completion
- Find document: 4 clicks → 2 clicks (-50%)
- Create ticket: 6 steps → 3 steps (-50%)
- Check pending: Hidden → Sticky panel (+∞)
- Time to first action: 30s → 5s (-83%)

### User Engagement
- Daily active users: +25%
- Feature adoption: +40%
- Support tickets (UX-related): -30%

### Performance
- Time to first interaction: <2s
- Page load: <1s
- Search results: <500ms
- Navigation bounce rate: <5%