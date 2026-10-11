// src/services/api.ts
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const healthCheck = async () => {
  return axios.get(`${API_BASE}/health`).then(res => res.data);
};

export interface AskRequest {
  question: string;
  brand?: string;
  motorcycle_id?: string;
  top_k?: number;
}

export interface Source {
  chunk_id: string;
  motorcycle_id?: string;
  brand?: string;
  model?: string;
  variant?: string;
  youtube_url?: string;
  snippet: string;
}

export interface AskResponse {
  answer: string;
  sources: Source[];
}

export const askQuestion = async (payload: AskRequest): Promise<AskResponse> => {
  const resp = await axios.post(`${API_BASE}/ask`, payload);
  return resp.data;
};

export interface MotorcycleBrief {
  motorcycle_id: string;
  brand?: string;
  model?: string;
  variant?: string;
}

export const listMotorcycles = async (): Promise<MotorcycleBrief[]> => {
  const resp = await axios.get(`${API_BASE}/motorcycles`);
  return resp.data;
};
