import { Company, Client, WeighingRecord, PaymentRecord, InventoryItem, AppNotification, UserProfile } from '../types';

export const DEFAULT_COMPANY: Company = {
  id: 'comp_default',
  name: 'Empresa Principal',
  taxId: '20000000001',
  address: 'Oficina Central / Planta de Pesaje',
  phone: '+51 900 000 000',
  active: true,
  createdAt: new Date().toISOString()
};

export const INITIAL_COMPANIES: Company[] = [DEFAULT_COMPANY];

export const INITIAL_CLIENTS: Client[] = [];

export const INITIAL_WEIGHINGS: WeighingRecord[] = [];

export const INITIAL_PAYMENTS: PaymentRecord[] = [];

export const INITIAL_INVENTORY: InventoryItem[] = [];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [];

export const INITIAL_USERS: UserProfile[] = [
  {
    uid: 'demo_admin',
    email: 'admin@aviscontrol.com',
    username: 'admin',
    password: '1234',
    displayName: 'Administrador Principal',
    role: 'admin',
    accessLevel: 'super_admin',
    permissions: ['all'],
    phone: '+51 987-654-321',
    createdAt: new Date().toISOString(),
  }
];
