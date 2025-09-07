# Agro User Frontend

A React-based frontend for the Agro Document Management System user portal.

## Features

- **User Authentication**: Login with Telegram ID and password
- **Document Management**: Upload, view, edit, and delete reports
- **Search & Filtering**: Advanced search and filtering capabilities
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Real-time Updates**: Live updates for document operations

## Tech Stack

- React 18
- React Router DOM
- Tailwind CSS
- Axios for API calls
- React Hot Toast for notifications
- Lucide React for icons

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api/v1
   REACT_APP_ENV=development
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/          # React components
│   ├── Login.js        # Login page
│   ├── Dashboard.js    # Main dashboard
│   ├── Header.js       # Navigation header
│   ├── ReportsTable.js # Reports table
│   ├── SearchAndFilters.js # Search and filter components
│   ├── UploadModal.js  # Upload modal
│   └── EditModal.js    # Edit modal
├── contexts/           # React contexts
│   ├── AuthContext.js  # Authentication context
│   └── DocumentContext.js # Document management context
├── services/           # API services
│   └── api.js         # Axios configuration and API calls
├── App.js             # Main app component
├── index.js           # Entry point
└── index.css          # Global styles with Tailwind
```

## API Integration

The frontend communicates with the backend API through the following endpoints:

- `POST /users/login` - User authentication
- `GET /documents/user/filter` - Get user's documents with filters
- `POST /documents` - Upload new document
- `PUT /documents/:id` - Update document
- `DELETE /documents/:id` - Delete document
- `GET /documents/:id/download` - Download document

## Features Overview

### Authentication
- Secure login with Telegram ID and password
- JWT token-based authentication
- Automatic token refresh
- Protected routes

### Document Management
- Upload new reports with file validation
- View all user's reports in a table format
- Edit report names
- Replace report files
- Send delete requests to admin
- Download reports

### Search & Filtering
- Search by report title
- Filter by year, month, date range
- Filter by group
- Pagination support
- Real-time search results

### User Interface
- Clean, modern design with Tailwind CSS
- Responsive layout for all screen sizes
- Intuitive navigation
- Loading states and error handling
- Toast notifications for user feedback

## Development

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App

### Code Style

- ESLint configuration included
- Prettier recommended for code formatting
- Component-based architecture
- Custom hooks for state management

## Deployment

1. Build the production version:
   ```bash
   npm run build
   ```

2. Deploy the `build` folder to your hosting service

3. Update the `REACT_APP_API_URL` environment variable to point to your production API

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
