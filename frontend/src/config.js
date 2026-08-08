// Centralized API Base URL configuration for Vercel deployment
const getApiBase = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    let url = import.meta.env.VITE_API_BASE_URL.trim();
    // Remove trailing slash if present
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }
    return url;
  }
  return ''; // fallback to relative path for local dev proxy or vercel.json rewrites
};

export const API_BASE_URL = getApiBase();
