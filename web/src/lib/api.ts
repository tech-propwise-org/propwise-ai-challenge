// Types mirror the API's response shapes in api/src/common/dto.ts.

export interface Agent {
  id: string;
  name: string;
  email: string;
  timezone: string;
  agency: { id: string; name: string };
}

export type MessageDirection = 'inbound' | 'outbound';

export interface Message {
  id: string;
  leadId: string;
  direction: MessageDirection;
  channel: 'whatsapp' | 'email' | 'sms';
  body: string;
  sentAt: string;
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'viewing' | 'negotiating' | 'won' | 'lost';

export interface Lead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: 'whatsapp' | 'website' | 'portal' | 'referral' | 'email';
  status: LeadStatus;
  notes: string | null;
  assignedAgent: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadSummary extends Lead {
  lastMessage: Message | null;
}

export interface LeadDetail extends Lead {
  /** The newest messages (up to 200), oldest first. */
  messages: Message[];
  messageCount: number;
}

export interface Property {
  id: string;
  reference: string;
  title: string;
  area: string;
  building: string | null;
  type: 'apartment' | 'villa' | 'townhouse' | 'penthouse';
  bedrooms: number;
  bathrooms: number;
  sizeSqft: number;
  priceAed: number;
  annualRentAed: number | null;
  serviceChargeAedPerSqft: number | null;
  status: 'available' | 'reserved' | 'sold';
  description: string;
  listedAt: string;
}

export interface Task {
  id: string;
  leadId: string;
  title: string;
  notes: string | null;
  dueAt: string | null;
  status: 'open' | 'done';
  createdBy: { id: string; name: string };
  createdAt: string;
}

export interface Page<T> {
  items: T[];
  total: number;
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, token: string | null, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
    const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    throw new ApiError(response.status, message ?? `Request failed with ${response.status}`);
  }
  return (await response.json()) as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ accessToken: string; agent: Agent }>('/auth/login', null, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  listLeads: (token: string, params: { limit: number; offset: number }) =>
    request<Page<LeadSummary>>(`/leads?limit=${params.limit}&offset=${params.offset}`, token),
  getLead: (token: string, leadId: string) => request<LeadDetail>(`/leads/${leadId}`, token),
  listTasks: (token: string, leadId: string) => request<Task[]>(`/leads/${leadId}/tasks`, token),
  updateTask: (token: string, taskId: string, changes: Partial<Pick<Task, 'status'>>) =>
    request<Task>(`/tasks/${taskId}`, token, { method: 'PATCH', body: JSON.stringify(changes) }),
  getProperty: (token: string, propertyId: string) => request<Property>(`/properties/${propertyId}`, token),
};
