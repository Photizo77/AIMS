# AIMS-App Complete Structure Analysis

## Project Overview
**Project**: ARDHI AIMS Frontend (React + TypeScript + Vite)
**Location**: `C:\Users\user\Desktop\DR.PETER\aims-app`
**Status**: Production frontend with 25+ pages, multiple personas, AI-powered workflows

---

## Directory Structure

```
aims-app/
├── .git/                          # Version control
├── .netlify/                      # Netlify deployment config
├── dist/                          # Production build output
├── node_modules/                  # Dependencies
├── public/                        # Static assets
├── server/                        # Backend server (if any)
├── src/                           # SOURCE CODE
│   ├── assets/                    # Images, icons, fonts
│   ├── components/                # React components (14 domains)
│   │   ├── admin/                 # Admin features (6 files)
│   │   ├── approvals/             # Approval workflows
│   │   ├── auth/                  # Authentication UI
│   │   ├── dashboard/             # Dashboard widgets
│   │   ├── documents/             # Document management
│   │   ├── finance/               # Finance/budget features
│   │   ├── form/                  # Form handling
│   │   ├── forms/                 # Form builder/editor
│   │   ├── grants/                # Grants management (6 files)
│   │   ├── innovation/            # Innovation tracking
│   │   ├── inventory/             # Inventory management
│   │   ├── layout/                # App shell, nav, header (7 files)
│   │   ├── rbac/                  # Role-based access control
│   │   └── ui/                    # Reusable UI components (8 files)
│   ├── config/                    # Configuration (4 files)
│   │   ├── forms.ts               # Form field definitions
│   │   ├── geofence.ts            # Geolocation boundaries
│   │   ├── navigation.ts          # Navigation menu structure
│   │   └── roles.ts               # Role permissions & access
│   ├── context/                   # React Context providers (3 files)
│   │   ├── AttendanceContext.tsx  # Check-in state
│   │   ├── AuthContext.tsx        # User authentication
│   │   └── NotificationContext.tsx # Toast/bell notifications
│   ├── data/                      # Mock data
│   │   └── grants.ts              # Mock grants dataset
│   ├── lib/                       # Utilities
│   │   └── utils.ts               # Helper functions (cn, etc)
│   ├── pages/                     # Page components (25 files)
│   │   ├── auth/                  # Login/logout pages
│   │   ├── AIAssistant.tsx        # AI assistant page
│   │   ├── Analytics.tsx          # Analytics dashboard
│   │   ├── Approvals.tsx          # Approval workflows
│   │   ├── Attendance.tsx         # Check-in/geofencing
│   │   ├── Chat.tsx               # Chat interface
│   │   ├── CRM.tsx                # Customer relationship
│   │   ├── Dashboard.tsx          # Main dashboard
│   │   ├── Documents.tsx          # Document hub
│   │   ├── Email.tsx              # Email interface
│   │   ├── Feed.tsx               # Activity feed
│   │   ├── Finance.tsx            # Finance/budgeting
│   │   ├── FormsLibrary.tsx       # Forms catalog
│   │   ├── GrantDetail.tsx        # Grant detail view
│   │   ├── Grants.tsx             # Grants list/pipeline
│   │   ├── HR.tsx                 # HR management
│   │   ├── InnovationDetail.tsx   # Innovation project detail
│   │   ├── Inventory.tsx          # Inventory tracking
│   │   ├── Knowledge.tsx          # Knowledge base
│   │   ├── Procurement.tsx        # Procurement requests
│   │   ├── RBAC.tsx               # Role management
│   │   ├── Research.tsx           # Research hub
│   │   ├── Settings.tsx           # User settings
│   │   └── Tasks.tsx              # Task management
│   ├── types/                     # TypeScript definitions
│   │   └── index.ts               # Innovation types only
│   ├── App.tsx                    # Root component + routing
│   ├── index.css                  # Global styles
│   └── main.tsx                   # Entry point
├── index.html                     # HTML template
├── package.json                   # Dependencies & scripts
├── postcss.config.js              # PostCSS configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── tsconfig.json                  # TypeScript configuration
├── tsconfig.node.json             # Node TypeScript config
└── vite.config.ts                 # Vite build configuration
```

---

## Key Statistics

| Metric | Count |
|--------|-------|
| **Page Components** | 25 |
| **Component Directories** | 14 domains |
| **Context Providers** | 3 (Auth, Notifications, Attendance) |
| **Configuration Files** | 4 |
| **Type Definitions** | 1 file (only Innovation types) |
| **Utility Files** | 1 |
| **Mock Data Sources** | 1 (grants.ts) |
| **Total Components** | 40+ |

---

## Core Features by Domain

### 1. **Authentication & Authorization**
- **Files**: `AuthContext.tsx`, `auth/ pages`, `roles.ts`
- **Features**: 
  - 8 test user personas
  - Role-based access control (8 roles: CD, ED, SYS_ADMIN, COMPANY_ADMIN, FINANCE, GRANTS_MANAGER, GRANT_WRITER, INNOVATOR)
  - Module-level access control
- **Status**: Mock-based, no real API

### 2. **Grants Management**
- **Files**: `GrantDetail.tsx`, `Grants.tsx`, `grants/components/`, `data/grants.ts`
- **Features**:
  - Grant discovery and application workspace
  - Pipeline tracking (identified → drafting → submitted → under_review → awarded)
  - Milestone management
  - Document uploads
  - AI writing assistant
- **Status**: Mock data, no backend integration

### 3. **Finance & Budgeting**
- **Files**: `Finance.tsx`, `finance/ components/`
- **Features**:
  - Transaction tracking
  - Budget analysis
  - Department filtering
  - Financial charts and reports
- **Status**: Mock data only

### 4. **HR & Attendance**
- **Files**: `HR.tsx`, `Attendance.tsx`, `admin/ components/`, `AttendanceContext.tsx`
- **Features**:
  - Employee management
  - Attendance check-in with geofencing
  - Performance reviews
  - Payroll management
  - Contracts tracking
- **Status**: Mock data, geofencing configured but not integrated

### 5. **Innovation Management**
- **Files**: `InnovationDetail.tsx`, `innovation/ components/`
- **Types**: Defined in `types/index.ts`
- **Features**:
  - Project tracking through 6 stages (research → deployed)
  - Milestone management
  - Activity logging
  - Comments and flags
  - Document linking
- **Status**: Most complete with types, mock data

### 6. **Dashboard & Analytics**
- **Files**: `Dashboard.tsx`, `Analytics.tsx`, `dashboard/ components/`
- **Features**:
  - KPI cards
  - Filter presets
  - Advanced filtering
  - Approval actions
  - Real-time notifications
- **Status**: Mock data, no API integration

### 7. **Documents Management**
- **Files**: `Documents.tsx`, `documents/ components/`
- **Features**:
  - File upload/download
  - Version control
  - Categorization
  - Search
- **Status**: Mock interface only

### 8. **Inventory & Procurement**
- **Files**: `Inventory.tsx`, `Procurement.tsx`, `inventory/ components/`
- **Features**:
  - Item tracking
  - Stock levels
  - Procurement requests
- **Status**: Mock data

### 9. **CRM & Communication**
- **Files**: `Chat.tsx`, `Email.tsx`, `CRM.tsx`
- **Features**:
  - Internal messaging
  - Email interface
  - Contact management
- **Status**: UI only, no backend

### 10. **Knowledge & Research**
- **Files**: `Knowledge.tsx`, `Research.tsx`
- **Features**:
  - Knowledge base articles
  - Research hub
- **Status**: UI only

### 11. **AI Features**
- **Files**: `AIAssistant.tsx`, `AIWritingAssistant.tsx`
- **Features**:
  - Grant proposal assistant
  - General AI chat
- **Status**: UI components, no API

### 12. **Admin & Settings**
- **Files**: `RBAC.tsx`, `Settings.tsx`, `admin/ components/`
- **Features**:
  - Role management
  - User administration
  - System settings
- **Status**: UI mock only

### 13. **Task & Approvals**
- **Files**: `Tasks.tsx`, `Approvals.tsx`, `approvals/ components/`
- **Features**:
  - Task management
  - Approval workflows
  - Status tracking
- **Status**: Mock data

### 14. **Feed & Notifications**
- **Files**: `Feed.tsx`, `NotificationContext.tsx`, `layout/ components/`
- **Features**:
  - Activity feed
  - Toast notifications
  - Bell notifications
- **Status**: Partially functional

---

## State Management

### Context API (3 providers)
1. **AuthContext**: User identity, login/logout, role labels
2. **NotificationContext**: Toast notifications + bell notifications
3. **AttendanceContext**: Check-in state management

### Local Component State
- Filter states (search, department, stage, date range)
- UI states (expandedId, showModal, selectedTab)
- Form states (user input, validation)

**Problem**: State management scattered across 25+ pages. No centralized state solution.

---

## Configuration Structure

### 1. **roles.ts**
- Role labels (8 roles)
- Role hierarchy/ordering
- Module access by role matrix
- `hasModuleAccess()` permission checker

### 2. **navigation.ts**
- 7 separate nav arrays (one per role type)
- Module definitions
- Icon mappings
- `getVisibleNavItems()` role filter function

### 3. **forms.ts**
- Field type definitions (text, number, date, select, etc.)
- Form field interface
- Form section interface
- FORMS_LIBRARY array

### 4. **geofence.ts**
- Office location coordinates (OFFICE_LAT, OFFICE_LNG)
- Geofence radius

---

## Types System

### Current State
**File**: `src/types/index.ts` (only 80 lines)
- InnovationStage (6 stages)
- InnovationMilestone
- InnovationActivityEntry
- InnovationDocument
- InnovationComment
- InnovationProject

### Missing Types
- User, Role, UserStatus
- Grant, GrantRecord, GrantStage
- Transaction, FinancialRecord
- Employee, Department
- Project, Task, Activity
- NavigationItem, FormField
- Generic container types

**Impact**: Types defined inline in components, no reusability, type safety gaps

---

## Data Layer

### Mock Data
- **grants.ts**: MOCK_GRANTS array (60+ grants with full details)
  - Includes: grant lifecycle, milestones, activities, documents
  - Helper functions: formatCurrency(), daysUntil(), grantProgress()
  - Export type: GrantRecord

### Inline Mock Data
- Finance transactions (Finance.tsx)
- Employee data (PeopleTab.tsx)
- Payroll data (PayslipsTab.tsx)
- Other feature-specific mock data

### No API Layer
- No API client (axios, fetch)
- No request/response types
- No error handling for API calls
- No caching strategy

---

## Component Organization

### Layout Components
```
layout/
├── AppShell.tsx          # Main layout wrapper
├── TopNavBar.tsx         # Header with user menu
├── SideNavBar.tsx        # Role-based navigation
├── NotificationBell.tsx  # Notification dropdown
├── EmailBell.tsx         # Email notifications
└── index.ts              # Exports
```

### Feature-Based Organization
Each major feature has dedicated directory:
- `grants/`: Grant application and management
- `finance/`: Budgeting and transactions
- `admin/`: HR, payroll, people management
- `innovation/`: Project tracking
- `documents/`: File management
- `inventory/`: Stock tracking
- `approvals/`: Workflow approvals
- `dashboard/`: Dashboard widgets
- `ui/`: Shared UI components (StatCard, StatusChip, etc)

### UI Components (Reusable)
- StatusChip: Color-coded status badges
- StatCard: KPI display cards
- ProgressBar: Progress visualization
- PageHeader: Page title/description
- AnnouncementBanner: Alert messages
- Toaster: Toast notification display
- FAB: Floating action button

---

## Build Configuration

### Vite Setup
- **vite.config.ts**: Vite bundler configuration
- Fast HMR (hot module reload)
- Production build optimization

### Tailwind CSS
- **tailwind.config.js**: Custom theme (AIMS colors)
- PostCSS preprocessing
- Utility-first styling

### TypeScript
- **tsconfig.json**: Strict mode enabled
- Path alias: `@/` → `src/`
- Target: ES2020

---

## Entry Points

1. **main.tsx**: Vite entry point
   - Renders React app to DOM
   
2. **App.tsx**: Root React component
   - React Router configuration
   - Provider wrapping (Auth, Notification, Attendance contexts)
   - Route definitions (25+ pages)
   - Role-based route protection

3. **index.html**: HTML template
   - Root `<div id="root">`
   - Script reference to main.tsx

---

## Current Issues & Gaps

### 1. **Type Safety**
- ❌ No centralized type definitions
- ❌ Types scattered across components
- ❌ Missing domain types (User, Grant, Transaction, etc)
- ✅ TypeScript strict mode enabled

### 2. **State Management**
- ❌ No centralized state solution
- ❌ Local useState in 25+ pages
- ❌ No cache invalidation strategy
- ✅ Context API for auth + notifications

### 3. **API Integration**
- ❌ No API client layer
- ❌ All mock data, no real endpoints
- ❌ No error handling
- ❌ No request/response validation

### 4. **Code Duplication**
- ❌ Color constants duplicated (CHIP, ACCENT, FILL)
- ❌ Utility functions re-implemented (formatDate, formatCurrency, distance calc)
- ❌ Filter/search logic duplicated
- ❌ Tab management pattern duplicated

### 5. **Component Architecture**
- ⚠️ Large components (Dashboard 250+ lines, InnovationDetail 250+ lines)
- ❌ No shared abstractions (DataTable, FilterBar, Card variants)
- ✅ Feature-based organization

### 6. **Testing**
- ❌ No unit tests
- ❌ No component tests
- ❌ No E2E tests
- ❌ No test setup (vitest, jest, etc)

### 7. **Performance**
- ⚠️ No code splitting
- ⚠️ No lazy loading of routes
- ⚠️ No memoization (React.memo, useMemo)
- ⚠️ No virtual lists for large datasets

### 8. **Documentation**
- ⚠️ Minimal README
- ❌ No component documentation
- ❌ No API documentation
- ❌ No deployment guide

---

## Development Workflow

### Available Scripts (from package.json)
```bash
npm run dev          # Start dev server (Vite)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Lint code
```

### Environment Setup
- Node.js + npm
- TypeScript compiler
- Vite dev server
- Tailwind CSS processor

---

## Deployment

### Current Setup
- **Netlify** configured (netlify.toml, .netlify/)
- Build output: `dist/`
- Deployment ready with CI/CD hooks

### Configuration Files
- `netlify.toml`: Netlify deployment config
- `.netlify/`: Netlify cache/state

---

## Summary: Current State

### ✅ Strengths
1. Feature-rich application (25+ pages, 14 domains)
2. Beautiful UI with Tailwind CSS
3. Role-based access control implemented
4. Mock data for all major features
5. Responsive design
6. Clean component organization by feature
7. TypeScript strict mode enabled

### ⚠️ Areas for Improvement
1. **Type System**: Needs consolidation and completion
2. **State Management**: Too scattered, needs centralization
3. **API Layer**: Missing entirely, needs creation
4. **Code Reuse**: Too much duplication, needs extraction
5. **Testing**: Zero coverage, needs implementation
6. **Performance**: No optimization, needs profiling & improvements
7. **Documentation**: Minimal, needs expansion

### 🎯 Next Steps
1. Consolidate types across codebase
2. Extract and organize utilities
3. Create reusable component library
4. Implement API client layer
5. Set up centralized state management
6. Add comprehensive testing
7. Optimize performance
8. Improve documentation

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18+ |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Build Tool** | Vite |
| **Routing** | React Router v6 |
| **State** | Context API + useState |
| **UI Library** | Material Symbols icons |
| **Deployment** | Netlify |

---

## File Counts by Directory

| Directory | Files | Purpose |
|-----------|-------|---------|
| `pages/` | 25 | Feature pages |
| `components/` | 40+ | React components across 14 domains |
| `config/` | 4 | Configuration files |
| `context/` | 3 | State management contexts |
| `types/` | 1 | Type definitions |
| `data/` | 1 | Mock data |
| `lib/` | 1 | Utilities |
| `assets/` | ? | Images, fonts, etc |

---

This document serves as a complete reference for the aims-app structure.
For questions about specific areas, refer to the appropriate section above.
