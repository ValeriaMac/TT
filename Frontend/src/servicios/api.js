import axios from 'axios';

// En desarrollo usa el backend local; en producción se define la variable
// VITE_API_URL (por ejemplo https://mi-backend.onrender.com/api) al
// construir el frontend. Ver DESPLIEGUE.md.
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

// Antes de cada petición, si hay un token guardado, lo manda automáticamente
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
