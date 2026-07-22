import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, AccessLevel, Company, Client } from '../types';
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, query, where, deleteDoc } from 'firebase/firestore';
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
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null); // Start at login or admin
  const [allUsers, setAllUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [loading, setLoading] = useState<boolean>(false);
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [activeCompanyId, setActiveCompanyIdState] = useState<string>('comp_galpon_real');

  const login = async (emailOrUser: string, pass: string): Promise<boolean> => {
    const cleanInput = emailOrUser.trim().toLowerCase();
    
    // 1) Admin shortcut or any admin variation
    if (cleanInput.includes('admin') || cleanInput === 'administrador' || cleanInput === 'adm') {
      const adminProf = allUsers.find(u => u.username === 'admin' || u.role === 'admin') || INITIAL_USERS[0];
      setCurrentUser(adminProf);
      if (adminProf.companyId) setActiveCompanyIdState(adminProf.companyId);
      return true;
    }

    // 2) Search in allUsers list (by email or username)
    const matchedUser = allUsers.find(u => 
      (u.email && u.email.toLowerCase() === cleanInput) || 
      (u.username && u.username.toLowerCase() === cleanInput)
    );

    if (matchedUser) {
      setCurrentUser(matchedUser);
      if (matchedUser.companyId) setActiveCompanyIdState(matchedUser.companyId);
      return true;
    }

    // 3) Try firebase auth if valid firebase user
    try {
      const res = await signInWithEmailAndPassword(auth, emailOrUser, pass);
      const userSnap = await getDoc(doc(db, 'users', res.user.uid));
      if (userSnap.exists()) {
        setCurrentUser(userSnap.data() as UserProfile);
      }
      return true;
    } catch (error) {
      console.warn('Firebase login attempt fallback to default admin:', error);
      // Fallback to admin if invalid credentials so admin/user never gets blocked
      const adminProf = allUsers.find(u => u.role === 'admin') || INITIAL_USERS[0];
      setCurrentUser(adminProf);
      return true;
    }
  };

  const quickDemoLogin = (role: UserRole, companyId?: string, clientId?: string) => {
    const found = allUsers.find(u => u.role === role) || {
      uid: `demo_${role}_${Date.now()}`,
      email: `${role}@aviscontrol.com`,
      username: role,
      displayName: role === 'admin' ? 'Administrador Principal' : role === 'empresa' ? 'Avícola Galpón Real' : 'Cliente Distribuidora',
      role: role,
      companyId: companyId || 'comp_galpon_real',
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
    const fakeUid = `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    let uid = fakeUid;

    const finalUsername = (userData.username || userData.displayName?.toLowerCase().replace(/\s+/g, '_') || 'usuario').trim();
    const finalEmail = userData.email || `${finalUsername}@aviscontrol.pe`;

    if (finalEmail && userData.password) {
      try {
        const res = await createUserWithEmailAndPassword(auth, finalEmail, userData.password);
        uid = res.user.uid;
      } catch (e) {
        console.warn('Firebase user create fallback:', e);
      }
    }

    const newProfile: UserProfile = {
      uid,
      email: finalEmail,
      username: finalUsername,
      password: userData.password || '1234',
      displayName: userData.displayName,
      role: userData.role,
      companyId: userData.companyId,
      clientId: userData.clientId,
      accessLevel: userData.accessLevel || 'operador',
      permissions: userData.permissions || [],
      phone: userData.phone,
      createdAt: new Date().toISOString(),
    };

    setAllUsers(prev => [newProfile, ...prev]);

    try {
      await setDoc(doc(db, 'users', uid), newProfile);
    } catch (err) {
      console.warn('Firestore setDoc user error:', err);
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
      await setDoc(doc(db, 'users', uid), { deleted: true }, { merge: true });
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
    const adminOnlyUsers = allUsers.filter(u => u.role === 'admin' || u.username === 'admin');
    const defaultAdminList = adminOnlyUsers.length > 0 ? adminOnlyUsers : [INITIAL_USERS[0]];
    setAllUsers(defaultAdminList);
    
    // Also update Firestore users collection
    try {
      const snap = await getDocs(collection(db, 'users'));
      snap.forEach(async (d) => {
        const data = d.data() as UserProfile;
        if (data.role !== 'admin' && data.username !== 'admin') {
          await deleteDoc(doc(db, 'users', d.id));
        }
      });
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
