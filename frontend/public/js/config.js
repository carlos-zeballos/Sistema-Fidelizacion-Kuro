// API Configuration
// In production, set this to your Railway backend URL
// In development, leave empty to use relative paths (localhost)
export const API_BASE_URL = window.API_BASE_URL || '';

// Helper function for making API calls
export function apiUrl(path) {
  // Remove leading slash if present, then add it back
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  return API_BASE_URL + cleanPath;
}

// For production deployment on Hostinger:
// Add this script tag before other scripts:
// <script>window.API_BASE_URL = 'https://tu-backend.railway.app';</script>
