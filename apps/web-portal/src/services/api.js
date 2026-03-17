import axios from 'axios';
import { getToken } from './authService';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
  withCredentials: true,
});

// Interceptor AUTOMÁTICO - adiciona JWT
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const documentTemplatesApi = {
  list: () => api.get('/document-templates'),
  get: (doctype) => api.get(`/document-templates/${doctype}`),
  save: (doctype, contentHtml) => api.post(`/document-templates/${doctype}`, { contentHtml }),
  preview: (doctype, contentHtml) =>
    api.post(`/document-templates/${doctype}/preview`, { contentHtml }),
  restore: (doctype) => api.post(`/document-templates/${doctype}/restore-default`),
};

export default api;
