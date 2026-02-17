import { queryClient } from "./queryClient";

export const API_BASE_URL = '/api';

const normalizeEndpoint = (endpoint: string): string => {
  return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
};

export const apiRequest = async (
  method: string,
  endpoint: string,
  data?: unknown
): Promise<Response> => {
  const normalizedEndpoint = normalizeEndpoint(endpoint);
  const url = `${API_BASE_URL}${normalizedEndpoint}`;

  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    if (!res.ok) {
      const text = await res.text();

      if (res.status === 401) {
        const error = new Error(`401: Not authenticated`);
        (error as any).status = 401;
        (error as any).response = { status: res.status, data: { message: 'Not authenticated' } };
        throw error;
      }

      try {
        const errorData = JSON.parse(text);
        const error = new Error(`${res.status}: ${errorData.message || res.statusText}`);
        (error as any).response = { status: res.status, data: errorData };
        throw error;
      } catch (parseError) {
        if ((parseError as any)?.status) throw parseError;
        throw new Error(`${res.status}: ${text || res.statusText}`);
      }
    }

    return res;
  } catch (error) {
    if ((error as any)?.response?.status !== 401) {
      console.error(`[API] Request failed:`, error);
    }
    throw error;
  }
};

export const apiGet = async (endpoint: string) => {
  const res = await apiRequest('GET', endpoint);
  return res.json();
};

export const apiPost = async (endpoint: string, data: unknown) => {
  const res = await apiRequest('POST', endpoint, data);
  return res.json();
};

export const apiPatch = async (endpoint: string, data: unknown) => {
  const res = await apiRequest('PATCH', endpoint, data);
  return res.json();
};

export const apiDelete = async (endpoint: string) => {
  const res = await apiRequest('DELETE', endpoint);
  return res.status === 204 ? null : res.json();
};

export const apiCall = async (
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  endpoint: string,
  data?: unknown
): Promise<any> => {
  const res = await apiRequest(method, endpoint, data);
  return res.status === 204 ? null : res.json();
};
