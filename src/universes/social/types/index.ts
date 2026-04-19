// ── Interfaces ────────────────────────────────────────────────────────────────

export type ContactCategory = 'Amigo' | 'Mentor' | 'Colega' | 'Familiar' | 'Conocido';
export type EventType = 'Reunión' | 'Fiesta' | 'Networking' | 'Deporte' | 'Cultural' | 'Otro';
export type CommunityType = 'Online' | 'Presencial' | 'Híbrido';
export type ParticipationFrequency = 'Diaria' | 'Semanal' | 'Mensual' | 'Ocasional';

export interface SocialContact {
  id: string;
  user_id: string;
  name: string;
  category: ContactCategory;
  last_contact_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface SocialEvent {
  id: string;
  user_id: string;
  title: string;
  event_date: string;
  type: EventType;
  location: string | null;
  notes: string | null;
  created_at: string;
}

export interface SocialCommunity {
  id: string;
  user_id: string;
  name: string;
  type: CommunityType;
  is_active: boolean;
  frequency: ParticipationFrequency;
  created_at: string;
}

// ── Input types ───────────────────────────────────────────────────────────────

export interface NewContactInput {
  name: string;
  category: ContactCategory;
  last_contact_date: string;
  notes: string;
}

export interface NewEventInput {
  title: string;
  event_date: string;
  type: EventType;
  location: string;
  notes: string;
}

export interface NewCommunityInput {
  name: string;
  type: CommunityType;
  is_active: boolean;
  frequency: ParticipationFrequency;
}
