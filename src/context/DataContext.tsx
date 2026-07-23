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
  query, 
  where,
  orderBy 
} from 'firebase/firestore';
import { 
  INITIAL_WEIGHINGS, 
  INITIAL_CLIENTS, 
  INITIAL_COMPANIES, 
  INITIAL_PAYMENTS, 
  INITIAL_INVENTORY, 
  INITIAL_NOTIFICATIONS 
} from '../lib/demoData';
import { useAuth } from './AuthContext';

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

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, activeCompany } = useAuth();

  const [weighings, setWeighings] = useState<WeighingRecord[]>(INITIAL_WEIGHINGS);
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);
  const [payments, setPayments] = useState<PaymentRecord[]>(INITIAL_PAYMENTS);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
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

  // Firestore Realtime Listeners with local fallback
  useEffect(() => {
    try {
      const unsubSettings = onSnapshot(doc(db, 'system_settings', 'general'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.appName) setAppName(data.appName);
          if (data.wiped) {
            localStorage.setItem('system_wiped', 'true');
          }
        }
      });

      const unsubWeighings = onSnapshot(collection(db, 'weighings'), (snap) => {
        const isWiped = localStorage.getItem('system_wiped') === 'true';
        if (!snap.empty) {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as WeighingRecord));
          setWeighings(docs);
        } else if (isWiped) {
          setWeighings([]);
        }
      }, (err) => console.warn('Weighings listener error:', err));

      const unsubClients = onSnapshot(collection(db, 'clients'), (snap) => {
        const isWiped = localStorage.getItem('system_wiped') === 'true';
        if (!snap.empty) {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Client));
          setClients(docs);
        } else if (isWiped) {
          setClients([]);
        }
      }, (err) => console.warn('Clients listener error:', err));

      const unsubCompanies = onSnapshot(collection(db, 'companies'), (snap) => {
        const isWiped = localStorage.getItem('system_wiped') === 'true';
        if (!snap.empty) {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Company));
          setCompanies(docs);
        } else if (isWiped) {
          setCompanies([INITIAL_COMPANIES[0]]);
        }
      }, (err) => console.warn('Companies listener error:', err));

      const unsubPayments = onSnapshot(collection(db, 'payments'), (snap) => {
        const isWiped = localStorage.getItem('system_wiped') === 'true';
        if (!snap.empty) {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentRecord));
          setPayments(docs);
        } else if (isWiped) {
          setPayments([]);
        }
      }, (err) => console.warn('Payments listener error:', err));

      const unsubInventory = onSnapshot(collection(db, 'inventory'), (snap) => {
        const isWiped = localStorage.getItem('system_wiped') === 'true';
        if (!snap.empty) {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem));
          setInventory(docs);
        } else if (isWiped) {
          setInventory([]);
        }
      }, (err) => console.warn('Inventory listener error:', err));

      const unsubNotifs = onSnapshot(collection(db, 'notifications'), (snap) => {
        const isWiped = localStorage.getItem('system_wiped') === 'true';
        if (!snap.empty) {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
          setNotifications(docs);
        } else if (isWiped) {
          setNotifications([]);
        }
      }, (err) => console.warn('Notifications listener error:', err));

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
      console.warn('Firestore subscription failed, running in local memory state:', e);
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
    const newPayment: PaymentRecord = {
      ...paymentData,
      id: `pay_${Date.now()}`,
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.displayName || 'Cajero',
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
    }

    // Reduce Client Balance
    const targetClient = clients.find(c => c.id === paymentData.clientId);
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
    const newClient: Client = {
      ...clientData,
      id: `cli_${Date.now()}`,
      currentBalance: clientData.currentBalance || 0,
      createdAt: new Date().toISOString(),
    };

    setClients(prev => [...prev, newClient]);

    try {
      await setDoc(doc(db, 'clients', newClient.id), newClient);
    } catch (e) {
      console.warn('Firestore add client error:', e);
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
