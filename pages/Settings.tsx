import React, { useState, FormEvent } from 'react';
import { useAppContext } from '../context/AppContext';
import type { CompanyInfo, DashboardAnnouncement, FirebaseConfig, DataSourceType } from '../types';
import { DeleteIcon, CheckCircleIcon, AlertTriangleIcon } from '../components/Icons';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';

const InfoIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
);

const ConnectionStatusIndicator: React.FC = () => {
    const { dataSource } = useAppContext();

    if(dataSource.status === 'pending') {
        return (
            <div className="flex items-center gap-2 text-yellow-600">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Conectando...</span>
            </div>
        )
    }

    if(dataSource.status === 'error') {
         return (
            <div className="flex items-center gap-2 text-red-600">
                <AlertTriangleIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Error de conexión</span>
            </div>
        )
    }
    
    return (
        <div className="flex items-center gap-2 text-green-600">
            <CheckCircleIcon className="w-4 h-4"/>
            <span className="text-sm font-medium">
                Conectado a {dataSource.type === 'local' ? 'Almacenamiento Local' : 'Firebase'}
            </span>
        </div>
    )
};

const Settings: React.FC = () => {
    const { 
        companyInfo, updateCompanyInfo,
        dashboardAnnouncements, addDashboardAnnouncement, deleteDashboardAnnouncement,
        addNotification, showConfirmation,
        updateDataDeletionPassword, deleteAllCompletedRecords, deleteAllRecords,
        dataSource, testAndSetDataSource, migrateToFirebase,
        deleteAllNotifications
    } = useAppContext();

    // Local State
    const [info, setInfo] = useState<CompanyInfo>(companyInfo);
    const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '', imageUrl: '' });
    const [showSuccess, setShowSuccess] = useState<string | null>(null);

    // Data Source State
    const [selectedSource, setSelectedSource] = useState<DataSourceType>(dataSource.type);
    const [firebaseConfig, setFirebaseConfig] = useState<FirebaseConfig>(dataSource.config || { apiKey: '', authDomain: '', databaseURL: '', projectId: '', storageBucket: '', messagingSenderId: '', appId: '' });
    const [isTesting, setIsTesting] = useState(false);
    const [connectionError, setConnectionError] = useState('');
    const [showMigrationConfirm, setShowMigrationConfirm] = useState(false);

    // Data Deletion State
    const [actionType, setActionType] = useState<'completed' | 'all' | null>(null);
    const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [newDeletionPassword, setNewDeletionPassword] = useState('');
    
    const flashSuccess = (message: string) => {
        setShowSuccess(message);
        setTimeout(() => setShowSuccess(null), 3000);
    };

    const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => setInfo(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleInfoSubmit = (e: FormEvent) => { e.preventDefault(); updateCompanyInfo(info); flashSuccess('¡Información de la empresa guardada!'); };
    const handleAnnouncementChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNewAnnouncement(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleAddAnnouncement = (e: FormEvent) => { e.preventDefault(); if(newAnnouncement.title && newAnnouncement.message) { addDashboardAnnouncement(newAnnouncement); setNewAnnouncement({ title: '', message: '', imageUrl: '' }); flashSuccess('¡Anuncio publicado!'); } };
    const handleDeleteAnnouncement = (ann: DashboardAnnouncement) => { showConfirmation( 'Confirmar Eliminación', `¿Desea eliminar el anuncio "${ann.title}"?`, () => { deleteDashboardAnnouncement(ann.id); flashSuccess('¡Anuncio eliminado!'); }); };
    
    // --- Data Source Handlers ---
    const handleFirebaseConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFirebaseConfig(prev => ({ ...prev, [e.target.name]: e.target.value.trim() }));
    };

    const handleSaveDataSource = async (e: FormEvent) => {
        e.preventDefault();
        setIsTesting(true);
        setConnectionError('');

        const wasLocal = dataSource.type === 'local';

        const success = await testAndSetDataSource(selectedSource, firebaseConfig);

        if (success) {
            flashSuccess('¡Fuente de datos actualizada exitosamente!');
            // If we switched from local to firebase, ask to migrate data.
            if (wasLocal && selectedSource === 'firebase') {
                setShowMigrationConfirm(true);
            }
        } else {
            setConnectionError('La conexión falló. Por favor, revise las credenciales de Firebase y su conexión a internet.');
        }
        setIsTesting(false);
    };
    
    const handleMigration = () => {
        setShowMigrationConfirm(false);
        showConfirmation(
            'Confirmar Migración',
            'Esto copiará todos sus datos locales (pacientes, servicios, etc.) a Firebase. ¿Desea continuar?',
            async () => {
                await migrateToFirebase();
                flashSuccess('¡Datos migrados a Firebase!');
            }
        )
    }

    // --- Data Deletion Handlers ---
    const handleInitiateDelete = (type: 'completed' | 'all') => { setActionType(type); setIsWarningModalOpen(true); };
    const handleConfirmWarning = () => { setIsWarningModalOpen(false); setPasswordInput(''); setPasswordError(''); setIsPasswordModalOpen(true); };
    const handlePasswordUpdate = (e: FormEvent) => { e.preventDefault(); if (newDeletionPassword) { updateDataDeletionPassword(newDeletionPassword); setNewDeletionPassword(''); flashSuccess('Contraseña de eliminación actualizada.'); } };
    const handlePasswordConfirm = (e: FormEvent) => {
        e.preventDefault(); setPasswordError('');
        const success = actionType === 'completed' ? deleteAllCompletedRecords(passwordInput) : deleteAllRecords(passwordInput);
        if (success) { setIsPasswordModalOpen(false); flashSuccess('¡Datos eliminados exitosamente!'); } 
        else { setPasswordError('Contraseña incorrecta. La eliminación ha sido cancelada.'); }
    };

    const handleClearNotifications = () => {
        showConfirmation(
          'Limpiar Notificaciones',
          '¿Está seguro de que desea eliminar permanentemente todas las notificaciones del sistema para todos los usuarios?',
          () => {
            deleteAllNotifications();
            flashSuccess('Todas las notificaciones han sido eliminadas.');
          }
        );
      };

    return (
        <div className="animate-fadeIn space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-dark-text">Configuración</h2>
                {showSuccess && (
                     <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-3 rounded-md text-sm animate-fadeIn" role="alert">
                         <p className="font-bold">{showSuccess}</p>
                     </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="space-y-8">
                    {/* Data Source Settings */}
                    <div className="bg-light-card p-6 rounded-xl border border-light-border shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-dark-text">Fuente de Datos</h3>
                            <ConnectionStatusIndicator />
                        </div>
                        <form onSubmit={handleSaveDataSource} className="space-y-4">
                            <div className="space-y-3">
                                <label className="p-4 border rounded-lg flex gap-4 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary-50">
                                    <input type="radio" name="dataSource" value="local" checked={selectedSource === 'local'} onChange={() => setSelectedSource('local')} className="mt-1"/>
                                    <div>
                                        <span className="font-semibold text-dark-text">En este dispositivo (Almacenamiento Local)</span>
                                        <p className="text-sm text-dark-subtle">Simple y rápido. Sus datos se guardan en su navegador. Ideal si usará la app en una sola computadora. No podrá acceder a sus datos desde otros dispositivos.</p>
                                    </div>
                                </label>
                                <label className="p-4 border rounded-lg flex gap-4 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary-50">
                                    <input type="radio" name="dataSource" value="firebase" checked={selectedSource === 'firebase'} onChange={() => setSelectedSource('firebase')} className="mt-1"/>
                                    <div>
                                        <span className="font-semibold text-dark-text">En la nube (Firebase Realtime Database)</span>
                                        <p className="text-sm text-dark-subtle">Permite que múltiples usuarios accedan a los mismos datos en tiempo real desde diferentes computadoras. Requiere configuración. Ideal para equipos.</p>
                                    </div>
                                </label>
                            </div>

                            {selectedSource === 'firebase' && (
                                <div className="space-y-4 pt-4 border-t animate-fadeIn">
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                                        <p className="font-semibold mb-1">¿Cómo configurar Firebase?</p>
                                        <ol className="list-decimal list-inside space-y-1">
                                            <li>Cree un proyecto gratis en <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="font-bold underline">firebase.google.com</a>.</li>
                                            <li>En su proyecto, vaya a "Realtime Database", cree una base de datos y en la pestaña "Reglas" establezca `.read` y `.write` a `true` (para empezar).</li>
                                            <li>Vaya a "Configuración del proyecto" (icono de engranaje) y en la sección "Tus apps", cree una "App web" (icono <code>&lt;/&gt;</code>).</li>
                                            <li>Copie los valores de configuración (`apiKey`, `authDomain`, etc.) del objeto `firebaseConfig` que se muestra y péguelos aquí.</li>
                                        </ol>
                                    </div>
                                    <div className="space-y-3">
                                        {(Object.keys(firebaseConfig) as Array<keyof FirebaseConfig>).map(key => (
                                            <div key={key}>
                                                <label className="block text-sm font-medium text-dark-subtle">{key}</label>
                                                <input type="text" name={key} value={firebaseConfig[key]} onChange={handleFirebaseConfigChange} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" required />
                                            </div>
                                        ))}
                                    </div>
                                    {connectionError && <p className="text-sm text-red-600">{connectionError}</p>}
                                </div>
                            )}

                            <div className="flex justify-end pt-2">
                                <button type="submit" disabled={isTesting} className="bg-primary hover:bg-primary-800 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all disabled:bg-gray-400">
                                    {isTesting ? 'Probando...' : 'Probar y Guardar Conexión'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Company Info Card */}
                    <div className="bg-light-card p-6 rounded-xl border border-light-border shadow-sm">
                        <h3 className="text-xl font-semibold text-dark-text mb-4">Información de la Empresa</h3>
                        <form onSubmit={handleInfoSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-dark-subtle">Nombre de la Empresa</label><input type="text" name="name" value={info.name} onChange={handleInfoChange} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" /></div>
                                <div><label className="block text-sm font-medium text-dark-subtle">NIT</label><input type="text" name="nit" value={info.nit} onChange={handleInfoChange} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" /></div>
                            </div>
                            <div><label className="block text-sm font-medium text-dark-subtle">Dirección</label><input type="text" name="address" value={info.address} onChange={handleInfoChange} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" /></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-dark-subtle">Teléfono</label><input type="text" name="phone" value={info.phone} onChange={handleInfoChange} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" /></div>
                                <div><label className="block text-sm font-medium text-dark-subtle">Email</label><input type="email" name="email" value={info.email} onChange={handleInfoChange} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" /></div>
                            </div>
                            <div><label className="block text-sm font-medium text-dark-subtle">Slogan del Pie de Página</label><input type="text" name="footerSlogan" value={info.footerSlogan} onChange={handleInfoChange} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" /></div>
                            <div className="flex justify-end pt-2"><button type="submit" className="bg-primary hover:bg-primary-800 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all">Guardar Información</button></div>
                        </form>
                    </div>
                </div>
                
                <div className="space-y-8">
                    {/* Advanced Data Management */}
                    <div className="bg-light-card p-6 rounded-xl border border-light-border shadow-sm space-y-4">
                        <h3 className="text-xl font-semibold text-dark-text">Gestión de Datos Avanzada</h3>
                        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg"><p className="font-bold">¡Atención!</p><p className="text-sm">Las acciones en esta sección son irreversibles y pueden causar pérdida permanente de datos. Proceda con extrema precaución.</p></div>
                        
                        <div>
                            <h4 className="font-medium text-dark-text">Limpiar Historial de Notificaciones</h4>
                            <p className="text-sm text-dark-subtle mt-1">Elimina todas las notificaciones del sistema. Esta acción no afecta a otros datos y es irreversible.</p>
                            <button onClick={handleClearNotifications} className="mt-2 text-sm bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-3 rounded-lg shadow-md">Eliminar Notificaciones</button>
                        </div>
                        
                        <form onSubmit={handlePasswordUpdate} className="space-y-2 pt-4 border-t border-light-border">
                            <label className="block text-sm font-medium text-dark-subtle">Cambiar Contraseña de Eliminación</label>
                            <div className="flex items-stretch gap-2"><input type="password" value={newDeletionPassword} onChange={e => setNewDeletionPassword(e.target.value)} placeholder="Nueva contraseña" className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" /><button type="submit" disabled={!newDeletionPassword} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all disabled:bg-gray-400">Guardar</button></div>
                        </form>
                        <div className="pt-4 border-t border-light-border space-y-4">
                            <div><h4 className="font-medium text-dark-text">Eliminar Registros Completados</h4><p className="text-sm text-dark-subtle mt-1">Elimina facturas y resultados marcados como 'Completados'.</p><button onClick={() => handleInitiateDelete('completed')} className="mt-2 text-sm bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-lg shadow-md">Eliminar Registros Completados</button></div>
                            <div><h4 className="font-medium text-dark-text">Eliminar Todos los Registros</h4><p className="text-sm text-dark-subtle mt-1">Elimina TODAS las facturas y resultados del sistema.</p><button onClick={() => handleInitiateDelete('all')} className="mt-2 text-sm bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-lg shadow-md">Eliminar TODOS los Registros</button></div>
                        </div>
                    </div>
                    {/* Dashboard Announcements Card */}
                    <div className="bg-light-card p-6 rounded-xl border border-light-border shadow-sm"><h3 className="text-xl font-semibold text-dark-text mb-4">Anuncios del Dashboard</h3><form onSubmit={handleAddAnnouncement} className="space-y-4 pb-6 border-b border-light-border"><div><label className="block text-sm font-medium text-dark-subtle">Título del Anuncio</label><input type="text" name="title" value={newAnnouncement.title} onChange={handleAnnouncementChange} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" required /></div><div><label className="block text-sm font-medium text-dark-subtle">Mensaje</label><textarea name="message" value={newAnnouncement.message} onChange={handleAnnouncementChange} rows={2} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" required /></div><div className="flex justify-end"><button type="submit" className="bg-primary hover:bg-primary-800 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all">Publicar Anuncio</button></div></form><div className="space-y-3 pt-4 max-h-40 overflow-y-auto pr-2">{dashboardAnnouncements.length > 0 ? dashboardAnnouncements.map(ann => (<div key={ann.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"><p className="font-semibold text-dark-text text-sm truncate pr-2">{ann.title}</p><button onClick={() => handleDeleteAnnouncement(ann)} className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-100 transition-colors flex-shrink-0"><DeleteIcon className="w-5 h-5"/></button></div>)) : <p className="text-sm text-center text-dark-subtle py-4">No hay anuncios publicados.</p>}</div></div>
                </div>
            </div>

            {/* Modals */}
            <ConfirmModal isOpen={showMigrationConfirm} onCancel={() => setShowMigrationConfirm(false)} onConfirm={handleMigration} title="Migrar Datos a Firebase" message="Detectamos que cambió a Firebase desde el almacenamiento local. ¿Desea copiar todos sus datos existentes a la nube para no perderlos?" confirmText="Sí, migrar datos" cancelText="No, empezar de cero"/>
            <ConfirmModal isOpen={isWarningModalOpen} onCancel={() => setIsWarningModalOpen(false)} onConfirm={handleConfirmWarning} title={actionType === 'all' ? '¿ESTÁ COMPLETAMENTE SEGURO?' : '¿Seguro que desea continuar?'} message={actionType === 'completed' ? "Está a punto de eliminar todos los registros e informes completados. Esta acción no se puede deshacer." : "Está a punto de eliminar TODOS los registros del sistema, incluyendo los PENDIENTES. Esta acción es irreversible."} confirmText="Sí, entiendo, continuar"/>
            <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title="Confirmación por Contraseña"><form onSubmit={handlePasswordConfirm}><p className="text-dark-subtle mb-4">Para confirmar esta acción, ingrese la contraseña de eliminación de datos.</p><div><label className="block text-sm font-medium text-dark-subtle">Contraseña de Eliminación</label><input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3" autoFocus />{passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}</div><div className="flex justify-end gap-3 pt-6 mt-2"><button type="button" onClick={() => setIsPasswordModalOpen(false)} className="bg-gray-200 hover:bg-gray-300 text-dark-text font-bold py-2 px-4 rounded-lg">Cancelar</button><button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-md">Eliminar Definitivamente</button></div></form></Modal>
        </div>
    );
};

export default Settings;