// TypeScript Interfaces für Open-Akquise

export type PropertyStatus = 'NEU' | 'Zu vergeben' | 'Von GP kontaktiert' | 'Aufgenommen' | 'Vermarktung' | 'Abschluss/Verkauf' | 'Follow-up' | 'Storniert';

export type PropertyType = 'Miete' | 'Kauf' | 'Grundstück' | 'Garage' | 'Gewerblich';

export interface Property {
  id: number;
  title: string | null;
  link: string;
  external_id: string | null;
  uebergeben_am: string; // ISO date string
  tagesdatum: string; // ISO date string
  status: PropertyStatus;
  kaufpreis: number; // Kaufpreis der Immobilie
  gesamtprovision: number; // Auto-calculated (6% of kaufpreis)
  provision_abgeber: number; // Auto-calculated (3% of kaufpreis)
  provision_kaeufer: number; // Auto-calculated (3% of kaufpreis)
  berechnung: number; // Auto-calculated (10% of gesamtprovision)
  email: string | null;
  telefonnummer: string | null;
  objekttyp: PropertyType;
  plz: string | null;
  ort: string | null;
  betreut_von: string | null;
  provision_abgeber_custom: string | null;
  provision_kaeufer_custom: string | null;
  notizfeld: string | null;
  reply_message: string | null;
  replies?: any[];
  reports?: any[];
  created_at: string;
  updated_at: string;
  status_changed_at: string;
}

export interface DashboardStats {
  total_properties: number;
  total_commission: number; // Summe gesamtprovision
  total_earnings: number; // Summe berechnung (10%)
  verkauft_count: number;
  by_status: {
    status: string;
    count: number;
  }[];
}

export interface PropertyFormData {
  title?: string;
  link: string;
  external_id?: string;
  uebergeben_am: string;
  status: PropertyStatus;
  kaufpreis: number;
  email?: string;
  telefonnummer?: string;
  objekttyp: PropertyType;
  plz?: string;
  ort?: string;
  betreut_von?: string;
  provision_abgeber_custom?: string;
  provision_kaeufer_custom?: string;
  notizfeld?: string;
}

export interface PropertyNote {
  id: number;
  property_id: number;
  note_text: string;
  created_at: string;
  created_by: string;
}
