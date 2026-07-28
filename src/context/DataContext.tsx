import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  WeighingRecord, 
  Client, 
  Company, 
  PaymentRecord, 
  InventoryItem, 
  AppNotification, 
  PaymentType,
  PaymentStatus 
} from '../types';
import { db } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  setDoc, 
  getDocs,
  getDoc,
  query, 
  where,
  orderBy 
} from 'firebase/firestore';
import { auth } from '../lib/firebase';
import { 
  INITIAL_WEIGHINGS, 
  INITIAL_CLIENTS, 
  INITIAL_COMPANIES, 
  INITIAL_PAYMENTS, 
  INITIAL_INVENTORY, 
  INITIAL_NOTIFICATIONS 
} from '../lib/demoData';
import { useAuth } from './AuthContext';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.warn('Firestore notice:', errInfo.error, 'Operation:', operationType, 'Path:', path);
}

async function testConnection() {
  try {
    await getDoc(doc(db, 'system_settings', 'general'));
  } catch (error) {
    console.warn("Firestore connection check info:", error);
  }
}
testConnection();

interface DataContextType {
  weighings: WeighingRecord[];
  clients: Client[];
  companies: Company[];
  payments: PaymentRecord[];
  inventory: InventoryItem[];
  notifications: AppNotification[];
  addWeighing: (recordData: Omit<WeighingRecord, 'id' | 'ticketNumber' | 'createdAt' | 'createdBy' | 'pendingAmount' | 'paymentStatus'>) => Promise<WeighingRecord>;
  addPayment: (paymentData: Omit<PaymentRecord, 'id' | 'createdAt' | 'createdBy'>) => Promise<PaymentRecord>;
  addClient: (clientData: Omit<Client, 'id' | 'createdAt'>) => Promise<Client>;
  updateClient: (id: string, clientData: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addCompany: (companyData: Omit<Company, 'id' | 'createdAt'>) => Promise<Company>;
  updateCompany: (id: string, companyData: Partial<Company>) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  addInventoryItem: (itemData: Omit<InventoryItem, 'id' | 'updatedAt'>) => Promise<InventoryItem>;
  updateInventoryItem: (id: string, itemData: Partial<InventoryItem>) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  checkOverduePayments: () => void;
  sendCustomNotification: (title: string, message: string, type?: AppNotification['type']) => Promise<void>;
  resetSystemToDefault: () => Promise<void>;
  deleteWeighing: (id: string) => Promise<void>;
  appName: string;
  updateAppName: (newName: string) => Promise<void>;
}

const getInitialState = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn(`Error loading cached ${key}:`, e);
  }
  return fallback;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, activeCompany, createUserProfile } = useAuth();

  const [weighings, setWeighings] = useState<WeighingRecord[]>(() => getInitialState('avis_weighings', INITIAL_WEIGHINGS));
  const [clients, setClients] = useState<Client[]>(() => getInitialState('avis_clients', INITIAL_CLIENTS));
  const [companies, setCompanies] = useState<Company[]>(() => getInitialState('avis_companies', INITIAL_COMPANIES));
  const [payments, setPayments] = useState<PaymentRecord[]>(() => getInitialState('avis_payments', INITIAL_PAYMENTS));
  const [inventory, setInventory] = useState<InventoryItem[]>(() => getInitialState('avis_inventory', INITIAL_INVENTORY));
  const [notifications, setNotifications] = useState<AppNotification[]>(() => getInitialState('avis_notifications', INITIAL_NOTIFICATIONS));
  const [appName, setAppName] = useState<string>(() => {
    return localStorage.getItem('app_system_name') || 'Jean-Barsa Avícola System';
  });

  useEffect(() => {
    document.title = appName;
  }, [appName]);

  const updateAppName = async (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setAppName(trimmed);
    localStorage.setItem('app_system_name', trimmed);
    document.title = trimmed;
    try {
      await setDoc(doc(db, 'system_settings', 'general'), { appName: trimmed }, { merge: true });
    } catch (e) {
      console.warn('Could not save appName to firestore:', e);
    }
  };

  // Firestore Realtime Listeners with automatic initial cloud database seeding
  useEffect(() => {
    // 1) Seed Firestore collections if database is empty on first boot
    const seedCloudDatabaseIfEmpty = async () => {
      const isWiped = localStorage.getItem('system_wiped') === 'true';
      if (isWiped) return;

      try {
        const compSnap = await getDocs(collection(db, 'companies'));
        if (compSnap.empty) {
          const comps = getInitialState('avis_companies', INITIAL_COMPANIES);
          for (const c of comps) {
            await setDoc(doc(db, 'companies', c.id), c);
          }
        }

        const clientSnap = await getDocs(collection(db, 'clients'));
        if (clientSnap.empty) {
          const cls = getInitialState('avis_clients', INITIAL_CLIENTS);
          for (const cl of cls) {
            await setDoc(doc(db, 'clients', cl.id), cl);
          }
        }

        const invSnap = await getDocs(collection(db, 'inventory'));
        if (invSnap.empty) {
          const invs = getInitialState('avis_inventory', INITIAL_INVENTORY);
          for (const inv of invs) {
            await setDoc(doc(db, 'inventory', inv.id), inv);
          }
        }

        const weighSnap = await getDocs(collection(db, 'weighings'));
        if (weighSnap.empty) {
          const weighs = getInitialState('avis_weighings', INITIAL_WEIGHINGS);
          for (const w of weighs) {
            await setDoc(doc(db, 'weighings', w.id), w);
          }
        }

        const paySnap = await getDocs(collection(db, 'payments'));
        if (paySnap.empty) {
          const pays = getInitialState('avis_payments', INITIAL_PAYMENTS);
          for (const p of pays) {
            await setDoc(doc(db, 'payments', p.id), p);
          }
        }

        const notifSnap = await getDocs(collection(db, 'notifications'));
        if (notifSnap.empty) {
          const notifs = getInitialState('avis_notifications', INITIAL_NOTIFICATIONS);
          for (const n of notifs) {
            await setDoc(doc(db, 'notifications', n.id), n);
          }
        }
      } catch (e) {
        console.warn('Error seeding initial Firestore cloud database:', e);
      }
    };

    seedCloudDatabaseIfEmpty();

    // 2) Listen to real-time changes across all connected devices
    try {
      const unsubSettings = onSnapshot(doc(db, 'system_settings', 'general'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.appName) setAppName(data.appName);
          if (data.wiped) {
            localStorage.setItem('system_wiped', 'true');
          }
        }
      }, (err) => handleFirestoreError(err, OperationType.GET, 'system_settings/general'));

      const unsubWeighings = onSnapshot(collection(db, 'weighings'), (snap) => {
        const isWiped = localStorage.getItem('system_wiped') === 'true';
        if (!snap.empty) {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as WeighingRecord));
          docs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          setWeighings(docs);
          try { localStorage.setItem('avis_weighings', JSON.stringify(docs)); } catch (e) {}
        } else if (isWiped) {
          setWeighings([]);
          try { localStorage.setItem('avis_weighings', JSON.stringify([])); } catch (e) {}
        }
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'weighings'));

      const unsubClients = onSnapshot(collection(db, 'clients'), (snap) => {
        const isWiped = localStorage.getItem('system_wiped') === 'true';
        if (!snap.empty) {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Client));
          docs.sort((a, b) => a.name.localeCompare(b.name));
          setClients(docs);
          try { localStorage.setItem('avis_clients', JSON.stringify(docs)); } catch (e) {}
        } else if (isWiped) {
          setClients([]);
          try { localStorage.setItem('avis_clients', JSON.stringify([])); } catch (e) {}
        }
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'clients'));

      const unsubCompanies = onSnapshot(collection(db, 'companies'), (snap) => {
        const isWiped = localStorage.getItem('system_wiped') === 'true';
        if (!snap.empty) {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Company));
          setCompanies(docs);
          try { localStorage.setItem('avis_companies', JSON.stringify(docs)); } catch (e) {}
        } else if (isWiped) {
          setCompanies([INITIAL_COMPANIES[0]]);
          try { localStorage.setItem('avis_companies', JSON.stringify([INITIAL_COMPANIES[0]])); } catch (e) {}
        }
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'companies'));

      const unsubPayments = onSnapshot(collection(db, 'payments'), (snap) => {
        const isWiped = localStorage.getItem('system_wiped') === 'true';
        if (!snap.empty) {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentRecord));
          docs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          setPayments(docs);
          try { localStorage.setItem('avis_payments', JSON.stringify(docs)); } catch (e) {}
        } else if (isWiped) {
          setPayments([]);
          try { localStorage.setItem('avis_payments', JSON.stringify([])); } catch (e) {}
        }
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'payments'));

      const unsubInventory = onSnapshot(collection(db, 'inventory'), (snap) => {
        const isWiped = localStorage.getItem('system_wiped') === 'true';
        if (!snap.empty) {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem));
          setInventory(docs);
          try { localStorage.setItem('avis_inventory', JSON.stringify(docs)); } catch (e) {}
        } else if (isWiped) {
          setInventory([]);
          try { localStorage.setItem('avis_inventory', JSON.stringify([])); } catch (e) {}
        }
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'inventory'));

      const unsubNotifs = onSnapshot(collection(db, 'notifications'), (snap) => {
        const isWiped = localStorage.getItem('system_wiped') === 'true';
        if (!snap.empty) {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
          docs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          setNotifications(docs);
          try { localStorage.setItem('avis_notifications', JSON.stringify(docs)); } catch (e) {}
        } else if (isWiped) {
          setNotifications([]);
          try { localStorage.setItem('avis_notifications', JSON.stringify([])); } catch (e) {}
        }
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'notifications'));

      return () => {
        unsubSettings();
        unsubWeighings();
        unsubClients();
        unsubCompanies();
        unsubPayments();
        unsubInventory();
        unsubNotifs();
      };
    } catch (e) {
      console.warn('Firestore subscription failed:', e);
    }
  }, []);

  // Check overdue payments periodically (once on mount or on explicit call)
  const checkOverduePayments = () => {
    const today = new Date().toISOString().split('T')[0];
    let newNotifications: AppNotification[] = [];

    weighings.forEach((w) => {
      if (w.paymentStatus !== 'pagado' && w.dueDate && w.dueDate < today && w.pendingAmount > 0) {
        // If not already notified
        const alreadyNotified = notifications.some(n => n.message.includes(w.ticketNumber) && n.type === 'overdue');
        if (!alreadyNotified) {
          const notif: AppNotification = {
            id: `notif_overdue_${w.id}`,
            companyId: w.companyId,
            targetRole: 'empresa',
            title: '🚨 PAGO VENCIDO',
            message: `El ticket ${w.ticketNumber} de ${w.clientName} por S/ ${w.pendingAmount.toFixed(2)} venció el ${w.dueDate}.`,
            type: 'overdue',
            read: false,
            createdAt: new Date().toISOString(),
          };
          newNotifications.push(notif);
        }
      }
    });

    if (newNotifications.length > 0) {
      const existingIds = new Set(notifications.map(n => n.id));
      const filtered = newNotifications.filter(n => !existingIds.has(n.id));
      if (filtered.length > 0) {
        setNotifications(prev => [...filtered, ...prev]);

        filtered.forEach(async (n) => {
          try {
            await setDoc(doc(db, 'notifications', n.id), n);
          } catch (e) {
            console.warn('Error pushing overdue notification to firestore:', e);
          }
        });
      }
    }
  };

  useEffect(() => {
    checkOverduePayments();
  }, []);


  // Add Weighing Record & Ticket
  const addWeighing = async (
    recordData: Omit<WeighingRecord, 'id' | 'ticketNumber' | 'createdAt' | 'createdBy' | 'pendingAmount' | 'paymentStatus'>
  ): Promise<WeighingRecord> => {
    const ticketSeq = 1000 + weighings.length + 1;
    const ticketNumber = `TK-${new Date().getFullYear()}-${ticketSeq}`;

    const isPaid = recordData.paymentType === 'contado';
    const pendingAmount = isPaid ? 0 : recordData.totalAmount - (recordData.paidAmount || 0);
    const paymentStatus: PaymentStatus = isPaid 
      ? 'pagado' 
      : (pendingAmount <= 0 ? 'pagado' : ((recordData.paidAmount || 0) > 0 ? 'parcial' : 'pendiente'));

    const newRecord: WeighingRecord = {
      ...recordData,
      id: `weigh_${Date.now()}`,
      ticketNumber,
      pendingAmount,
      paymentStatus,
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.displayName || 'Operador',
    };

    // Update Local
    setWeighings(prev => [newRecord, ...prev]);

    // Save to Firestore
    try {
      await setDoc(doc(db, 'weighings', newRecord.id), newRecord);
    } catch (e) {
      console.warn('Firestore add weighing error:', e);
    }

    // Update Client Pending Balance
    if (newRecord.pendingAmount > 0) {
      const client = clients.find(c => c.id === newRecord.clientId);
      if (client) {
        const newBal = (client.currentBalance || 0) + newRecord.pendingAmount;
        await updateClient(client.id, { currentBalance: newBal });
      }
    }

    // Deduct Inventory from Galpón if selected
    if (newRecord.galponId) {
      const galponItem = inventory.find(i => i.id === newRecord.galponId);
      if (galponItem) {
        const updatedHead = Math.max(0, galponItem.headCount - newRecord.chickenCount);
        const updatedWeight = Math.max(0, galponItem.totalWeight - newRecord.netWeight);
        const avgW = updatedHead > 0 ? Number((updatedWeight / updatedHead).toFixed(2)) : galponItem.averageWeight;
        
        await updateInventoryItem(galponItem.id, {
          headCount: updatedHead,
          totalWeight: updatedWeight,
          averageWeight: avgW
        });
      }
    }

    // Create Notification
    await sendCustomNotification(
      '🏷️ Nuevo Ticket Generado',
      `Se registró la pesa #${ticketNumber} para ${newRecord.clientName} por ${newRecord.chickenCount} pollos (${newRecord.netWeight.toFixed(1)}kg) ${newRecord.galponName ? `del ${newRecord.galponName}` : ''} - Total: S/ ${newRecord.totalAmount.toFixed(2)}`,
      'weighing'
    );

    return newRecord;
  };

  // Add Payment
  const addPayment = async (paymentData: Omit<PaymentRecord, 'id' | 'createdAt' | 'createdBy'>): Promise<PaymentRecord> => {
    const resolvedCompanyId = paymentData.companyId || activeCompany?.id || currentUser?.companyId || clients.find(c => c.id === paymentData.clientId)?.companyId || weighings.find(w => w.clientId === paymentData.clientId)?.companyId || 'comp_1';

    const newPayment: PaymentRecord = {
      ...paymentData,
      companyId: resolvedCompanyId,
      id: `pay_${Date.now()}`,
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.displayName || currentUser?.username || 'Cliente/Cajero',
    };

    setPayments(prev => [newPayment, ...prev]);

    try {
      await setDoc(doc(db, 'payments', newPayment.id), newPayment);
    } catch (e) {
      console.warn('Firestore payment error:', e);
    }

    // Update Weighing record balance
    if (paymentData.weighingId) {
      const targetWeighing = weighings.find(w => w.id === paymentData.weighingId);
      if (targetWeighing) {
        const newPaid = targetWeighing.paidAmount + paymentData.amount;
        const newPending = Math.max(0, targetWeighing.totalAmount - newPaid);
        const newStatus: PaymentStatus = newPending <= 0 ? 'pagado' : 'parcial';

        setWeighings(prev => prev.map(w => w.id === targetWeighing.id ? {
          ...w,
          paidAmount: newPaid,
          pendingAmount: newPending,
          paymentStatus: newStatus
        } : w));

        try {
          await updateDoc(doc(db, 'weighings', targetWeighing.id), {
            paidAmount: newPaid,
            pendingAmount: newPending,
            paymentStatus: newStatus
          });
        } catch (e) {
          console.warn('Firestore weighing update payment error:', e);
        }
      }
    } else {
      // General abono without specific weighingId: distribute across client's pending tickets (oldest first)
      const targetName = (paymentData.clientName || '').toLowerCase().trim();
      const clientPendingWeighings = weighings
        .filter(w => (w.clientId === paymentData.clientId || (targetName && w.clientName.toLowerCase().trim() === targetName)) && w.pendingAmount > 0)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      let remainingAbono = paymentData.amount;
      const updatedWeighingUpdates: { id: string; paidAmount: number; pendingAmount: number; paymentStatus: PaymentStatus }[] = [];

      for (const w of clientPendingWeighings) {
        if (remainingAbono <= 0) break;
        const applyAmount = Math.min(remainingAbono, w.pendingAmount);
        const newPaid = w.paidAmount + applyAmount;
        const newPending = Math.max(0, w.totalAmount - newPaid);
        const newStatus: PaymentStatus = newPending <= 0 ? 'pagado' : 'parcial';

        remainingAbono -= applyAmount;
        updatedWeighingUpdates.push({
          id: w.id,
          paidAmount: newPaid,
          pendingAmount: newPending,
          paymentStatus: newStatus,
        });
      }

      if (updatedWeighingUpdates.length > 0) {
        setWeighings(prev => prev.map(w => {
          const match = updatedWeighingUpdates.find(u => u.id === w.id);
          if (match) {
            return {
              ...w,
              paidAmount: match.paidAmount,
              pendingAmount: match.pendingAmount,
              paymentStatus: match.paymentStatus
            };
          }
          return w;
        }));

        for (const updateItem of updatedWeighingUpdates) {
          try {
            await updateDoc(doc(db, 'weighings', updateItem.id), {
              paidAmount: updateItem.paidAmount,
              pendingAmount: updateItem.pendingAmount,
              paymentStatus: updateItem.paymentStatus
            });
          } catch (e) {
            console.warn('Firestore weighing batch update error:', e);
          }
        }
      }
    }

    // Reduce Client Balance
    const targetClient = clients.find(c => 
      c.id === paymentData.clientId || 
      (paymentData.clientName && c.name.toLowerCase().trim() === paymentData.clientName.toLowerCase().trim())
    );
    if (targetClient) {
      const updatedBalance = Math.max(0, (targetClient.currentBalance || 0) - paymentData.amount);
      await updateClient(targetClient.id, { currentBalance: updatedBalance });
    }

    // Notification
    await sendCustomNotification(
      '💵 Pago Recibido',
      `Se registró abono de S/ ${paymentData.amount.toFixed(2)} de ${targetClient?.name || paymentData.clientName || 'Cliente'} (${paymentData.method.toUpperCase()}).`,
      'payment'
    );

    return newPayment;
  };

  const updateCompany = async (id: string, companyData: Partial<Company>) => {
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...companyData } : c));
    try {
      await setDoc(doc(db, 'companies', id), companyData, { merge: true });
    } catch (e) {
      console.warn('Firestore company update error:', e);
    }
  };

  const deleteCompany = async (id: string) => {
    setCompanies(prev => prev.filter(c => c.id !== id));
    try {
      await deleteDoc(doc(db, 'companies', id));
    } catch (e) {
      console.warn('Firestore company delete error:', e);
    }
  };

  // Add & Update Clients
  const addClient = async (clientData: Omit<Client, 'id' | 'createdAt'>): Promise<Client> => {
    const newClientId = `cli_${Date.now()}`;
    const newClient: Client = {
      ...clientData,
      id: newClientId,
      currentBalance: clientData.currentBalance || 0,
      createdAt: new Date().toISOString(),
    };

    setClients(prev => [...prev, newClient]);

    try {
      await setDoc(doc(db, 'clients', newClient.id), newClient);
    } catch (e) {
      console.warn('Firestore add client error:', e);
    }

    // Auto-create Client User Profile so they can log in and see their purchase history
    if (createUserProfile) {
      try {
        const rawName = newClient.name.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const cleanPhone = newClient.phone ? newClient.phone.replace(/\D/g, '') : '';
        const generatedUser = (cleanPhone && cleanPhone.length >= 6) 
          ? cleanPhone 
          : rawName.replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').slice(0, 15) || `cliente_${Date.now().toString().slice(-4)}`;

        await createUserProfile({
          displayName: newClient.name,
          username: generatedUser,
          email: newClient.email || `${generatedUser}@aviscontrol.pe`,
          password: '1234',
          role: 'cliente',
          clientId: newClient.id,
          companyId: newClient.companyId,
          phone: newClient.phone,
          accessLevel: 'operador'
        });
        (newClient as any).assignedUsername = generatedUser;
      } catch (err) {
        console.warn('Error auto-creating client user profile:', err);
      }
    }

    return newClient;
  };

  const updateClient = async (id: string, clientData: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...clientData } : c));
    try {
      await updateDoc(doc(db, 'clients', id), clientData);
    } catch (e) {
      console.warn('Firestore client update error:', e);
    }
  };

  const deleteClient = async (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    try {
      await deleteDoc(doc(db, 'clients', id));
    } catch (e) {
      console.warn('Firestore client delete error:', e);
    }
  };

  // Companies
  const addCompany = async (companyData: Omit<Company, 'id' | 'createdAt'>): Promise<Company> => {
    const newComp: Company = {
      ...companyData,
      id: `comp_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setCompanies(prev => [...prev, newComp]);

    try {
      await setDoc(doc(db, 'companies', newComp.id), newComp);
    } catch (e) {
      console.warn('Firestore add company error:', e);
    }

    return newComp;
  };

  // Inventory
  const addInventoryItem = async (itemData: Omit<InventoryItem, 'id' | 'updatedAt'>): Promise<InventoryItem> => {
    const newItem: InventoryItem = {
      ...itemData,
      id: `inv_${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };

    setInventory(prev => [...prev, newItem]);

    try {
      await setDoc(doc(db, 'inventory', newItem.id), newItem);
    } catch (e) {
      console.warn('Firestore inventory error:', e);
    }

    return newItem;
  };

  const updateInventoryItem = async (id: string, itemData: Partial<InventoryItem>) => {
    const updatedAt = new Date().toISOString();
    setInventory(prev => prev.map(i => i.id === id ? { ...i, ...itemData, updatedAt } : i));

    try {
      await updateDoc(doc(db, 'inventory', id), { ...itemData, updatedAt });
    } catch (e) {
      console.warn('Firestore inventory update error:', e);
    }
  };

  // Notifications
  const markNotificationRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (e) {
      console.warn('Firestore notif update error:', e);
    }
  };

  const clearAllNotifications = async () => {
    setNotifications([]);
  };

  const sendCustomNotification = async (title: string, message: string, type: AppNotification['type'] = 'system') => {
    const newN: AppNotification = {
      id: `notif_${Date.now()}_${Math.floor(Math.random() * 100)}`,
      companyId: activeCompany?.id || currentUser?.companyId || '',
      targetRole: 'empresa',
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    };

    setNotifications(prev => [newN, ...prev]);

    try {
      await setDoc(doc(db, 'notifications', newN.id), newN);
    } catch (e) {
      console.warn('Firestore notification add error:', e);
    }
  };

  const deleteWeighing = async (id: string) => {
    try {
      setWeighings(prev => prev.filter(w => w.id !== id));
      await deleteDoc(doc(db, 'weighings', id));
    } catch (e) {
      console.warn('Error deleting weighing in firestore:', e);
    }
  };

  const resetSystemToDefault = async () => {
    try {
      localStorage.setItem('system_wiped', 'true');
      setWeighings([]);
      setClients([]);
      setPayments([]);
      setInventory([]);
      setNotifications([]);
      setCompanies([INITIAL_COMPANIES[0]]);

      // Save wiped flag to system_settings in Firestore
      try {
        await setDoc(doc(db, 'system_settings', 'general'), { wiped: true, wipedAt: new Date().toISOString() }, { merge: true });
      } catch (e) {
        console.warn('Error marking system_settings wiped:', e);
      }

      // Ensure default company doc exists
      try {
        await setDoc(doc(db, 'companies', INITIAL_COMPANIES[0].id), INITIAL_COMPANIES[0]);
      } catch (e) {
        console.warn('Error setting default company doc:', e);
      }

      // Attempt to clear Firestore collections
      const collectionsToWipe = ['weighings', 'clients', 'payments', 'inventory', 'notifications'];
      for (const colName of collectionsToWipe) {
        try {
          const snap = await getDocs(collection(db, colName));
          const deletePromises = snap.docs.map(d => deleteDoc(doc(db, colName, d.id)));
          await Promise.all(deletePromises);
        } catch (e) {
          console.warn(`Error wiping collection ${colName}:`, e);
        }
      }
    } catch (e) {
      console.error('Reset error:', e);
    }
  };

  return (
    <DataContext.Provider value={{
      weighings,
      clients,
      companies,
      payments,
      inventory,
      notifications,
      addWeighing,
      addPayment,
      addClient,
      updateClient,
      deleteClient,
      addCompany,
      updateCompany,
      deleteCompany,
      addInventoryItem,
      updateInventoryItem,
      markNotificationRead,
      clearAllNotifications,
      checkOverduePayments,
      sendCustomNotification,
      resetSystemToDefault,
      deleteWeighing,
      appName,
      updateAppName
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
