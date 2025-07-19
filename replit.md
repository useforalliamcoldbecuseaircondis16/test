# Website Embedder & Download Automator

## Overview

This is a full-stack web application that allows users to embed external websites in a controlled environment and automate download operations with CORS handling. The application serves as a proxy for external content and provides automation capabilities for web interactions. Users can configure custom HTTP headers, write custom JavaScript automation scripts, and control when scripts execute.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Shadcn/UI components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: PostgreSQL-based session storage
- **CORS Handling**: Configurable CORS middleware for cross-origin requests

### Development Setup
- **Development Server**: Vite dev server with HMR (Hot Module Replacement)
- **Build Process**: Vite for frontend, esbuild for backend bundling
- **Type Checking**: Shared TypeScript configuration across client/server/shared

## Key Components

### 1. Proxy Service
- **Purpose**: Safely embed external websites by proxying their content
- **Implementation**: Express route `/api/proxy` that fetches external content
- **Features**: 
  - Automatic CORS header injection
  - Smart Content-Disposition headers (only applied to sub-URLs for file downloads, not base website)
  - Custom HTTP headers from user configuration
  - User-Agent spoofing for compatibility
  - Script injection capabilities for automation

### 2. Automation System
- **Purpose**: Execute predefined and custom scripts on embedded websites
- **Implementation**: Message-passing between parent window and iframe
- **Capabilities**:
  - Download Script: Automatically sets download attributes and triggers file downloads (auto-executes on page load)
  - Custom Script: User-defined JavaScript code executed in embedded page context
  - Auto-execution on page load (always for download script, configurable for custom script)
  - Manual execution via control buttons
  - Batch execution of all scripts

### 3. Configuration Management
- **Storage**: Database-backed configuration with in-memory fallback
- **Settings**:
  - Target URL for embedding (user-configurable from UI)
  - CORS enable/disable toggle
  - Auto-execution preferences for custom scripts
  - Custom HTTP headers (add/remove from UI)
  - Custom JavaScript automation code

### 4. Logging System
- **Purpose**: Track system events and user actions
- **Features**:
  - Real-time log display with auto-refresh
  - Log level categorization (info, success, warning, error)
  - Persistent storage with clear functionality

## Data Flow

1. **Website Embedding**:
   - User configures target URL in control sidebar
   - Application fetches content via proxy endpoint
   - Content is displayed in iframe with injected automation capabilities

2. **Automation Execution**:
   - User triggers scripts from control panel
   - Parent window sends messages to iframe
   - Iframe executes scripts and reports back success/failure
   - Actions are logged to the system

3. **Configuration Updates**:
   - Changes made in UI are immediately sent to backend
   - Database is updated with new configuration
   - UI reflects changes through React Query cache invalidation

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **@tanstack/react-query**: Server state management
- **drizzle-orm**: Type-safe database ORM
- **axios**: HTTP client for external requests
- **express**: Web server framework
- **cors**: CORS middleware

### UI Dependencies
- **@radix-ui/***: Headless UI components (30+ packages)
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **clsx**: Conditional className utility

### Development Dependencies
- **vite**: Frontend build tool
- **tsx**: TypeScript execution for development
- **esbuild**: Backend bundling

## Deployment Strategy

### Build Process
1. **Frontend**: Vite builds React app to `dist/public`
2. **Backend**: esbuild bundles Express server to `dist/index.js`
3. **Database**: Drizzle migrations applied to PostgreSQL

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required)
- `NODE_ENV`: Environment mode (development/production)

### Production Considerations
- Static asset serving from Express in production
- PostgreSQL session storage for scalability
- Environment-specific configuration loading
- Error handling middleware for graceful failures

### Development Features
- **Replit Integration**: Special handling for Replit environment
- **Hot Reload**: Vite HMR for instant development feedback
- **Development Banner**: Automatic Replit development banner injection
- **Error Overlay**: Runtime error modal for development debugging

The application is designed to be easily deployable on platforms like Replit while maintaining production-ready architecture with proper separation of concerns, type safety, and scalable data management.