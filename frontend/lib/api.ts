import axios from 'axios';
import { signOut } from 'next-auth/react';
import { isMobileBuild } from './mobile-auth';
import { API_URL, getAuthToken, clearClientSession } from './session';

export const api = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } });
api.interceptors.request.use(async config => {
    const token = await getAuthToken();
    if (!token) throw new Error('Your session expired. Please sign in again.');
    config.headers.Authorization = `Bearer ${token}`;
    return config;
});
api.interceptors.response.use(response => response, async error => {
    const request = error.config;
    if (error.response?.status === 401 && request && !request._retry) {
        request._retry = true;
        const token = await getAuthToken(true);
        if (token) return api(request);
    }
    if (error.response?.status === 401) { clearClientSession(); if (!isMobileBuild()) await signOut({ redirect: false }); }
    return Promise.reject(error);
});
export default api;
