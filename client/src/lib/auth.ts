import { apiRequest } from "./queryClient";
import type { LoginData } from "@shared/schema";

export interface AuthUser {
  id: number;
  username: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string | null;
}

interface LoginResponse extends AuthUser {
  token: string;
}

// Token management
export function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('authToken', token);
}

export function removeAuthToken(): void {
  localStorage.removeItem('authToken');
}

export async function login(data: LoginData): Promise<AuthUser> {
  const response = await apiRequest("POST", "/api/auth/login", data);
  const result: LoginResponse = await response.json();
  
  // Store the token
  setAuthToken(result.token);
  
  // Return user data without token
  const { token, ...user } = result;
  return user;
}

export async function logout(): Promise<void> {
  try {
    await apiRequest("POST", "/api/auth/logout");
  } finally {
    removeAuthToken();
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const response = await apiRequest("GET", "/api/auth/me");
    return response.json();
  } catch (error) {
    removeAuthToken();
    return null;
  }
}
