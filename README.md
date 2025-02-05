# Point of Sale System

A comprehensive point of sale system with barcode scanning, real-time analytics, and AI-powered insights.

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Backend Architecture](#backend-architecture)
- [Frontend Architecture](#frontend-architecture)
- [User Flow](#user-flow)
- [Onboarding Process](#onboarding-process)
- [Features](#features)
- [Setup & Installation](#setup--installation)
- [Flow Charts](#flow-charts)

## Architecture Overview

### Backend Architecture
```
backend/
├── src/
│   ├── controllers/     # Business logic
│   ├── middleware/      # Auth, validation, error handling
│   ├── models/          # Database models
│   ├── routes/          # API endpoints
│   ├── services/        # External services (OpenAI, etc.)
│   ├── utils/          # Helper functions
│   ├── database/       # Database configuration
│   └── app.js          # Main application file
```

Key Components:
- **Database**: PostgreSQL for relational data storage
- **Authentication**: JWT-based authentication
- **API**: RESTful API endpoints
- **Services**: Integration with OpenAI for analytics insights
- **Middleware**: Request validation, authentication, error handling

### Frontend Architecture
```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Main application pages
│   ├── context/       # React context providers
│   ├── hooks/         # Custom React hooks
│   ├── services/      # API services
│   ├── store/         # Redux store configuration
│   ├── utils/         # Helper functions
│   └── App.jsx        # Main application component
```

Key Components:
- **State Management**: Redux with Redux Toolkit
- **Routing**: React Router v6
- **UI Framework**: Tailwind CSS
- **API Integration**: Axios for HTTP requests
- **Barcode Scanning**: React Barcode Reader
- **PDF Generation**: React-PDF

## User Flow

### 1. Authentication Process
1. User visits the login page
2. Enters credentials (email/password)
3. Backend validates credentials and issues JWT
4. Frontend stores token in local storage
5. User is redirected to dashboard

### 2. Dashboard Overview
- Real-time inventory statistics
- Recent activities
- Quick access to main features
- Analytics overview

### 3. Product Management
1. **Adding Products**
   - Manual entry with form
   - Bulk import via CSV
   - Barcode generation for new products

2. **Scanning Process**
   - Access scanner via mobile device
   - Scan product barcode
   - View product details
   - Update quantity/status
   - Record transaction

3. **Inventory Updates**
   - Real-time stock updates
   - Low stock alerts
   - Transaction history
   - Stock adjustment records

### 4. Analytics & Reporting
1. **Data Analysis**
   - Sales trends
   - Product performance
   - Stock movement patterns
   - AI-powered insights

2. **Report Generation**
   - Custom date range reports
   - PDF export functionality
   - Detailed analytics
   - Custom data visualization

## Onboarding Process

### 1. Initial Setup
1. **Account Creation**
   - Business name
   - Admin user details
   - Contact information
   - Business category

2. **Business Profile**
   - Operating hours
   - Location details
   - Currency preferences
   - Tax settings

### 2. Product Setup
1. **Category Creation**
   - Define product categories
   - Set category attributes
   - Configure stock levels

2. **Initial Inventory**
   - Manual product entry
   - Bulk import option
   - QR code generation
   - Stock count entry

### 3. User Management
1. **Staff Accounts**
   - Create user accounts
   - Assign roles
   - Set permissions
   - Training access

2. **Role Configuration**
   - Admin roles
   - Staff roles
   - Scanner roles
   - View-only roles

## Features

### Core Features
- Barcode Scanning
- Real-time Inventory Tracking
- Multi-user Support
- Role-based Access Control
- Transaction History
- Stock Alerts
- Analytics Dashboard
- AI-powered Insights
- PDF Report Generation
- CSV Import/Export
- Mobile Responsive Design

### Security Features
- JWT Authentication
- Password Encryption
- Session Management
- API Rate Limiting
- Input Validation
- XSS Protection
- CORS Configuration

## Setup & Installation

### Prerequisites
- Node.js (v14+)
- PostgreSQL
- npm or yarn
- OpenAI API key

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure environment variables
npm run migrate
npm run start
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Configure environment variables
npm run dev
```

### Environment Variables
```env
# Backend
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key

# Frontend
VITE_API_URL=http://localhost:3000
VITE_OPENAI_API_KEY=your_openai_api_key
```

## License
[License information]

## Flow Charts

### User Authentication & Navigation Flow
```mermaid
flowchart TD
    A[User Visits Site] --> B{Has Account?}
    B -->|No| C[Sign Up]
    B -->|Yes| D[Login]
    
    C --> E[Fill Registration Form]
    E --> F[Email Verification]
    F --> D
    
    D --> G[Dashboard]
    
    G --> H[Products]
    G --> I[Scanner]
    G --> J[Analytics]
    G --> K[Settings]
    
    H --> L[Add Product]
    H --> M[View Inventory]
    H --> N[Categories]
    
    I --> O[Scan QR]
    O --> P{Product Found?}
    P -->|Yes| Q[Update Quantity]
    P -->|No| R[Error Message]
    Q --> S[Transaction Record]
    
    J --> T[View Reports]
    J --> U[Export PDF]
    J --> V[AI Insights]
```

### Onboarding Process Flow
```mermaid
flowchart TD
    A[Start Onboarding] --> B[Business Setup]
    
    B --> C[Basic Info]
    C --> D[Contact Details]
    D --> E[Business Category]
    
    E --> F[User Setup]
    F --> G[Admin Account]
    G --> H[Staff Accounts]
    
    H --> I[Product Setup]
    I --> J[Create Categories]
    J --> K[Add Products]
    
    K --> L{Import Method}
    L -->|Manual| M[Single Product Entry]
    L -->|Bulk| N[CSV Import]
    
    M --> O[Generate Barcode]
    N --> O
    
    O --> P[Initial Stock Count]
    P --> Q[Setup Complete]
    
    Q --> R[Dashboard Access]
```

### Transaction Flow
```mermaid
flowchart TD
    A[Start Transaction] --> B[Open Scanner]
    B --> C[Scan Barcode]
    
    C --> D{Valid Code?}
    D -->|No| E[Error Message]
    E --> B
    
    D -->|Yes| F[Product Details]
    F --> G[Enter Quantity]
    G --> H[Confirm Transaction]
    
    H --> I[Update Inventory]
    I --> J[Generate Receipt]
    J --> K[Transaction Complete]
    
    K --> L[Update Analytics]
    L --> M[Check Stock Levels]
    M --> N{Below Threshold?}
    N -->|Yes| O[Send Alert]
```

### Analytics Generation Flow
```mermaid
flowchart TD
    A[Access Analytics] --> B{Select Data Type}
    
    B -->|Custom| C[Upload Data]
    B -->|Range| D[Select Period]
    
    C --> E[Validate Data]
    D --> F[Fetch Data]
    
    E --> G[Process Data]
    F --> G
    
    G --> H[Generate Charts]
    G --> I[Calculate Metrics]
    
    H --> J[Display Dashboard]
    I --> J
    
    J --> K[Generate AI Insights]
    K --> L[Display Insights]
    
    L --> M{Export?}
    M -->|Yes| N[Generate PDF]
    M -->|No| O[View Only]
    
    N --> P[Download Report]
```

