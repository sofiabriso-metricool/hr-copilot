import axios from 'axios';

// Detect if we're on localhost or network
const getBaseURL = () => {
    const envURL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
    if (envURL) {
        console.log('📡 Using API URL from Env:', envURL);
        return envURL;
    }

    const hostname = window.location.hostname;
    // If we are on Vercel but missing the env var, we try to guess if the user is using a standard setup
    if (hostname.includes('vercel.app')) {
        console.warn('⚠️ On Vercel but VITE_API_URL is missing. Defaulting to localhost (likely will fail).');
    }

    if (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.includes('vercel.app')) {
        return `http://${hostname}:5000/api`;
    }
    return 'http://localhost:5000/api';
};

const api = axios.create({
    baseURL: getBaseURL(),
});

// Add a request interceptor to include the JWT in headers
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['x-auth-token'] = token;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
