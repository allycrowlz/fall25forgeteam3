// Automatically detect backend URL based on current hostname
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return `http://${hostname}:8000`;
  }
  return 'http://127.0.0.1:8000';
};
const API_BASE_URL = getApiBaseUrl();