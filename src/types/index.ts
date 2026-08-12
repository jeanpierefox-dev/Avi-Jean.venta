export type UserRole = 'admin' | 'empresa' | 'operador' | 'cliente';

export type AccessLevel = 'super_admin' | 'supervisor' | 'operador';

export interface UserProfile {
  uid: string;
  email: string;
  username?: string;
  displayName: string;
  role: UserRole;
  companyId?: string;
  clientId?: string;
  accessLevel?: AccessLevel;
  permissions?: string[];
  phone?: string;
  password?: string;
  appLogoUrl?: string; // Logo de la aplicación personalizado por usuario/súper cliente
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  taxId?: string;
  phone?: string;
  address?: string;
  email?: string;
  logoUrl?: string; // Logo de la empresa para tickets
  active: boolean;
  createdAt: string;
}

export interface Client {
  id: string;
  companyId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  creditLimit?: number; // Monto límite de crédito (opcional)
  creditDays?: number; // Días de crédito autorizados
  currentBalance?: number; // Saldo pendiente total actual
  createdAt: string;
}

export interface BasketEntry {
  id: string;
  chickens: number;
  grossWeight: number; // Peso bruto en kg
  tareWeight: number; // Peso de javas/cestas en kg
  netWeight: number; // Peso neto
}

export interface ScaleEntry {
  id: string;
  chickens: number;
  grossWeight: number;
  photoUrl?: string;
  notes?: string;
}

export type PaymentType = 'contado' | 'credito';
export type PaymentStatus = 'pagado' | 'pendiente' | 'parcial' | 'vencido';

export interface WeighingRecord {
  id: string;
  ticketNumber: string;
  companyId: string;
  clientId: string;
  clientName: string;
  chickenCount: number; // Total pollos
  grossWeight: number; // Peso de la balanza
  tareWeight: number; // Siempre 0 si es peso directo
  netWeight: number; // Peso neto cobrable
  unitPrice: number; // Precio por kg en Soles (S/)
  totalAmount: number; // Monto total en Soles (S/)
  paidAmount: number; // Monto pagado
  pendingAmount: number; // Saldo pendiente
  paymentType: PaymentType;
  paymentStatus: PaymentStatus;
  creditDays?: number; // 7, 15, 30 días
  dueDate: string; // Fecha de vencimiento
  notes?: string;
  scaleImageUrl?: string; // Foto de la pesa/balanza principal
  scaleEntries?: ScaleEntry[]; // Múltiples pesas/balanzas con sus fotos individuales
  galponId?: string; // ID del galpón de donde se vendieron los pollos
  galponName?: string; // Nombre del galpón
  deadChickensCount?: number; // Opcional: número de pollos muertos si los hubiera
  baskets?: BasketEntry[]; // Opcional
  createdAt: string;
  createdBy: string; // Nombre del usuario operario
}

export type PaymentMethod = 'yape' | 'plim' | 'efectivo' | 'transferencia' | 'cheque' | 'otro';

export interface PaymentRecord {
  id: string;
  companyId: string;
  clientId: string;
  clientName?: string;
  weighingId?: string;
  ticketNumber?: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  voucherUrl?: string; // Foto/imagen del comprobante de Yape/Plim/Transferencia
  notes?: string;
  status?: 'aprobado' | 'pendiente' | 'rechazado';
  createdAt: string;
  createdBy: string;
}

export type AdjustmentReason = 'mortandad' | 'obsequio' | 'enfermedad' | 'merma' | 'otro';

export interface InventoryAdjustment {
  id: string;
  companyId: string;
  inventoryItemId: string;
  galponName: string;
  headCount: number;
  weight: number;
  reason: AdjustmentReason;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export interface InventoryItem {
  id: string;
  companyId: string;
  category: 'pollo_vivo' | 'pollo_procesado' | 'gallina' | 'alimento' | 'insumo';
  name: string;
  headCount: number; // Cantidad de cabezas/pollos
  totalWeight: number; // Peso total aproximado en kg
  averageWeight: number; // Peso promedio por pollo
  unit: string; // 'kg', 'unidades', 'sacos'
  minAlertThreshold: number; // Umbral de alerta
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  companyId: string;
  targetUserId?: string;
  targetRole?: UserRole;
  title: string;
  message: string;
  type: 'overdue' | 'payment' | 'inventory' | 'system' | 'weighing';
  read: boolean;
  createdAt: string;
}

export interface AccessLevelConfig {
  id: AccessLevel;
  name: string;
  description: string;
  canCreateCompany: boolean;
  canCreateUser: boolean;
  canEditPrice: boolean;
  canViewReports: boolean;
  canManageInventory: boolean;
  canProcessPayments: boolean;
}
