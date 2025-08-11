# Overview

This is a personal portfolio website for Rafaela de Oliveira Botelho, a Systems Developer. The application is built with Flask and serves as a showcase platform for her development projects and professional profile. The site features a modern, responsive design with project galleries, an about section, user authentication, and administrative capabilities for content management.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Template Engine**: Jinja2 templates with a base template inheritance structure
- **CSS Framework**: Bootstrap 5 for responsive design and component styling
- **JavaScript**: Vanilla JavaScript for interactive features and UI enhancements
- **Icons**: Font Awesome 6 for consistent iconography
- **Fonts**: Google Fonts (Poppins) for typography
- **Responsive Design**: Mobile-first approach with Bootstrap's grid system

## Backend Architecture
- **Framework**: Flask (Python web framework)
- **Database ORM**: SQLAlchemy with Flask-SQLAlchemy extension
- **Authentication**: Replit Auth integration using Flask-Dance OAuth
- **Session Management**: Flask sessions with permanent session configuration
- **File Handling**: Werkzeug utilities for secure file uploads
- **Middleware**: ProxyFix for proper URL generation with HTTPS

## Database Schema
- **Users Table**: Stores user authentication data (required for Replit Auth)
- **OAuth Table**: Manages OAuth tokens and browser sessions (required for Replit Auth)
- **Projects Table**: Contains project information, descriptions, and metadata
- **Categories Table**: Organizes projects into different categories
- **Additional Models**: Like, Comment, AboutPage, Notification, and ProjectMedia for extended functionality

## Authentication & Authorization
- **OAuth Provider**: Replit Auth using OAuth 2.0 flow
- **User Management**: Flask-Login for session management
- **Role-based Access**: Admin flag on users for administrative functions
- **Custom Storage**: UserSessionStorage class for managing OAuth tokens per browser session

## File Management
- **Upload Directory**: Static uploads folder for project media
- **File Validation**: Utility functions for allowed file types (images, videos, PDFs)
- **Size Limits**: 16MB maximum file upload size
- **Security**: Werkzeug's secure_filename for safe file handling

## Admin Panel
- **Dashboard**: Statistics and overview of portfolio content
- **Project Management**: CRUD operations for projects with media uploads
- **About Page Management**: Editable profile and content sections
- **Category Management**: Organization system for projects

# External Dependencies

## Authentication Service
- **Replit Auth**: OAuth 2.0 provider for user authentication
- **Flask-Dance**: OAuth integration library for Flask applications

## Database
- **PostgreSQL**: Primary database (configured via DATABASE_URL environment variable)
- **SQLAlchemy**: ORM with connection pooling and health checks

## Content Delivery
- **Bootstrap CDN**: CSS framework (version 5.3.0)
- **Font Awesome CDN**: Icon library (version 6.4.0)
- **Google Fonts**: Typography (Poppins font family)

## File Storage
- **Local File System**: Static file serving for uploaded project media
- **Werkzeug**: File upload handling and security utilities

## Development Tools
- **Flask Debug Mode**: Development server configuration
- **Logging**: Python logging module for application monitoring

## Environment Configuration
- **SESSION_SECRET**: Flask session encryption key
- **DATABASE_URL**: PostgreSQL connection string (Railway compatible)
- **UPLOAD_FOLDER**: File upload directory path
- **PORT**: Application port (Railway managed)

## Deployment Configuration
- **Railway Ready**: Procfile, railway.json, nixpacks.toml configured
- **Database Reset**: All tables cleared for fresh deployment
- **Health Check**: /health endpoint for Railway monitoring
- **Auto-Admin**: All authenticated users have admin access
- **PostgreSQL Compatibility**: URL rewriting for Railway PostgreSQL