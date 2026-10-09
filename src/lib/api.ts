import type { SiteData, ProjectItem, SkillItem, EducationItem, AchievementItem, ContactMessage, SocialLink } from '../types/index.ts';

const TOKEN_KEY = 'nayem_admin_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function authHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchSiteData(): Promise<SiteData> {
  const res = await fetch('/api/site-data');
  if (!res.ok) throw new Error('Failed to fetch site data');
  return res.json();
}

export async function submitContactMessage(data: {
  name: string;
  email: string;
  phone: string;
  address?: string;
  message: string;
}): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to send message');
  return json;
}

export async function loginAdmin(credentials: { username: string; password: string }) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Login failed');
  setAuthToken(json.token);
  return json;
}

export async function checkAdminAuth() {
  const token = getAuthToken();
  if (!token) throw new Error('No token');
  const res = await fetch('/api/auth/me', {
    headers: authHeaders(),
  });
  if (!res.ok) {
    removeAuthToken();
    throw new Error('Session expired');
  }
  return res.json();
}

export async function uploadMedia(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = reader.result as string;
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ dataUrl, filename: file.name }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Upload failed');
        resolve(json.url);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('File reading failed'));
    reader.readAsDataURL(file);
  });
}

export async function changeAdminPassword(passwords: {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(passwords),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Password update failed');
  return json;
}

