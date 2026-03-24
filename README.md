# PeerAxis

A full-stack JavaScript application with a React frontend and Node.js/Express backend. PeerAxis is a collaborative peer-to-peer platform built with modern web technologies.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [Features](#features)
- [Architecture](#architecture)
- [Contributing](#contributing)

## Overview

PeerAxis is a peer-to-peer collaboration platform designed to facilitate real-time communication and data sharing between users. The application leverages Socket.IO for real-time updates and PostgreSQL for data persistence.

## Tech Stack

### Frontend
- **React** 19.0.0 - UI library
- **React Router DOM** 7.5.1 - Client-side routing
- **Tailwind CSS** 3.4.17 - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Animation library
- **Socket.IO Client** 4.8.3 - Real-time communication
- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **React Big Calendar** - Calendar component

### Backend
- **Node.js/Express** 5.2.1 - Web server framework
- **PostgreSQL** 8.16.3 - Relational database
- **Socket.IO** 4.8.3 - Real-time communication
- **JWT** (jsonwebtoken 9.0.3) - Authentication
- **bcrypt** 6.0.0 - Password hashing
- **CORS** 2.8.5 - Cross-origin resource sharing
- **UUID** 13.0.0 - Unique identifier generation

## Project Structure

```
PeerAxis/
├── frontend/              # React application
│   ├── src/              # Source files
│   ├── public/           # Static assets
│   ├── package.json      # Frontend dependencies
│   ├── tailwind.config.js
│   ├── craco.config.js
│   └── components.json   # Radix UI component config
├── backend/              # Node.js/Express server
│   ├── server.js         # Main entry point
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── db/               # Database configuration
│   ├── scripts/          # Utility scripts
│   └── package.json      # Backend dependencies
└── tests/                # Test suite
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL database

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mathewmathew-05/PeerAxis.git
   cd PeerAxis
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

**Backend:**
```bash
cd backend
node server.js
# Server runs on http://localhost:5000 (or configured port)
```

**Frontend:**
```bash
cd frontend
npm start
# Application opens at http://localhost:3000
```

## Features

- **Real-time Communication** - Socket.IO integration for live updates
- **User Authentication** - JWT-based authentication with bcrypt password hashing
- **Responsive Design** - Mobile-friendly UI with Tailwind CSS
- **Form Validation** - Client-side validation with Zod and React Hook Form
- **Data Visualization** - Charts and calendar integration with Recharts and React Big Calendar
- **Accessible Components** - Built with Radix UI primitive components
- **Animations** - Smooth transitions with Framer Motion
- **Database Integration** - PostgreSQL for persistent data storage

## Architecture

PeerAxis follows a client-server architecture:

- **Frontend**: Single-page application (SPA) built with React
- **Backend**: RESTful API with real-time WebSocket support via Socket.IO
- **Database**: PostgreSQL for data persistence
- **Communication**: HTTP for REST endpoints, WebSocket for real-time updates

## Development

### Available Scripts

**Frontend:**
```bash
npm start     # Start development server
npm build     # Build for production
npm test      # Run tests
```

**Backend:**
```bash
node server.js     # Start the server
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the LICENSE file for details.

---

For more information or questions, feel free to open an issue on the [GitHub repository](https://github.com/mathewmathew-05/PeerAxis).
