import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const authToken = localStorage.getItem('token');
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (newUserData) => api.post('/auth/register', newUserData),
  login: (loginCredentials) => api.post('/auth/login', loginCredentials),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
};

export const eventsAPI = {
  getAll: (searchParams = {}) => api.get('/events', { params: searchParams }),
  getById: (eventId) => api.get(`/events/${eventId}`),
  create: (eventData) => api.post('/events', eventData),
  update: (eventId, eventData) => api.put(`/events/${eventId}`, eventData),
  delete: (eventId) => api.delete(`/events/${eventId}`),
  getMyEvents: (searchParams = {}) => api.get('/events/my-events', { params: searchParams }),
};

export const registrationsAPI = {
  getAll: (searchParams = {}) => api.get('/registrations', { params: searchParams }),
  create: (eventId) => api.post('/registrations', { event_id: eventId }),
  cancel: (registrationId) => api.delete(`/registrations/${registrationId}`),
  getManage: (searchParams = {}) => api.get('/registrations/manage', { params: searchParams }),
  updateStatus: (registrationId, newStatus) => api.put(`/registrations/${registrationId}/status`, { status: newStatus }),
  bulkUpdateStatus: (registrationIds, newStatus) => 
    api.put('/registrations/bulk-status', { registration_ids: registrationIds, status: newStatus }),
};

export default api;
