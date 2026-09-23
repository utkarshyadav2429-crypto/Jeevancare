# Project Structure — JeevanCare v1.0.0

```
jeevancare/
├── index.html                 # Single page application HTML entry point
├── package.json               # Dependencies, scripts, and build configuration
├── server.ts                  # Express full-stack server & Vite middleware proxy
├── tsconfig.json              # TypeScript compiler configuration
├── vite.config.ts             # Vite bundler, chunking, and Tailwind plugins
├── metadata.json              # Applet metadata, capabilities, and permissions
│
├── docs/                      # Complete platform documentation
│   ├── ARCHITECTURE.md        # System & frontend/backend architecture
│   ├── DATABASE.md            # Table schemas, foreign keys, and ownership
│   ├── SECURITY.md            # Auth, isolation, and security policies
│   ├── DEPLOYMENT.md          # Cloud Run deployment and build instructions
│   ├── ENVIRONMENT.md         # Environment variables reference
│   ├── API.md                 # Express backend endpoints reference
│   ├── PATIENT_GUIDE.md       # End-user patient manual
│   ├── DOCTOR_GUIDE.md        # Doctor & clinician workspace guide
│   ├── ADMIN_GUIDE.md         # Administrator audit panel guide
│   ├── TROUBLESHOOTING.md     # Diagnostic and recovery manual
│   ├── DATA_FLOW.md           # Pipeline and data lifecycle diagrams
│   ├── QA.md                  # Quality assurance test results summary
│   ├── PRODUCTION_READINESS.md# Scorecard and readiness declaration
│   ├── LIMITATIONS.md         # Clinical disclaimers and technical boundaries
│   └── RELEASE_CHECKLIST.md   # v1.0 release sign-off checklist
│
├── src/
│   ├── main.tsx               # React application DOM entry point
│   ├── App.tsx                # Root component, routing, and lazy-loading
│   ├── index.css              # Tailwind CSS global styles and design variables
│   ├── types.ts               # Shared TypeScript interfaces and domain models
│   │
│   ├── components/            # UI components and view modules
│   │   ├── Header.tsx         # Universal top navigation & profile menu
│   │   ├── AuraiHero.tsx      # Landing hero with video lifecycle guards
│   │   ├── dashboard/         # Patient dashboard & health vitals cards
│   │   ├── scanner/           # Prescription OCR camera & entity editor
│   │   ├── vault/             # Medical vault document management & PDF
│   │   ├── assistant/         # AI Health Assistant & voice interaction
│   │   ├── appointments/      # Consultation scheduling & doctor booking
│   │   ├── doctorportal/      # Doctor workspace, notes, & patient lists
│   │   ├── admin/             # Admin audit panel & system health metrics
│   │   ├── map/               # Nearby healthcare and pharmacy map
│   │   ├── profile/           # ABHA card linking & user profile center
│   │   ├── blood/             # Blood donation network & donor registry
│   │   ├── emergency/         # Emergency SOS quick-dial and hospital hub
│   │   ├── affordability/     # Generic medicine cost-saving calculator
│   │   └── accessibility/     # Accessibility settings & low-literacy modes
│   │
│   ├── context/
│   │   └── AuthContext.tsx    # Supabase authentication & active role context
│   │
│   ├── services/
│   │   ├── supabaseService.ts # Supabase database & storage CRUD operations
│   │   ├── healthAssistantService.ts # Conversational AI proxy service
│   │   └── voiceAssistantService.ts  # Web Speech API synthesis & recognition
│   │
│   └── data/
│       └── initialData.ts     # Sandboxed demo fixtures for Demo Mode
```
