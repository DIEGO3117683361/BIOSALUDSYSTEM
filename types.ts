
export interface Patient {
  id: string;
  name: string;
  documentId: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email: string;
  address: string;
  dependency: string;
}

export interface TemplateField {
  id: string;
  label: string;
  type: 'group' | 'number' | 'textarea';
  referenceValues?: string;
  unit?: string;
  children?: TemplateField[]; // For 'group' type
}

export interface ResultTemplate {
  id: string;
  name: string;
  fields: TemplateField[];
}

export interface Service {
  id: string;
  name: string;
  price: number;
  description: string;
  templateId?: string;
}

export interface InventoryItem {
  id:string;
  name: string;
  quantity: number;
  reorderLevel: number;
}

export interface InvoiceService {
  serviceId: string;
  serviceName: string;
  price: number;
}

export interface Invoice {
  id: string;
  patientId: string;
  services: InvoiceService[];
  total: number; // This will be the final price after discount
  date: string;
  status: 'Pending' | 'Paid';
  // New optional fields
  subtotal?: number;
  discountValue?: number;
  discountType?: 'percentage' | 'fixed';
  billingType?: 'Particular' | 'Dependencia';
  showPrices?: boolean;
}

export interface TestResult {
  id: string;
  invoiceId: string;
  patientId: string;
  serviceId: string;
  resultData: string | Record<string, any>; // Can be simple text or structured data
  reportedById: string | null; // User ID of professional
  reportDate: string | null;
  status: 'Pending' | 'Completed';
}

// User and Permission Types
export const ALL_PERMISSIONS = {
  dashboard: 'Dashboard',
  patients: 'Pacientes',
  services: 'Servicios',
  billing: 'Facturación',
  records: 'Registros',
  results: 'Resultados',
  templates: 'Plantillas',
  inventory: 'Inventario',
  users: 'Gestión de Usuarios',
  settings: 'Configuración',
} as const;


export type PermissionKey = keyof typeof ALL_PERMISSIONS;

export interface User {
  id: string; // documentId
  name: string;
  password: string;
  permissions: PermissionKey[];
  isDeletable: boolean;
  // Professional Details
  isProfessional?: boolean;
  professionalTitle?: string;
  professionalRegistration?: string;
  signature?: string; // Base64 Data URL for image
}

// --- NEW TYPES ---

export interface CompanyInfo {
  name: string;
  nit: string;
  address: string;
  phone: string;
  email: string;
  footerSlogan: string;
}

export interface DashboardAnnouncement {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  imageUrl?: string;
}


export interface AppNotification {
  id: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

export interface ConfirmationState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

// --- DATA SOURCE TYPES ---
export type DataSourceType = 'local' | 'firebase';
export type ConnectionStatus = 'connected' | 'disconnected' | 'pending' | 'error';

export interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
}

export interface DataSourceState {
    type: DataSourceType;
    config: FirebaseConfig | null;
    status: ConnectionStatus;
    error?: string;
}


export interface AppContextType {
  // Authentication
  currentUser: User | null;
  login: (id: string, password: string) => boolean;
  logout: () => void;

  // Confirmation Modal
  confirmationState: ConfirmationState;
  showConfirmation: (title: string, message: string, onConfirm: () => void) => void;
  hideConfirmation: () => void;

  // Notifications
  notifications: AppNotification[];
  addNotification: (notificationData: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAllNotificationsAsRead: () => void;
  deleteAllNotifications: () => void;
  
  // User Management
  users: User[];
  addUser: (user: Omit<User, 'isDeletable'>) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;

  // App Settings
  companyInfo: CompanyInfo;
  updateCompanyInfo: (info: CompanyInfo) => void;
  dashboardAnnouncements: DashboardAnnouncement[];
  addDashboardAnnouncement: (announcement: Omit<DashboardAnnouncement, 'id' | 'timestamp'>) => void;
  deleteDashboardAnnouncement: (id: string) => void;
  updateDataDeletionPassword: (password: string) => void;
  deleteAllCompletedRecords: (password: string) => boolean;
  deleteAllRecords: (password: string) => boolean;

  // Data Source Management
  dataSource: DataSourceState;
  testAndSetDataSource: (type: DataSourceType, config?: FirebaseConfig) => Promise<boolean>;
  migrateToFirebase: () => Promise<void>;

  // Existing Data
  patients: Patient[];
  addPatient: (patient: Omit<Patient, 'id'>) => Patient;
  updatePatient: (patient: Patient) => void;
  deletePatient: (patientId: string) => void;
  getPatientByDocumentId: (docId: string) => Patient | undefined;
  services: Service[];
  addService: (service: Omit<Service, 'id'>) => void;
  updateService: (service: Service) => void;
  deleteService: (serviceId: string) => void;
  inventory: InventoryItem[];
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (item: InventoryItem) => void;
  deleteInventoryItem: (itemId: string) => void;
  invoices: Invoice[];
  createInvoice: (invoiceData: { 
    patientId: string; 
    serviceIds: string[];
    discountValue: number;
    discountType: 'percentage' | 'fixed';
    billingType: 'Particular' | 'Dependencia';
    showPrices: boolean;
  }) => Invoice | null;
  getInvoiceById: (id: string) => Invoice | undefined;
  results: TestResult[];
  getResultsForInvoice: (invoiceId: string) => TestResult[];
  updateResult: (resultId: string, data: Partial<Omit<TestResult, 'id' | 'invoiceId' | 'patientId' | 'serviceId'>>) => void;
  templates: ResultTemplate[];
  addTemplate: (template: Omit<ResultTemplate, 'id'>) => void;
  updateTemplate: (template: ResultTemplate) => void;
  deleteTemplate: (templateId: string) => void;
  getTemplateById: (id: string) => ResultTemplate | undefined;
}