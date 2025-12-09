# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Social Memo (社交关系备忘录系统) is a personal relationship management application for tracking contacts, interactions, gifts, loans, and social activities. It's a full-stack TypeScript application with a React frontend and Express backend.

## Development Commands

### Backend (from `social-memo/backend/`)
```bash
npm run dev          # Start development server with ts-node
npm run build        # Compile TypeScript to dist/
npm start            # Run production build
npm run migrate      # Run database migrations
```

### Frontend (from `social-memo/frontend/`)
```bash
npm run dev          # Start Vite dev server on port 13579
npm run build        # TypeScript check + Vite production build
npm run preview      # Preview production build on port 13579
```

## Architecture

### Backend (`social-memo/backend/`)
- **Framework**: Express.js with TypeScript
- **Database**: SQLite via sql.js (in-memory with file persistence at `data/social_memo.db`)
- **Authentication**: Token-based auth with bcryptjs password hashing
- **Security**: Helmet, CORS, rate limiting (1000 req/15min global, 5 login attempts/15min)

Key directories:
- `src/server.ts` - Application entry point
- `src/routes/api.ts` - All API route definitions
- `src/services/` - Business logic (contactService, authService, groupService, giftService, etc.)
- `src/config/database.ts` - SQLite initialization and schema definitions

### Frontend (`social-memo/frontend/`)
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Library**: Ant Design 5
- **State**: Local component state with custom hooks

Key directories:
- `src/App.tsx` - Main layout with sidebar navigation and authentication
- `src/components/` - Feature components (ContactList, Dashboard, GiftManager, etc.)
- `src/services/api.ts` - Axios-based API client with auth interceptors
- `src/hooks/` - Custom React hooks (useContacts)
- `src/types/` - TypeScript interfaces

### API Design
- All endpoints under `/api/` prefix
- RESTful patterns: `/contacts`, `/contacts/:id`, `/contacts/:id/details`
- Auth endpoints: `/api/auth/login`, `/api/auth/logout`, `/api/auth/check`
- Protected by authentication middleware (except auth endpoints)

### Database Schema
Main tables: `contacts`, `contact_details`, `social_interactions`, `important_dates`, `contact_groups`, `activities`, `gifts`, `loans`, `reminders`, `message_templates`, `holidays`, `operation_logs`

## Key Features
- Contact CRUD with soft delete (recycle bin)
- Relationship graph visualization
- Gift/loan tracking with statistics
- Periodic contact reminders
- Message templates for holiday greetings
- Excel/vCard import/export
- Custom fields per contact
- Operation logging

## Default Credentials
Default login: `admin` / `admin123` (change password after first login)

## Notes
- Frontend proxies API requests to backend in development
- Database auto-creates on first startup with default holidays and message templates
- File uploads stored in `backend/uploads/` subdirectories
