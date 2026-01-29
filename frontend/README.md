# Linkify Pro - Frontend

A simple, intermediate frontend for the URL shortener backend with analytics, user management, and QR code generation.

## 🚀 Features

### Authentication
- User registration and login
- Secure JWT token-based authentication
- Persistent login sessions
- Clean auth flow with error handling

### Dashboard
- Clean, responsive design with tabbed navigation
- Overview statistics (total URLs, clicks, recent activity)
- Quick action buttons for common tasks
- Professional UI with Tailwind CSS

### URL Management
- Create short URLs with custom slugs
- Support for different URL types (redirect, bio links)
- List all user URLs with click counts
- Delete URLs with confirmation
- Copy to clipboard functionality
- QR code access for each URL

### Analytics
- Click tracking and statistics
- Daily analytics overview
- Recent clicks with geo/device info
- Visual analytics dashboard
- Multiple URL selection for analytics

### User Experience
- Loading states and error handling
- Responsive design (mobile-friendly)
- Clean, modern interface
- Intuitive navigation

## 🛠️ Technology Stack

- **React 19.2.0** - Modern React with hooks
- **Vite** - Fast development server and build tool
- **Axios** - HTTP client for API requests
- **Tailwind CSS** - Utility-first CSS framework
- **Context API** - State management for authentication

## 📁 Project Structure

```
frontend/src/
├── App.jsx                     # Main app component
├── App.css                     # App-specific styles
├── index.css                   # Global styles
├── main.jsx                    # React entry point
├── contexts/
│   └── AuthContext.jsx         # Authentication context
└── components/
    ├── AuthForm.jsx           # Login/Register form
    ├── Dashboard.jsx          # Main dashboard
    ├── CreateUrlForm.jsx      # URL creation form
    ├── UrlManager.jsx         # URL management
    └── AnalyticsDashboard.jsx # Analytics display
```

## 🚦 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Backend server running on `http://localhost:5000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

## 🔧 Backend Configuration

The frontend expects the backend to be running on `http://localhost:5000`. Make sure your backend has the following endpoints available:

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/url/shorten` - Create short URL
- `GET /api/url/user-urls` - Get user's URLs
- `DELETE /api/url/:shortCode` - Delete URL
- `GET /api/url/analytics/:shortCode` - Get URL analytics
- `GET /api/url/qr/:shortCode` - Get QR code

## 📱 Usage Guide

### 1. Authentication
- First-time users can register with email and password
- Existing users can log in with their credentials
- Sessions are persisted in localStorage

### 2. Dashboard Overview
- View total URLs, clicks, and recent activity
- Quick access to all major features
- Responsive design works on all devices

### 3. Creating URLs
- Enter original URL (required)
- Optionally add custom slug
- Choose link type (redirect/bio link)
- Get instant feedback on creation success

### 4. Managing URLs
- View all created URLs in a clean list
- Click counts and creation dates
- Quick copy to clipboard
- Delete with confirmation dialog
- Access QR codes directly

### 5. Analytics
- Select any URL to view detailed analytics
- See total clicks and activity metrics
- View daily click patterns
- Check recent click details with geo/device info

## 🎨 Design Features

- **Clean Interface**: Minimal, professional design
- **Responsive**: Works perfectly on mobile and desktop
- **Loading States**: Visual feedback during API calls
- **Error Handling**: User-friendly error messages
- **Accessibility**: Proper form labels and keyboard navigation

## 🔒 Security Features

- JWT token authentication
- Secure token storage in localStorage
- Automatic token validation on app start
- Protected routes and API calls
- Session management

## 🚀 Future Enhancements

- Bulk URL operations
- Advanced analytics with charts
- Custom domain support
- URL expiration settings
- Password protection for URLs
- Link categories/tags
- Export analytics data
- Dark mode theme

## 📝 Notes

This frontend provides a simple but comprehensive interface for managing short URLs and viewing analytics. It's designed to be user-friendly while leveraging all the backend's capabilities without being overly complex.

The frontend is production-ready and can be easily customized or extended based on specific requirements.
