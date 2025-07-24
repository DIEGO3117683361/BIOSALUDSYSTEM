import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Patient, Service, InventoryItem, Invoice, TestResult, InvoiceService, ResultTemplate, User, PermissionKey, AppNotification, ConfirmationState, CompanyInfo, DashboardAnnouncement, AppContextType, DataSourceState, DataSourceType, FirebaseConfig } from '../types';
import { ALL_PERMISSIONS } from '../types';

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to get data from localStorage with a default
const getFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage`, error);
    return defaultValue;
  }
};

// Helper to set data to localStorage
const setToStorage = <T,>(key: string, value: T) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting ${key} in localStorage`, error);
  }
};

// --- MOCK DATA (used for initial local storage fill) ---
const MOCK_COMPANY_INFO: CompanyInfo = { name: 'BIOSALUD', nit: '900.123.456-7', address: 'Av. Principal 123, Ciudad, País', phone: '(123) 456-7890', email: 'info@biosalud.lab', footerSlogan: 'Gracias por confiar en BIOSALUD. Su salud es nuestra prioridad.'};
const MOCK_USERS: User[] = [{ id: '1061698378', name: 'Administrador Principal', password: 'LupitA3193', permissions: Object.keys(ALL_PERMISSIONS) as PermissionKey[], isDeletable: false, isProfessional: true, professionalTitle: 'Bacteriólogo Principal, MSc', professionalRegistration: 'TP 12345-COL', signature: '' }];
const MOCK_PATIENTS: Patient[] = [{ id: 'PAT-1', name: 'Ana Garcia', documentId: '12345678', dob: '1985-05-15', gender: 'Female', phone: '555-1234', email: 'ana.garcia@example.com', address: 'Calle Falsa 123', dependency: 'Empresa XYZ' }, { id: 'PAT-2', name: 'Carlos Rodriguez', documentId: '87654321', dob: '1992-11-20', gender: 'Male', phone: '555-5678', email: 'carlos.r@example.com', address: 'Avenida Siempre Viva 742', dependency: 'Particular' }];
const MOCK_TEMPLATES: ResultTemplate[] = [{id: 'TPL-HEMO', name: 'Hemograma Completo', fields: [{id: 'grp_rbc', label: 'Recuento de Serie Roja', type: 'group', children: [{ id: 'rbc_count', label: 'Recuento de glóbulos rojos (eritrocitos)', type: 'number', unit: 'millones/μL', referenceValues: 'H: 4.7–6.1, M: 4.2–5.4' }, { id: 'hemoglobin', label: 'Hemoglobina (Hb o Hgb)', type: 'number', unit: 'g/dL', referenceValues: 'H: 13.8–17.2, M: 12.1–15.1' }, { id: 'hematocrit', label: 'Hematocrito (Hto o Hct)', type: 'number', unit: '%', referenceValues: 'H: 40–54, M: 36–48' }]}, {id: 'grp_indices', label: 'Índices Eritrocitarios', type: 'group', children: [{ id: 'vcm', label: 'VCM (Volumen Corpuscular Medio)', type: 'number', unit: 'fL', referenceValues: '80–100' }, { id: 'hcm', label: 'HCM (Hemoglobina Corpuscular Media)', type: 'number', unit: 'pg', referenceValues: '27–33' }, { id: 'chcm', label: 'CHCM (Concentración de HCM)', type: 'number', unit: 'g/dL', referenceValues: '32–36' }, { id: 'rdw', label: 'RDW (Ancho de Distribución Eritrocitaria)', type: 'number', unit: '%', referenceValues: '11.5–14.5' }]}, {id: 'grp_wbc', label: 'Recuento de Serie Blanca (Leucocitos)', type: 'group', children: [{ id: 'wbc_total', label: 'Conteo total de leucocitos', type: 'number', unit: '/μL', referenceValues: '4,000–11,000' }, {id: 'wbc_formula', label: 'Fórmula leucocitaria', type: 'group', children: [{ id: 'neutrophils', label: 'Neutrófilos', type: 'number', unit: '%', referenceValues: '50–70' }, { id: 'lymphocytes', label: 'Linfocitos', type: 'number', unit: '%', referenceValues: '20–40' }, { id: 'monocytes', label: 'Monocitos', type: 'number', unit: '%', referenceValues: '2–8' }, { id: 'eosinophils', label: 'Eosinófilos', type: 'number', unit: '%', referenceValues: '1–4' }, { id: 'basophils', label: 'Basófilos', type: 'number', unit: '%', referenceValues: '0.5–1' }]}]}, {id: 'grp_platelets', label: 'Recuento de Plaquetas (Trombocitos)', type: 'group', children: [{ id: 'platelet_count', label: 'Conteo de plaquetas', type: 'number', unit: '/μL', referenceValues: '150,000–450,000' }, { id: 'mpv', label: 'MPV (Volumen Plaquetario Medio)', type: 'number', unit: 'fL', referenceValues: '7.5–11.5' }]}, { id: 'observations', label: 'Observaciones', type: 'textarea' }]}];
const MOCK_SERVICES: Service[] = [{ id: 'SRV-1', name: 'Hemograma Completo', price: 25000, description: 'Análisis completo de la sangre.', templateId: 'TPL-HEMO' },{ id: 'SRV-2', name: 'Perfil Lipídico', price: 40000, description: 'Mide colesterol y triglicéridos.' },{ id: 'SRV-3', name: 'Glucosa en Ayunas', price: 15000, description: 'Mide el nivel de azúcar en sangre.' }];
const MOCK_INVENTORY: InventoryItem[] = [{ id: 'INV-1', name: 'Tubos de ensayo (Caja 100u)', quantity: 50, reorderLevel: 10 },{ id: 'INV-2', name: 'Guantes de Nitrilo (Caja 100u)', quantity: 80, reorderLevel: 20 }];


export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- AUTH STATE ---
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
        const item = window.sessionStorage.getItem('biosalud_currentUser');
        return item ? JSON.parse(item) : null;
    } catch (error) {
        console.error("Failed to parse user from sessionStorage", error);
        return null;
    }
  });

  // --- DATA SOURCE STATE ---
  const [dataSource, setDataSource] = useLocalStorage<DataSourceState>('biosalud_dataSource', {
    type: 'local',
    config: null,
    status: 'disconnected',
  });
  
  // --- LOCAL DATA STATE ---
  const [users, setUsers] = useState<User[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [templates, setTemplates] = useState<ResultTemplate[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(MOCK_COMPANY_INFO);
  const [dashboardAnnouncements, setDashboardAnnouncements] = useState<DashboardAnnouncement[]>([]);
  const [dataDeletionPassword, setDataDeletionPassword] = useState<string>('LupitA3193');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // --- DATA SOURCE CONNECTION LOGIC ---
  const dataSourceConfigString = JSON.stringify(dataSource.config);

  useEffect(() => {
    const firebase = (window as any).firebase;
    let isCancelled = false;

    const loadAndConnect = async () => {
        if (firebase && firebase.apps.length) {
            await firebase.app().delete();
        }

        if(isCancelled) return;

        const loadLocalData = () => {
            if(isCancelled) return;
            setUsers(getFromStorage('biosalud_users', MOCK_USERS));
            setPatients(getFromStorage('biosalud_patients', MOCK_PATIENTS));
            setServices(getFromStorage('biosalud_services', MOCK_SERVICES));
            setInventory(getFromStorage('biosalud_inventory', MOCK_INVENTORY));
            setInvoices(getFromStorage('biosalud_invoices', []));
            setResults(getFromStorage('biosalud_results', []));
            setTemplates(getFromStorage('biosalud_templates', MOCK_TEMPLATES));
            setCompanyInfo(getFromStorage('biosalud_company_info', MOCK_COMPANY_INFO));
            setDashboardAnnouncements(getFromStorage('biosalud_announcements', []));
            setDataDeletionPassword(getFromStorage('biosalud_data_deletion_password', 'LupitA3193'));
            setNotifications(getFromStorage('biosalud_notifications', []));
            if(!isCancelled) setDataSource(prev => ({...prev, status: 'connected', error: undefined}));
        };

        const connectFirebase = (config: FirebaseConfig) => {
            if(isCancelled) return;
            try {
                const app = firebase.initializeApp(config);
                const db = app.database();
                
                const dataRefs = {
                    users: db.ref('users'),
                    patients: db.ref('patients'),
                    services: db.ref('services'),
                    inventory: db.ref('inventory'),
                    invoices: db.ref('invoices'),
                    results: db.ref('results'),
                    templates: db.ref('templates'),
                    companyInfo: db.ref('companyInfo'),
                    dashboardAnnouncements: db.ref('dashboardAnnouncements'),
                    dataDeletionPassword: db.ref('dataDeletionPassword'),
                    notifications: db.ref('notifications'),
                };
                
                const mapObjectToArray = (obj: any) => obj ? Object.values(obj) : [];
                const mapObjectToArrayAndReverse = (obj: any) => obj ? Object.values(obj).reverse() : [];
                
                // --- Set up listeners with logic to handle empty DB ---
                dataRefs.users.on('value', snapshot => {
                    if (isCancelled) return;
                    const fbUsers = mapObjectToArray(snapshot.val());
                    if (fbUsers.length === 0) { // If no users in DB, seed with admin
                        const adminUser = MOCK_USERS[0];
                        setUsers([adminUser]);
                        dataRefs.users.child(adminUser.id).set(adminUser);
                    } else {
                        setUsers(fbUsers as User[]);
                    }
                });
                
                dataRefs.companyInfo.on('value', snapshot => {
                    if (isCancelled) return;
                    const fbInfo = snapshot.val();
                    if (!fbInfo) { // If no company info, seed with mock
                        setCompanyInfo(MOCK_COMPANY_INFO);
                        dataRefs.companyInfo.set(MOCK_COMPANY_INFO);
                    } else {
                        setCompanyInfo(fbInfo);
                    }
                });

                dataRefs.patients.on('value', snapshot => !isCancelled && setPatients(mapObjectToArray(snapshot.val()) as Patient[]));
                dataRefs.services.on('value', snapshot => !isCancelled && setServices(mapObjectToArray(snapshot.val()) as Service[]));
                dataRefs.inventory.on('value', snapshot => !isCancelled && setInventory(mapObjectToArray(snapshot.val()) as InventoryItem[]));
                dataRefs.invoices.on('value', snapshot => !isCancelled && setInvoices(mapObjectToArray(snapshot.val()) as Invoice[]));
                dataRefs.results.on('value', snapshot => !isCancelled && setResults(mapObjectToArray(snapshot.val()) as TestResult[]));
                dataRefs.templates.on('value', snapshot => !isCancelled && setTemplates(mapObjectToArray(snapshot.val()) as ResultTemplate[]));
                dataRefs.dashboardAnnouncements.on('value', snapshot => !isCancelled && setDashboardAnnouncements(mapObjectToArrayAndReverse(snapshot.val()) as DashboardAnnouncement[]));
                dataRefs.notifications.on('value', snapshot => !isCancelled && setNotifications(mapObjectToArrayAndReverse(snapshot.val()) as AppNotification[]));
                dataRefs.dataDeletionPassword.on('value', snapshot => !isCancelled && setDataDeletionPassword(snapshot.val() || 'LupitA3193'));
                
                if(!isCancelled) setDataSource(prev => ({...prev, status: 'connected', error: undefined}));
            } catch (e: any) {
                console.error("Firebase connection failed:", e);
                if(!isCancelled) setDataSource(prev => ({...prev, status: 'error', error: e.message}));
            }
        };

        if(!isCancelled) setDataSource(prev => ({ ...prev, status: 'pending' }));
        if (dataSource.type === 'firebase' && dataSource.config) {
            connectFirebase(dataSource.config);
        } else {
            loadLocalData();
        }
    };
    
    loadAndConnect();
    
    return () => {
        isCancelled = true;
        if (firebase && firebase.apps.length) {
            try {
                firebase.database().ref().off();
                firebase.app().delete();
            } catch (e) {
                console.error("Error during firebase cleanup", e);
            }
        }
    };
}, [dataSource.type, dataSourceConfigString]);

  const getDbRef = (path: string) => {
    const firebase = (window as any).firebase;
    if (dataSource.type === 'firebase' && firebase?.apps?.length > 0) {
      return firebase.database().ref(path);
    }
    return null;
  };
  
  // --- SETTINGS CRUD ---
  const updateCompanyInfo = (info: CompanyInfo) => {
    setCompanyInfo(info);
    const ref = getDbRef('companyInfo');
    if (ref) ref.set(info); else setToStorage('biosalud_company_info', info);
    addNotification({ message: 'La información de la empresa ha sido actualizada.' });
  };

  const addDashboardAnnouncement = (announcement: Omit<DashboardAnnouncement, 'id' | 'timestamp'>) => {
    const newAnnouncement: DashboardAnnouncement = { ...announcement, id: `ANNC-${Date.now()}`, timestamp: new Date().toISOString() };
    setDashboardAnnouncements(prev => [newAnnouncement, ...prev]);
    const ref = getDbRef(`dashboardAnnouncements/${newAnnouncement.id}`);
    if (ref) ref.set(newAnnouncement); else setToStorage('biosalud_announcements', [newAnnouncement, ...dashboardAnnouncements]);
  };

  const deleteDashboardAnnouncement = (id: string) => {
    setDashboardAnnouncements(prev => prev.filter(a => a.id !== id));
    const ref = getDbRef(`dashboardAnnouncements/${id}`);
    if (ref) ref.remove(); else setToStorage('biosalud_announcements', dashboardAnnouncements.filter(a => a.id !== id));
  };
  
  // --- DATA DELETION ---
  const updateDataDeletionPassword = (password: string) => {
    setDataDeletionPassword(password);
    const ref = getDbRef('dataDeletionPassword');
    if (ref) ref.set(password); else setToStorage('biosalud_data_deletion_password', password);
  };
  
  const deleteAllCompletedRecords = (password: string): boolean => {
    if (password !== dataDeletionPassword) return false;
    const completedInvoiceIds = invoices.filter(inv => {
      const invResults = results.filter(r => r.invoiceId === inv.id);
      return invResults.length > 0 && invResults.every(r => r.status === 'Completed');
    }).map(inv => inv.id);

    if (completedInvoiceIds.length > 0) {
      const newInvoices = invoices.filter(inv => !completedInvoiceIds.includes(inv.id));
      const newResults = results.filter(res => !completedInvoiceIds.includes(res.invoiceId));
      setInvoices(newInvoices);
      setResults(newResults);
      const ref = getDbRef('/');
      if(ref) { ref.update({ invoices: newInvoices.reduce((o, i) => ({...o, [i.id]: i}), {}), results: newResults.reduce((o, r) => ({...o, [r.id]: r}), {}) });
      } else { setToStorage('biosalud_invoices', newInvoices); setToStorage('biosalud_results', newResults); }
      addNotification({ message: `Se eliminaron ${completedInvoiceIds.length} registros completados.` });
    }
    return true;
  };
  
  const deleteAllRecords = (password: string): boolean => {
    if (password !== dataDeletionPassword) return false;
    const count = invoices.length;
    if (count > 0) {
        setInvoices([]); setResults([]);
        const ref = getDbRef('/');
        if(ref) { ref.update({ invoices: null, results: null });
        } else { setToStorage('biosalud_invoices', []); setToStorage('biosalud_results', []); }
        addNotification({ message: `Se eliminaron TODOS los ${count} registros del sistema.` });
    }
    return true;
  };

  // --- CONFIRMATION MODAL ---
  const showConfirmation = (title: string, message: string, onConfirm: () => void) => { setConfirmationState({ isOpen: true, title, message, onConfirm }); };
  const hideConfirmation = () => { setConfirmationState({ isOpen: false, title: '', message: '', onConfirm: () => {} }); };

  // --- NOTIFICATIONS ---
  const addNotification = (notificationData: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: AppNotification = { ...notificationData, id: `NOTIF-${Date.now()}`, timestamp: new Date().toISOString(), read: false };
    const updatedNotifications = [newNotification, ...notifications].slice(0, 50);
    setNotifications(updatedNotifications);
    const ref = getDbRef(`notifications/${newNotification.id}`);
    if (ref) ref.set(newNotification); else setToStorage('biosalud_notifications', updatedNotifications);
  };
  
  const markAllNotificationsAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    const ref = getDbRef('notifications');
    if (ref) { const updates = updated.reduce((o, n) => ({...o, [n.id]: n}), {}); ref.set(updates);
    } else setToStorage('biosalud_notifications', updated);
  };

  const deleteAllNotifications = () => {
    setNotifications([]);
    const ref = getDbRef('notifications');
    if (ref) {
      ref.remove();
    } else {
      setToStorage('biosalud_notifications', []);
    }
  };

  // --- AUTHENTICATION ---
  const login = (id: string, password: string): boolean => {
    const user = users.find(u => u.id === id && u.password === password);
    if (user) {
      setCurrentUser(user);
      window.sessionStorage.setItem('biosalud_currentUser', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    window.sessionStorage.removeItem('biosalud_currentUser');
  };
  
  // --- USER CRUD ---
  const addUser = (userData: Omit<User, 'isDeletable'>) => {
    const newUser: User = { ...userData, isDeletable: true };
    setUsers(prev => [...prev, newUser]);
    const ref = getDbRef(`users/${newUser.id}`);
    if (ref) ref.set(newUser); else setToStorage('biosalud_users', [...users, newUser]);
    addNotification({ message: `Se registró un nuevo usuario: ${newUser.name}.` });
  };
  const updateUser = (user: User) => {
    setUsers(prev => prev.map(u => u.id === user.id ? user : u));
    if(currentUser?.id === user.id) { setCurrentUser(user); window.sessionStorage.setItem('biosalud_currentUser', JSON.stringify(user)); }
    const ref = getDbRef(`users/${user.id}`);
    if (ref) ref.set(user); else setToStorage('biosalud_users', users.map(u => u.id === user.id ? user : u));
  };
  const deleteUser = (userId: string) => {
    const newUsers = users.filter(u => u.id !== userId && u.isDeletable);
    setUsers(newUsers);
    const ref = getDbRef(`users/${userId}`);
    if(ref) ref.remove(); else setToStorage('biosalud_users', newUsers);
  };

  // --- DATA CRUD (Patient, Service, Inventory, etc.) ---
  const addPatient = (patient: Omit<Patient, 'id'>): Patient => {
    const newPatient: Patient = { ...patient, id: `PAT-${Date.now()}` };
    const updatedPatients = [...patients, newPatient];
    setPatients(updatedPatients);
    const ref = getDbRef(`patients/${newPatient.id}`);
    if (ref) ref.set(newPatient); else setToStorage('biosalud_patients', updatedPatients);
    return newPatient;
  };
  const updatePatient = (patient: Patient) => {
    const updated = patients.map(p => p.id === patient.id ? patient : p);
    setPatients(updated);
    const ref = getDbRef(`patients/${patient.id}`);
    if (ref) ref.set(patient); else setToStorage('biosalud_patients', updated);
  };
  const deletePatient = (patientId: string) => {
    const updated = patients.filter(p => p.id !== patientId);
    setPatients(updated);
    const ref = getDbRef(`patients/${patientId}`);
    if(ref) ref.remove(); else setToStorage('biosalud_patients', updated);
  };
  const getPatientByDocumentId = (docId: string) => patients.find(p => p.documentId === docId);
  
  // Service CRUD
  const addService = (service: Omit<Service, 'id'>) => {
    const newService: Service = { ...service, id: `SRV-${Date.now()}` };
    const updated = [...services, newService];
    setServices(updated);
    const ref = getDbRef(`services/${newService.id}`);
    if(ref) ref.set(newService); else setToStorage('biosalud_services', updated);
  };
  const updateService = (service: Service) => {
    const updated = services.map(s => s.id === service.id ? service : s);
    setServices(updated);
    const ref = getDbRef(`services/${service.id}`);
    if(ref) ref.set(service); else setToStorage('biosalud_services', updated);
  };
  const deleteService = (serviceId: string) => {
    const updated = services.filter(s => s.id !== serviceId);
    setServices(updated);
    const ref = getDbRef(`services/${serviceId}`);
    if(ref) ref.remove(); else setToStorage('biosalud_services', updated);
  };

  // Inventory CRUD
  const addInventoryItem = (item: Omit<InventoryItem, 'id'>) => {
    const newItem: InventoryItem = { ...item, id: `INV-${Date.now()}` };
    const updated = [...inventory, newItem];
    setInventory(updated);
    const ref = getDbRef(`inventory/${newItem.id}`);
    if (ref) ref.set(newItem); else setToStorage('biosalud_inventory', updated);
    if (newItem.quantity <= newItem.reorderLevel) addNotification({ message: `El nuevo ítem '${newItem.name}' se agregó con bajo stock.`, link: '/inventory'});
  };
  const updateInventoryItem = (item: InventoryItem) => {
    const oldItem = inventory.find(i => i.id === item.id);
    const updated = inventory.map(i => i.id === item.id ? item : i);
    setInventory(updated);
    const ref = getDbRef(`inventory/${item.id}`);
    if (ref) ref.set(item); else setToStorage('biosalud_inventory', updated);
    if (item.quantity <= item.reorderLevel && oldItem && oldItem.quantity > oldItem.reorderLevel) addNotification({ message: `El ítem '${item.name}' está bajo en stock.`, link: '/inventory'});
  };
  const deleteInventoryItem = (itemId: string) => {
    const updated = inventory.filter(i => i.id !== itemId);
    setInventory(updated);
    const ref = getDbRef(`inventory/${itemId}`);
    if(ref) ref.remove(); else setToStorage('biosalud_inventory', updated);
  };
  
  // Template CRUD
  const addTemplate = (template: Omit<ResultTemplate, 'id'>) => {
    const newTemplate: ResultTemplate = { ...template, id: `TPL-${Date.now()}` };
    const updated = [...templates, newTemplate];
    setTemplates(updated);
    const ref = getDbRef(`templates/${newTemplate.id}`);
    if(ref) ref.set(newTemplate); else setToStorage('biosalud_templates', updated);
  };
  const updateTemplate = (template: ResultTemplate) => {
    const updated = templates.map(t => t.id === template.id ? template : t);
    setTemplates(updated);
    const ref = getDbRef(`templates/${template.id}`);
    if(ref) ref.set(template); else setToStorage('biosalud_templates', updated);
  };
  const deleteTemplate = (templateId: string) => {
    const updated = templates.filter(t => t.id !== templateId);
    setTemplates(updated);
    const ref = getDbRef(`templates/${templateId}`);
    if(ref) ref.remove(); else setToStorage('biosalud_templates', updated);
  };

  // Invoice & Result Logic
  const createInvoice = (invoiceData: { patientId: string; serviceIds: string[]; discountValue: number; discountType: 'percentage' | 'fixed'; billingType: 'Particular' | 'Dependencia'; showPrices: boolean; }) => {
    const selectedServices: InvoiceService[] = invoiceData.serviceIds.map(id => {
      const service = services.find(s => s.id === id);
      return { serviceId: id, serviceName: service?.name || 'Unknown', price: service?.price || 0 };
    }).filter(s => s.price >= 0);
    if (selectedServices.length === 0) return null;
    const subtotal = selectedServices.reduce((sum, s) => sum + s.price, 0);
    let total = subtotal;
    if (invoiceData.discountValue > 0) total = invoiceData.discountType === 'percentage' ? subtotal * (1 - invoiceData.discountValue / 100) : Math.max(0, subtotal - invoiceData.discountValue);
    const newInvoiceId = `INV-${Date.now()}`;
    const newInvoice: Invoice = { id: newInvoiceId, patientId: invoiceData.patientId, services: selectedServices, subtotal, total, date: new Date().toISOString(), status: 'Pending', discountValue: invoiceData.discountValue, discountType: invoiceData.discountType, billingType: invoiceData.billingType, showPrices: invoiceData.showPrices };
    const newResults: TestResult[] = selectedServices.map(s => { const service = services.find(srv => srv.id === s.serviceId); return { id: `RES-${Date.now()}-${s.serviceId}`, invoiceId: newInvoiceId, patientId: invoiceData.patientId, serviceId: s.serviceId, resultData: service?.templateId ? {} : '', reportedById: null, reportDate: null, status: 'Pending' } });
    const updatedInvoices = [...invoices, newInvoice];
    const updatedResults = [...results, ...newResults];
    setInvoices(updatedInvoices);
    setResults(updatedResults);
    const ref = getDbRef('/');
    if (ref) { ref.update({ [`invoices/${newInvoice.id}`]: newInvoice, ...newResults.reduce((o,r) => ({...o, [`results/${r.id}`]: r}), {}) })
    } else { setToStorage('biosalud_invoices', updatedInvoices); setToStorage('biosalud_results', updatedResults); }
    return newInvoice;
  };
  
  const getInvoiceById = (id: string) => invoices.find(inv => inv.id === id);
  const getTemplateById = (id: string) => templates.find(t => t.id === id);
  const getResultsForInvoice = (invoiceId: string) => results.filter(res => res.invoiceId === invoiceId);

  const updateResult = (resultId: string, data: Partial<Omit<TestResult, 'id' | 'invoiceId' | 'patientId' | 'serviceId'>>) => {
    // The `data` object now contains the status, so we just need to add reportDate if completed.
    const updatedDataWithDate = data.status === 'Completed' 
        ? { ...data, reportDate: new Date().toISOString() }
        : { ...data, reportDate: null }; // Clear date if it becomes pending again

    setResults(prevResults => {
        const newResults = prevResults.map(res => 
            res.id === resultId 
                ? { ...res, ...updatedDataWithDate } 
                : res
        );

        // Check for completion notification logic
        const updatedResult = newResults.find(r => r.id === resultId);
        if (updatedResult) {
            const allComplete = newResults.filter(r => r.invoiceId === updatedResult.invoiceId).every(r => r.status === 'Completed');
            const previouslyAllComplete = prevResults.filter(r => r.invoiceId === updatedResult.invoiceId).every(r => r.status === 'Completed');
            
            if (allComplete && !previouslyAllComplete) {
                const invoiceToNotify = invoices.find(inv => inv.id === updatedResult.invoiceId);
                if (invoiceToNotify) {
                    const patient = patients.find(p => p.id === invoiceToNotify.patientId);
                    addNotification({ 
                        message: `El resultado de ${patient?.name || 'un paciente'} está listo para imprimir.`, 
                        link: `/invoice/print/${invoiceToNotify.id}` 
                    });
                }
            }
        }

        // For local storage, save the entire new array
        if (dataSource.type === 'local') {
            setToStorage('biosalud_results', newResults);
        }

        return newResults;
    });

    // For Firebase, update the specific record
    if (dataSource.type === 'firebase') {
        const ref = getDbRef(`results/${resultId}`);
        if (ref) ref.update(updatedDataWithDate);
    }
  };

  // --- DATA SOURCE MANAGEMENT ---
  const testAndSetDataSource = async (type: DataSourceType, config?: FirebaseConfig): Promise<boolean> => {
    if (type === 'local') {
      setDataSource({ type: 'local', config: null, status: 'connected' });
      return true;
    }
    if (type === 'firebase' && config) {
      const firebase = (window as any).firebase;
      if (firebase.apps.length) await firebase.app().delete();
      try {
        const app = firebase.initializeApp(config);
        await app.database().ref('.info/connected').once('value'); // Test connection
        await app.delete(); // Clean up test app
        setDataSource({ type: 'firebase', config, status: 'connected' });
        return true;
      } catch (error: any) {
        console.error("Firebase test connection failed", error);
        setDataSource(prev => ({...prev, status: 'error', error: error.message}));
        return false;
      }
    }
    return false;
  };

  const migrateToFirebase = async (): Promise<void> => {
    const ref = getDbRef('/');
    if (!ref) {
      addNotification({message: "Error: No se pudo conectar a Firebase para la migración."});
      return;
    }

    const localData = {
      users: getFromStorage('biosalud_users', MOCK_USERS).reduce((o, i) => ({...o, [i.id]: i}), {}),
      patients: getFromStorage('biosalud_patients', MOCK_PATIENTS).reduce((o, i) => ({...o, [i.id]: i}), {}),
      services: getFromStorage('biosalud_services', MOCK_SERVICES).reduce((o, i) => ({...o, [i.id]: i}), {}),
      inventory: getFromStorage('biosalud_inventory', MOCK_INVENTORY).reduce((o, i) => ({...o, [i.id]: i}), {}),
      invoices: getFromStorage('biosalud_invoices', []).reduce((o, i) => ({...o, [i.id]: i}), {}),
      results: getFromStorage('biosalud_results', []).reduce((o, i) => ({...o, [i.id]: i}), {}),
      templates: getFromStorage('biosalud_templates', MOCK_TEMPLATES).reduce((o, i) => ({...o, [i.id]: i}), {}),
      companyInfo: getFromStorage('biosalud_company_info', MOCK_COMPANY_INFO),
      dashboardAnnouncements: getFromStorage('biosalud_announcements', []).reduce((o, i) => ({...o, [i.id]: i}), {}),
      dataDeletionPassword: getFromStorage('biosalud_data_deletion_password', 'LupitA3193'),
      notifications: getFromStorage('biosalud_notifications', []).reduce((o, i) => ({...o, [i.id]: i}), {}),
    };
    
    await ref.set(localData);
  }
  
  return (
    <AppContext.Provider value={{ 
        currentUser, login, logout,
        confirmationState, showConfirmation, hideConfirmation,
        notifications, addNotification, markAllNotificationsAsRead, deleteAllNotifications,
        users, addUser, updateUser, deleteUser,
        companyInfo, updateCompanyInfo,
        dashboardAnnouncements, addDashboardAnnouncement, deleteDashboardAnnouncement,
        updateDataDeletionPassword, deleteAllCompletedRecords, deleteAllRecords,
        dataSource, testAndSetDataSource, migrateToFirebase,
        patients, addPatient, updatePatient, deletePatient, getPatientByDocumentId,
        services, addService, updateService, deleteService,
        inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem,
        invoices, createInvoice, getInvoiceById,
        results, getResultsForInvoice, updateResult,
        templates, addTemplate, updateTemplate, deleteTemplate, getTemplateById
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};