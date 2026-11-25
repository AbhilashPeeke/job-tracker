import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export type Status = "Applied" | "Interview" | "Offer" | "Rejected";
export const STATUSES: Status[] = ["Applied", "Interview", "Offer", "Rejected"];

export interface Application {
  id: number;
  company: string;
  role: string;
  source: string;
  status: Status;
  appliedOn: string;
  offeredCtc: number | null;
  notes: string | null;
}

export interface ApplicationInput {
  company: string;
  role: string;
  source: string;
  status: Status;
  appliedOn: string;
  offeredCtc: number | null;
  notes: string | null;
}

export interface AuthResponse {
  token: string;
  email: string;
  role: string;
}

export function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) return "Cannot reach the server. Is the API running?";
    const data = err.response.data;
    if (typeof data === "string" && data) return data;
    if (data?.errors) return (Object.values(data.errors) as string[][]).flat().join(" ");
  }
  return "Something went wrong.";
}