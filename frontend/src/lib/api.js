import axios from 'axios';

const API_BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Create axios instance
const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth APIs
export const authApi = {
    login: (email, password) => api.post('/admin/auth/login', { email, password }),
    getMe: () => api.get('/admin/auth/me')
};

// Dashboard APIs
export const dashboardApi = {
    getStats: () => api.get('/admin/dashboard/stats'),
    getRecentActivity: () => api.get('/admin/dashboard/recent_activity')
};

// User APIs
export const userApi = {
    list: () => api.get('/admin/users'),
    get: (id) => api.get(`/admin/users/${id}`),
    create: (data) => api.post('/admin/users', data),
    update: (id, data) => api.put(`/admin/users/${id}`, data),
    delete: (id) => api.delete(`/admin/users/${id}`)
};

// Role APIs
export const roleApi = {
    list: () => api.get('/admin/roles'),
    get: (id) => api.get(`/admin/roles/${id}`),
    create: (data) => api.post('/admin/roles', data),
    update: (id, data) => api.put(`/admin/roles/${id}`, data),
    delete: (id) => api.delete(`/admin/roles/${id}`),
    getPermissions: () => api.get('/admin/roles/permissions')
};

// Category APIs
export const categoryApi = {
    list: () => api.get('/admin/categories'),
    get: (id) => api.get(`/admin/categories/${id}`),
    create: (data) => api.post('/admin/categories', data),
    update: (id, data) => api.put(`/admin/categories/${id}`, data),
    delete: (id) => api.delete(`/admin/categories/${id}`)
};

// Artifact APIs
export const artifactApi = {
    list: (params) => api.get('/admin/artifacts', { params }),
    get: (id) => api.get(`/admin/artifacts/${id}`),
    create: (data) => api.post('/admin/artifacts', data),
    update: (id, data) => api.put(`/admin/artifacts/${id}`, data),
    delete: (id) => api.delete(`/admin/artifacts/${id}`),
    publish: (id) => api.put(`/admin/artifacts/${id}/publish`)
};

// Gallery APIs
export const galleryApi = {
    list: () => api.get('/admin/galleries'),
    get: (id) => api.get(`/admin/galleries/${id}`),
    create: (data) => api.post('/admin/galleries', data),
    update: (id, data) => api.put(`/admin/galleries/${id}`, data),
    delete: (id) => api.delete(`/admin/galleries/${id}`)
};

// Timeline APIs
export const timelineApi = {
    list: () => api.get('/admin/timelines'),
    get: (id) => api.get(`/admin/timelines/${id}`),
    create: (data) => api.post('/admin/timelines', data),
    update: (id, data) => api.put(`/admin/timelines/${id}`, data),
    delete: (id) => api.delete(`/admin/timelines/${id}`),
    // Events
    listEvents: (timelineId) => api.get(`/admin/timelines/${timelineId}/events`),
    createEvent: (timelineId, data) => api.post(`/admin/timelines/${timelineId}/events`, data),
    updateEvent: (timelineId, eventId, data) => api.put(`/admin/timelines/${timelineId}/events/${eventId}`, data),
    deleteEvent: (timelineId, eventId) => api.delete(`/admin/timelines/${timelineId}/events/${eventId}`)
};

// Media APIs
export const mediaApi = {
    list: (params) => api.get('/admin/media', { params }),
    get: (id) => api.get(`/admin/media/${id}`),
    upload: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/admin/media', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    delete: (id) => api.delete(`/admin/media/${id}`)
};

// Frontend Section APIs
export const sectionApi = {
    list: () => api.get('/admin/frontend-sections'),
    get: (id) => api.get(`/admin/frontend-sections/${id}`),
    create: (data) => api.post('/admin/frontend-sections', data),
    update: (id, data) => api.put(`/admin/frontend-sections/${id}`, data),
    delete: (id) => api.delete(`/admin/frontend-sections/${id}`),
    reorder: (orders) => api.put('/admin/frontend-sections/reorder', orders)
};

// Seed API
export const seedDatabase = () => api.post('/seed');

export default api;
