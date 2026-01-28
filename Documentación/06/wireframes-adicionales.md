# 📦 WIREFRAMES ADICIONALES - ABD RAG Platform

## 🎯 11 Wireframes Nuevos Generados

### Business Features (8 wireframes)

#### 1. Pedidos Management Wireframe
- Lista de pedidos con status tracking
- Columns: ID, Estado, Progreso, Asignado a, Fecha, Acciones
- Status badges color-coded (Analysis=blue, Completed=green, Review=yellow, Pending=red)
- Progress bars visuales
- Hover reveals action buttons [View] [Edit] [Delete]
- [+ New Pedido] [Filters] [View options] buttons
- Search y filtrado

#### 2. Pedido Detail View Wireframe
- Split layout: 80% detalle izquierda, 20% side panel derecha
- Left panel:
  - Pedido #234 header con status badge y progress bar
  - Secciones expandibles: Información General, Documentos, Análisis, Timeline
  - Timeline muestra estado changes con fechas y usuarios
- Right panel:
  - Acciones Rápidas: [Aprobar] [Rechazar] [Reasignar]
  - Detalles: assigned to, created by, dates
  - Historial de Cambios: log entries
- Professional split-view design

#### 3. Tickets/Support Management Wireframe
- Service desk style ticket listing
- [+ New Ticket] [Filters: Status, Priority, Assigned] buttons
- Cards/table showing: ID, Status badge, Priority badge, Title, Assigned to, Last updated
- Color coding: In Progress=red, Waiting=yellow, Resolved=green
- Hover reveals [View & Reply] action
- Search box for finding tickets
- Professional support interface

#### 4. Ticket Detail Conversation Wireframe
- Top bar: Ticket #45 title, status badge, priority
- Main: Thread-based conversation messages stacked
  - Each message: User avatar, name, timestamp, message body
  - Attachments shown inline
  - Messages from different users clearly differentiated
- Bottom: Comment input field + [Attach File] button
- Right sidebar:
  - Ticket Details (Status, Priority, Assigned dropdowns)
  - Quick Actions: [Mark as Solved] [Escalate] [Reassign]
  - Related Tickets links
- Professional support ticket interface

#### 5. Audit Trail Wireframe
- Page title "Historial de Auditoría"
- Date range picker + [Apply] button
- Filters: [User] [Action Type] [Resource Type] [Search]
- Timeline/log of activities showing:
  - Timestamp, Action type (color-coded), User, Resource, Details link
  - Example: "User A approved Pedido #234" at "14:30"
  - Example: "Admin B changed user role to TECNICO"
  - Example: "Tecnico A uploaded document"
- Pagination or infinite scroll
- Professional audit log design

#### 6. Prompts Management Wireframe
- Page title "Prompts Ingeniería" con [+ New Prompt]
- Two-column layout (60% left list, 40% right detail)
- Left column: List of prompts
  - Prompt name, Status badge (Active/Inactive), Version, Created date
  - Hover: [Edit] [Test] [History] buttons
- Right column: Detail panel for selected prompt
  - Title, Description, Tags, Version history
  - Last modified info
  - [Edit] [Duplicate] [Delete] buttons
- Professional prompt management con version control

#### 7. Prompt Testing & Editing Wireframe
- Full-screen editor: 50% left editor, 50% right testing panel
- Left side:
  - Prompt Name input
  - Prompt Content large textarea
  - [Test] [Save] [Cancel] buttons
- Right side: Testing Panel
  - Test Input textarea
  - [Run Test] button
  - Test Results:
    - Query: [user's test question]
    - Response: [LLM response read-only]
    - Metrics: Latency, Token usage, Cost
  - Score Evaluation: Faithfulness, Relevance, Precision (with bars)
  - Expandables: Raw Response, Tokens, Trace
- Code editor style design

#### 8. Billing & Usage Dashboard Wireframe
- Overview cards (3 columns):
  - Current Billing Period (amount + next invoice date)
  - Storage Used (2.3 GB / 5 GB with progress bar)
  - API Calls (145,320 / 500,000 with bar)
- Tabs: [Tokens] [API Calls] [Storage]
- Main section: Usage breakdown
  - Line chart showing consumption over 30 days
  - Detailed breakdown below (Gemini calls, Embeddings, etc.) with costs
- Right sidebar:
  - Current Plan (Professional €99/mo)
  - Features list
  - [Upgrade Plan] [Download Invoice] buttons
- Footer: Upcoming Invoices list
- Professional billing dashboard

### Additional Pages (3 wireframes)

#### 9. User Management Admin Wireframe
- Page title "Gestión de Usuarios"
- [+ Invite User] [Bulk Import] [Export] buttons
- Filters: [Role] [Status] [Search]
- User table with columns: Email | Name | Role | Last Active | MFA | Status | Actions
- Row examples:
  - admin@abd.es, ADMIN, "5 min ago", ✅ MFA, Active (green), [Edit] [Disable]
  - tecnico@abd.es, TECNICO, "2h ago", ✅ MFA, Active, [Edit] [Disable]
  - user@abd.es, -, Never, ❌ MFA, Pending (yellow), [Resend] [Cancel]
- Role colors: ADMIN=blue, TECNICO=teal, INGENIERIA=purple, PENDING=gray
- Professional user directory

#### 10. Organization Settings Wireframe
- Page title "Configuración de la Organización"
- Tabs: [Información General] [Integraciones] [Seguridad] [Equipo]
- Información General tab:
  - Organization Name input
  - Logo upload area
  - Description textarea
  - Website input
  - Industry select
- Integraciones tab:
  - Available integrations cards (Stripe, Webhook, Zapier)
  - Status: Connected, Not connected, Coming soon
  - [Configure] [Disconnect] buttons
- Seguridad tab:
  - SSO Configuration toggle
  - SAML Endpoint field
  - Certificate upload
- [Save Changes] [Cancel] buttons
- Professional settings interface

#### 11. Error Page Wireframe
- Centered error layout
- Large error icon
- Error heading "Algo salió mal"
- Error code "Error #5001"
- Error description with explanation
- Error code para support team
- Button group: [Ir al Home] [Ir al Dashboard] [Contactar Soporte]
- Optional expandable "Detalles técnicos" (error trace)
- Subtle background pattern
- Red color coding for errors
- Mobile-responsive design

---

## 📊 Resumen Total de Wireframes

### Original (19)
- 4 Core Dashboards
- 3 Navigation components
- 5 Core features
- 3 Interaction patterns
- 3 Mobile & Empty states
- 1 Summary grid

### Adicionales (11)
- 8 Business features
- 3 Additional pages

**TOTAL: 30 wireframes de producción-ready**

---

## 🎨 Cómo Usar los Nuevos Wireframes

### En Figma
1. Crear nueva página "BUSINESS FEATURES"
2. Importar los 11 PNGs como reference layers
3. Seguir mismo workflow que con wireframes anteriores
4. Apply design system tokens
5. Create high-fidelity versions

### En Documentación
1. Actualizar figma-wireframes-guide.md con nuevos wireframes
2. Añadir estos a implementation checklist
3. Update timeline (agregará 1-2 días más)

### Para Desarrollo
1. Usar wireframes como especificación de requisitos
2. Implementar en orden:
   - Week 1: Pedidos (management + detail)
   - Week 2: Tickets (listing + detail)
   - Week 3: Prompts (management + testing)
   - Week 4: Settings (organization + audit)
   - Week 5: Billing + Error pages

---

## ⏱️ Timeline Actualizado

### Design Phase (Figma)
- Week 1: Setup + Core Dashboards
- Week 2: Navigation + Core Features + Patterns
- Week 3: Mobile + Empty States + New Business Features
- Week 4: High-fidelity refining + component library
- **Total: 4 weeks** (vs. 2 original)

### Development Phase
- Week 1-2: Navigation + Core Dashboards
- Week 3-4: Core Features (Documents, Search, Notifications)
- Week 5-6: Pedidos Management + Tickets Support
- Week 7-8: Prompts Engineering + Settings
- Week 9-10: Billing + Organization + Audit Trail
- Week 11: Error handling + Polish
- **Total: 11 weeks** (vs. 8-10 original)

### Testing & Launch
- Week 12-13: Testing + Bugfixes
- Week 14: Performance tuning + Documentation
- **Total: 14 weeks complete project**

---

## 📋 Updated Component Library

### NEW COMPONENTS TO CREATE

**Pedidos Components:**
- PedidoCard (with status, progress, actions)
- PedidoDetailView
- PedidoTimeline
- ProgressBar (percentage + label)

**Tickets Components:**
- TicketCard (with priority, status)
- TicketDetail
- ConversationThread
- MessageBubble (user + timestamp + attachments)

**Prompts Components:**
- PromptCard (with version, status)
- PromptEditor
- PromptTester (split pane)
- ScoreCard (Faithfulness, Relevance, etc.)

**Admin Components:**
- UserCard / UserRow
- OrganizationSettings (form)
- IntegrationCard
- AuditLogEntry
- TimelineItem

**Billing Components:**
- MetricsCard (usage overview)
- UsageChart (line chart)
- BillingBreakdown (detailed costs)
- PlanCard

**Error Components:**
- ErrorPage (centered layout)
- ErrorMessage
- ErrorDetails (expandable)
- RecoveryActions (buttons)

---

## 🚀 Next Steps

1. **Review nuevos wireframes** - Validate structure y layout
2. **Update Figma project** - Importar los 11 nuevos PNGs
3. **Revise timeline** - Adjust de 5 weeks a 4-5 weeks (design)
4. **Plan development** - Sequence features por dependencies
5. **Create component map** - Document all 45+ components needed

---

## 💡 Key Additions

**Pedidos Management:**
- Complete CRUD workflow para pedidos
- Status tracking con progress visualization
- Detail view con timeline y actions
- Meets business requirement from platform

**Tickets/Support:**
- Full support desk functionality
- Thread-based conversations
- Status/priority management
- Customer-facing ticketing

**Prompts Engineering:**
- Prompt versioning
- Live testing interface
- Quality score evaluation
- Essential para RAG tuning

**Admin/Ops:**
- User management dashboard
- Organization settings
- Audit trail para compliance
- Billing visibility

**Error Handling:**
- Graceful error pages
- User-friendly error messages
- Support escalation path
- Improves reliability perception

---

## ✅ Entregables Completados

**Wireframes:** 30 (19 original + 11 new)  
**Documentation:** 4 markdown files  
**Design System:** Complete with colors, typography, spacing  
**Component Library:** 45+ components mapped  
**Timeline:** Detailed 14-week implementation plan  

**You're ready to:**
1. ✅ Create Figma project with complete design system
2. ✅ Get stakeholder sign-off on all features
3. ✅ Start development with clear specifications
4. ✅ Implement 30 screens across all roles
5. ✅ Launch enterprise-ready platform