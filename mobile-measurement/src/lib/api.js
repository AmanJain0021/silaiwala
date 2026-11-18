/*
 * Single API client. Port of frontend/src/utils/api.js plus mobile rules:
 * request timeout, FormData handling for React Native, session-expiry (401) handling.
 */
import axios from 'axios';
import { API_URL, REQUEST_TIMEOUT_MS } from './config';
import { getToken } from './auth';
import events from './events';

const api = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT_MS,
});

// Previous identical in-flight GET is cancelled (same behaviour as the web client)
const activeRequests = new Map();

const getRequestKey = (config) => {
  if (!config) return '';
  let paramsCopy = null;
  if (config.params) {
    const { _t, ...rest } = config.params;
    if (Object.keys(rest).length > 0) paramsCopy = rest;
  }
  const paramsStr = paramsCopy ? JSON.stringify(paramsCopy) : '';
  const method = config.method ? config.method.toLowerCase() : 'get';
  return `${method}:${config.url}:${paramsStr}`;
};

const clearActiveRequest = (config) => {
  if (config && config.method?.toLowerCase() === 'get') {
    const requestKey = getRequestKey(config);
    if (activeRequests.get(requestKey) === config._controller) activeRequests.delete(requestKey);
  }
};

api.interceptors.request.use((config) => {
  if (config.method?.toLowerCase() === 'get') {
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    config.headers.Pragma = 'no-cache';
    config.params = { ...config.params, _t: Date.now() };

    if (!config.signal && !config.noDedupe) {
      const requestKey = getRequestKey(config);
      if (activeRequests.has(requestKey)) activeRequests.get(requestKey).abort('Cancelled by a new request');
      const controller = new AbortController();
      config.signal = controller.signal;
      config._controller = controller;
      activeRequests.set(requestKey, controller);
    }
  }

  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    // React Native's networking layer adds the multipart boundary itself
    config.headers['Content-Type'] = 'multipart/form-data';
    config.transformRequest = [(d) => d];
    if (!config.timeoutOverride) config.timeout = Math.max(config.timeout || 0, 120000);
  }

  const token = getToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config._hadToken = !!(config.headers.Authorization);
  return config;
});

api.interceptors.response.use(
  (response) => {
    clearActiveRequest(response.config);
    return response;
  },
  (error) => {
    if (error.config) clearActiveRequest(error.config);

    if (!error.response && !axios.isCancel(error)) {
      events.emit('network_error', error);
    }

    // Session expiry: an authenticated request rejected with 401 (outside /auth/*)
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      if (error.config?._hadToken && !url.startsWith('/auth/') && !url.includes('/auth/login')) {
        events.emit('session_expired');
      }
    }
    return Promise.reject(error);
  }
);

export const isCancel = axios.isCancel;
export default api;
