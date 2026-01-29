import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5001/api', // Or just '/api' if proxy is set up, but let's be explicit for now or use relative if proxy. Ideally relative with proxy.
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for adding the bearer token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling 401 errors (optional: auto-logout)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        // If syntax error or 401 unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            // Here we could implement refresh token logic if the backend supports it.
            // For now, we'll just redirect to login or clear token if it's invalid
            localStorage.removeItem('accessToken');
            window.location.href = '/'; // Redirect to login
        }
        return Promise.reject(error);
    }
);

export default api;
