import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, AccessLevel, Company, Client } from '../types';
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, query, where, deleteDoc, onSnapshot } from 'firebase/firestore';
import { INITIAL_USERS, INITIAL_COMPANIES, INITIAL_CLIENTS } from '../lib/demoData';

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  allUsers: UserProfile[];
  login: (emailOrUser: string, pass: string) => Promise<boolean>;
  quickDemoLogin: (role: UserRole, companyId?: string, clientId?: string) => void;
  logout: () => Promise<void>;
  createUserProfile: (userData: Omit<UserProfile, 'uid' | 'createdAt'> & { password?: string; username?: string }) => Promise<UserProfile>;
  updateUserProfile: (uid: string, updates: Partial<UserProfile>) => Promise<void>;
  deleteUserProfile: (uid: string) => Promise<void>;
  resetUsersExceptAdmin: () => Promise<void>;
  companies: Company[];
  clients: Client[];
  activeCompany: Company | null;
  setActiveCompanyId: (id: string) => void;
  reloadProfiles: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('avis_current_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.uid || parsed.username)) return parsed;
      }
    } catch (e) {}
    return null;
  });

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('avis_current_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('avis_current_user');
      }
    } catch (e) {}
  }, [currentUser]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('avis_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading avis_users from localStorage:', e);
    }
    return INITIAL_USERS;
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [companies, setCompanies] = useState<Company[]>(() => {
    try {
      const saved = localStorage.getItem('avis_companies');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_COMPANIES;
  });
  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const saved = localStorage.getItem('avis_clients');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_CLIENTS;
  });
  const [activeCompanyId, setActiveCompanyIdState] = useState<string>('');

  // Realtime Firestore Users Sync with initial seed check
  useEffect(() => {
    const checkAndSeedUsers = async () => {
      try {
        const userSnap = await getDocs(collection(db, 'users'));
        if (userSnap.empty) {
          const storedUsers = (() => {
            try {
              const saved = localStorage.getItem('avis_users');
              if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
              }
            } catch (e) {}
            return INITIAL_USERS;
          })();
          for (const u of storedUsers) {
            await setDoc(doc(db, 'users', u.uid), u);
          }
        }
      } catch (e) {
        console.warn('Error seeding initial users to cloud:', e);
      }
    };

    checkAndSeedUsers();

    try {
      const unsub = onSnapshot(collection(db, 'users'), (snap) => {
        if (!snap.empty) {
          const docs = snap.docs
            .map(d => ({ uid: d.id, ...d.data() } as UserProfile))
            .filter(u => !(u as any).deleted);
          if (docs.length > 0) {
            setAllUsers(docs);
            try { localStorage.setItem('avis_users', JSON.stringify(docs)); } catch (e) {}
          }
        }
      }, (err) => console.warn('Users snapshot listener error:', err));

      return () => unsub();
    } catch (e) {
      console.warn('User listener error:', e);
    }
  }, []);

  // Realtime Firestore Companies Sync
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, 'companies'), (snap) => {
        if (!snap.empty) {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Company));
          setCompanies(docs);
        } else {
          setCompanies([]);
        }
      }, (err) => console.warn('Companies snapshot listener:', err));

      return () => unsub();
    } catch (e) {
      console.warn('Companies listener error:', e);
    }
  }, []);

  const login = async (emailOrUser: string, pass: string): Promise<boolean> => {
    const cleanInput = emailOrUser.trim().toLowerCase();
    const cleanPass = pass.trim();

    if (!cleanInput) {
      return false;
    }

    // 1) Find user in local synchronized allUsers list
    let matchedUser = allUsers.find(u => 
      (u.email && u.email.toLowerCase() === cleanInput) || 
      (u.username && u.username.toLowerCase() === cleanInput) ||
      (cleanInput === 'admin' && u.role === 'admin')
    );

    // 2) If not in memory state yet, query Firestore `users` collection directly (for instant sync across mobile & PC)
    if (!matchedUser) {
      try {
        const userQuerySnap = await getDocs(query(collection(db, 'users'), where('username', '==', cleanInput)));
        if (!userQuerySnap.empty) {
          matchedUser = { uid: userQuerySnap.docs[0].id, ...userQuerySnap.docs[0].data() } as UserProfile;
        } else {
          const emailQuerySnap = await getDocs(query(collection(db, 'users'), where('email', '==', cleanInput)));
          if (!emailQuerySnap.empty) {
            matchedUser = { uid: emailQuerySnap.docs[0].id, ...emailQuerySnap.docs[0].data() } as UserProfile;
          }
        }
      } catch (e) {
        console.warn('Firestore user query error during login:', e);
      }
    }

    // 3) Validate credentials strictly if user profile exists
    if (matchedUser) {
      const expectedPassword = matchedUser.password || '1234';
      if (cleanPass === expectedPassword) {
        setCurrentUser(matchedUser);
        if (matchedUser.companyId) setActiveCompanyIdState(matchedUser.companyId);
        return true;
      } else {
        // Password mismatch - access denied
        return false;
      }
    }

    // 4) Try Firebase Auth as alternative authentication method
    try {
      const res = await signInWithEmailAndPassword(auth, cleanInput, cleanPass);
      const userSnap = await getDoc(doc(db, 'users', res.user.uid));
      if (userSnap.exists()) {
        const userProf = { uid: userSnap.id, ...userSnap.data() } as UserProfile;
        setCurrentUser(userProf);
        if (userProf.companyId) setActiveCompanyIdState(userProf.companyId);
        return true;
      }
      return false;
    } catch (error) {
      // Invalid credentials or user not found - access strictly denied
      return false;
    }
  };

  const quickDemoLogin = (role: UserRole, companyId?: string, clientId?: string) => {
    const found = allUsers.find(u => u.role === role) || {
      uid: `demo_${role}_${Date.now()}`,
      email: `${role}@aviscontrol.com`,
      username: role,
      displayName: role === 'admin' ? 'Administrador Principal' : role === 'empresa' ? 'Avícola Galpón Real' : 'Cliente Distribuidora',
      role: role,
      companyId: companyId || activeCompanyId || (companies[0]?.id || ''),
      clientId: clientId || (role === 'cliente' ? 'cli_san_juan' : undefined),
      accessLevel: role === 'admin' ? 'super_admin' : role === 'empresa' ? 'supervisor' : 'operador',
      createdAt: new Date().toISOString()
    };
    
    if (companyId) found.companyId = companyId;
    if (clientId) found.clientId = clientId;

    setCurrentUser(found);
    if (found.companyId) setActiveCompanyIdState(found.companyId);
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Signout warn:', e);
    }
    setCurrentUser(null);
  };

  const createUserProfile = async (userData: Omit<UserProfile, 'uid' | 'createdAt'> & { password?: string; username?: string }): Promise<UserProfile> => {
    const userDocRef = doc(collection(db, 'users'));
    const uid = userDocRef.id;

    const finalUsername = (userData.username || userData.displayName?.toLowerCase().replace(/\s+/g, '_') || 'usuario').trim();
    const finalEmail = userData.email || `${finalUsername}@aviscontrol.pe`;

    const newProfile: UserProfile = {
      uid,
      email: finalEmail,
      username: finalUsername,
      password: userData.password || '1234',
      displayName: userData.displayName,
      role: userData.role,
      companyId: userData.companyId || '',
      clientId: userData.clientId || '',
      accessLevel: userData.accessLevel || 'operador',
      permissions: userData.permissions || [],
      phone: userData.phone || '',
      createdAt: new Date().toISOString(),
    };

    setAllUsers(prev => [newProfile, ...prev.filter(u => u.uid !== uid)]);

    try {
      await setDoc(userDocRef, newProfile);
    } catch (err) {
      console.error('Firestore setDoc user error:', err);
    }

    return newProfile;
  };

  const updateUserProfile = async (uid: string, updates: Partial<UserProfile>) => {
    setAllUsers(prev => prev.map(u => u.uid === uid ? { ...u, ...updates } : u));
    if (currentUser?.uid === uid) {
      setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
    }
    try {
      await setDoc(doc(db, 'users', uid), updates, { merge: true });
    } catch (e) {
      console.warn('Firestore update user error:', e);
    }
  };

  const deleteUserProfile = async (uid: string) => {
    setAllUsers(prev => prev.filter(u => u.uid !== uid));
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (e) {
      console.warn('Firestore delete user error:', e);
    }
  };

  const reloadProfiles = async () => {
    try {
      const compSnap = await getDocs(collection(db, 'companies'));
      if (!compSnap.empty) {
        const comps = compSnap.docs.map(d => ({ id: d.id, ...d.data() } as Company));
        setCompanies(comps);
      }
      const cliSnap = await getDocs(collection(db, 'clients'));
      if (!cliSnap.empty) {
        const clis = cliSnap.docs.map(d => ({ id: d.id, ...d.data() } as Client));
        setClients(clis);
      }
    } catch (err) {
      console.warn('Error loading companies/clients from firestore:', err);
    }
  };

  const resetUsersExceptAdmin = async () => {
    localStorage.removeItem('system_wiped');
    const adminUser = allUsers.find(u => u.role === 'admin' || u.username === 'admin') || INITIAL_USERS[0];
    const defaultAdminList = [adminUser];
    setAllUsers(defaultAdminList);
    setCurrentUser(adminUser);
    
    try {
      localStorage.setItem('avis_users', JSON.stringify(defaultAdminList));
      localStorage.setItem('avis_current_user', JSON.stringify(adminUser));
    } catch (e) {}

    // Also update Firestore users collection
    try {
      await setDoc(doc(db, 'system_settings', 'general'), { wiped: true, wipedAt: new Date().toISOString() }, { merge: true });

      const adminDocId = adminUser.uid || 'demo_admin';
      await setDoc(doc(db, 'users', adminDocId), adminUser);

      const snap = await getDocs(collection(db, 'users'));
      const deletePromises = snap.docs
        .filter(d => {
          const data = d.data() as UserProfile;
          return data.role !== 'admin' && data.username !== 'admin' && d.id !== adminDocId;
        })
        .map(d => deleteDoc(doc(db, 'users', d.id)));

      await Promise.all(deletePromises);
    } catch (e) {
      console.warn('Error clearing non-admin users in firestore:', e);
    }
  };

  const setActiveCompanyId = (id: string) => {
    setActiveCompanyIdState(id);
  };

  const activeCompany = companies.find(c => c.id === activeCompanyId) || companies[0] || null;

  return (
    <AuthContext.Provider value={{
      currentUser,
      loading,
      allUsers,
      login,
      quickDemoLogin,
      logout,
      createUserProfile,
      updateUserProfile,
      deleteUserProfile,
      resetUsersExceptAdmin,
      companies,
      clients,
      activeCompany,
      setActiveCompanyId,
      reloadProfiles
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
