# Permit Management System

## Overview

This is a comprehensive building permit package management system built with TypeScript, Express.js, and React. The system tracks assembly progress, manages required documents, and stores packages until submission. It supports both local SQLite authentication for private deployments and enterprise authentication via Auth0/OIDC for production environments.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack React Query for server state
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite with hot module replacement

### Backend Architecture
- **Runtime**: Bun (primary) with Node.js fallback support
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with dual schema support
- **Session Management**: Express-session with configurable stores
- **File Uploads**: Multer with local file storage
- **Authentication**: Multiple strategies (local, Auth0, OIDC)

### Database Design
The system uses a dual-schema approach to support both PostgreSQL and SQLite:
- **Production/Server**: PostgreSQL with full relational features
- **Development/Private**: SQLite for simplicity and portability

Core entities:
- Users (authentication, roles, approval workflow)
- Permit Packages (project tracking, status management)
- Package Documents (file attachments, document checklists)
- Settings (system configuration, customizable options)
- Sessions (authentication state persistence)

## Key Components

### Authentication System
The system implements a flexible authentication architecture:

**Local Authentication (SQLite)**
- Simple username/password authentication
- Bcrypt password hashing
- Memory-based session storage
- Ideal for private/offline deployments

**Enterprise Authentication (Auth0/OIDC)**
- OpenID Connect compliant
- Single Sign-On capabilities
- Social login providers
- PostgreSQL session persistence

**Configuration Management**
- Environment-based authentication switching
- Automatic fallback mechanisms
- Domain-based access control

### Storage Layer
Abstract storage interface (`IStorage`) with multiple implementations:
- **DatabaseStorage**: Full-featured PostgreSQL implementation
- **SimpleSQLiteStorage**: Lightweight SQLite implementation
- Automatic storage type detection based on database URL

### File Management
- Secure file upload handling with Multer
- Configurable file size limits (default: 10MB)
- Supported file types: PDF, DOC, DOCX, XLS, XLSX, images
- Organized upload directory structure

### Permission System
Role-based access control:
- **Admin**: Full system access, user management
- **User**: Package creation, document management
- Approval workflow for new user registration

## Data Flow

### Authentication Flow
1. User submits credentials via login form
2. System validates against configured authentication method
3. Session created and stored (memory or PostgreSQL)
4. User redirected to dashboard with session cookie

### Package Management Flow
1. User creates new permit package with project details
2. System generates document checklist based on permit type
3. User uploads required documents
4. Package status tracks progress (draft → in-progress → review → submitted)
5. Admin users can review and approve packages

### File Upload Flow
1. Client initiates file upload via multipart form
2. Multer middleware processes and stores file
3. Database record created linking file to package
4. File metadata stored for tracking and validation

## External Dependencies

### Runtime Dependencies
- **Bun**: Primary runtime for improved performance
- **Node.js**: Fallback runtime support
- **Express.js**: Web application framework
- **Drizzle ORM**: Type-safe database queries

### Database Dependencies
- **PostgreSQL 12+**: Full-featured production database
- **SQLite 3**: Embedded database for development
- **better-sqlite3**: High-performance SQLite driver

### Authentication Dependencies
- **Passport.js**: Authentication middleware
- **OpenID Client**: OIDC/OAuth2 support
- **bcrypt**: Password hashing
- **express-session**: Session management

### Development Dependencies
- **TypeScript**: Type safety and development experience
- **Vite**: Build tool and development server
- **ESBuild**: Fast bundling for production

## Deployment Strategy

### Development Mode
- SQLite database with file-based storage
- Memory-based session storage
- Local authentication
- Hot module replacement for development

### Production Deployment Options

**Option 1: Private Computer Deployment**
- SQLite database for simplicity
- Local authentication
- Apache2 reverse proxy (optional)
- Suitable for small teams or personal use

**Option 2: Server Deployment**
- PostgreSQL database for scalability
- Auth0/OIDC authentication
- PM2 process management
- Nginx/Apache reverse proxy with SSL

**Docker Deployment**
- Multi-stage build with Bun runtime
- Alpine Linux base for minimal size
- PostgreSQL service container
- Health check endpoints

### Build Process
1. TypeScript compilation for type checking
2. Vite builds optimized client bundle
3. ESBuild creates server bundle
4. Static assets copied to distribution folder

## Changelog
- June 24, 2025: Production deployment fully working - fixed database schema issues and server startup
- June 24, 2025: Production deployment working - server starts on port 3001 with SQLite authentication
- June 23, 2025: Initial setup and development environment configured

## User Preferences

Preferred communication style: Simple, everyday language.