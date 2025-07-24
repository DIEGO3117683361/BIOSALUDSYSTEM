
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import Modal from '../components/Modal';
import type { Patient } from '../types';

const PatientForm: React.FC<{
    patientData: Omit<Patient, 'id'>, 
    onDataChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void,
    isNew: boolean,
    docId?: string
}> = ({ patientData, onDataChange, isNew, docId }) => (
    <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-dark-subtle">Nombre Completo</label>
                <input type="text" name="name" value={patientData.name} onChange={onDataChange} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-dark-subtle">Nº Documento de Identidad</label>
                <input type="text" name="documentId" value={isNew ? docId : patientData.documentId} disabled className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 bg-gray-100" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-dark-subtle">Fecha de Nacimiento</label>
                <input type="date" name="dob" value={patientData.dob} onChange={onDataChange} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-dark-subtle">Género</label>
                <select name="gender" value={patientData.gender} onChange={onDataChange} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary bg-white">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                </select>
            </div>
        </div>
        <div>
            <label className="block text-sm font-medium text-dark-subtle">Dirección</label>
            <input type="text" name="address" value={patientData.address} onChange={onDataChange} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
        </div>
        <div>
            <label className="block text-sm font-medium text-dark-subtle">Dependencia (Empresa, Seguro, etc.)</label>
            <input type="text" name="dependency" value={patientData.dependency} onChange={onDataChange} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
        </div>
            <div>
            <label className="block text-sm font-medium text-dark-subtle">Teléfono</label>
            <input type="tel" name="phone" value={patientData.phone} onChange={onDataChange} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
        </div>
        <div>
            <label className="block text-sm font-medium text-dark-subtle">Email</label>
            <input type="email" name="email" value={patientData.email} onChange={onDataChange} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" required />
        </div>
    </>
);


const Billing: React.FC = () => {
    const { services, createInvoice, getPatientByDocumentId, addPatient } = useAppContext();
    const navigate = useNavigate();
    
    // Patient state
    const [patientDocId, setPatientDocId] = useState('');
    const [foundPatient, setFoundPatient] = useState<Patient | null | undefined>(undefined); // undefined: not searched, null: not found
    const [confirmedPatient, setConfirmedPatient] = useState<Patient | null>(null);
    const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
    const [newPatientData, setNewPatientData] = useState<Omit<Patient, 'id'>>({ name: '', documentId: '', dob: '', gender: 'Other', phone: '', email: '', address: '', dependency: '' });
    
    // Invoice state
    const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('fixed');
    const [discountValue, setDiscountValue] = useState(0);
    const [billingType, setBillingType] = useState<'Particular' | 'Dependencia'>('Particular');
    const [showPrices, setShowPrices] = useState(true);

    // UI State
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState('');

    const formatCurrency = (amount: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);

    const handleSearchPatient = () => {
        if (!patientDocId) return;
        const patient = getPatientByDocumentId(patientDocId);
        setFoundPatient(patient || null);
    };
    
    const handleResetPatientSelection = () => {
        setConfirmedPatient(null);
        setFoundPatient(undefined);
        setPatientDocId('');
    };
    
    const handleNewPatientDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewPatientData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSaveNewPatient = (e: React.FormEvent) => {
        e.preventDefault();
        const createdPatient = addPatient({ ...newPatientData, documentId: patientDocId });
        setConfirmedPatient(createdPatient);
        setIsNewPatientModalOpen(false);
        setNewPatientData({ name: '', documentId: '', dob: '', gender: 'Other', phone: '', email: '', address: '', dependency: '' });
    };

    const handleServiceToggle = (serviceId: string) => {
        setError('');
        setSelectedServices(prev => {
            const newSet = new Set(prev);
            if (newSet.has(serviceId)) newSet.delete(serviceId);
            else newSet.add(serviceId);
            return newSet;
        });
    };

    const { subtotal, discountAmount, total } = useMemo(() => {
        const currentServices = Array.from(selectedServices).map(id => services.find(s => s.id === id)).filter(Boolean) as any[];
        const sub = currentServices.reduce((sum, service) => sum + service.price, 0);
        let disc = 0;
        if (discountValue > 0) {
            disc = discountType === 'percentage' ? sub * (discountValue / 100) : discountValue;
        }
        const finalTotal = Math.max(0, sub - disc);
        return { subtotal: sub, discountAmount: disc, total: finalTotal };
    }, [selectedServices, services, discountType, discountValue]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!confirmedPatient || selectedServices.size === 0) {
            setError("Por favor seleccione un paciente y al menos un servicio.");
            return;
        }
        const newInvoice = createInvoice({ 
            patientId: confirmedPatient.id, 
            serviceIds: Array.from(selectedServices),
            discountType,
            discountValue: parseFloat(discountValue.toString()) || 0,
            billingType,
            showPrices
        });
        if (newInvoice) {
            setShowSuccess(true);
            setTimeout(() => {
                 navigate(`/invoice/print/${newInvoice.id}`);
            }, 1500);
        }
    };

    return (
        <div className="animate-fadeIn">
            <h2 className="text-3xl font-bold text-dark-text mb-6">Nueva Factura</h2>
            
            {showSuccess && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md" role="alert">
                    <p className="font-bold">Éxito</p>
                    <p>Factura generada correctamente. Redirigiendo para impresión...</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Patient Selection */}
                    <div className="bg-light-card p-6 rounded-xl border border-light-border shadow-sm">
                        <h3 className="text-xl font-semibold text-dark-text mb-4">1. Seleccionar Paciente</h3>
                        {confirmedPatient ? (
                            <div className="bg-primary-50 p-4 rounded-lg flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-primary">{confirmedPatient.name}</p>
                                    <p className="text-sm text-dark-subtle">ID: {confirmedPatient.documentId}</p>
                                </div>
                                <button onClick={handleResetPatientSelection} type="button" className="font-semibold text-sm text-primary hover:underline">Cambiar</button>
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-end gap-2">
                                    <div className="flex-grow">
                                        <label htmlFor="docId" className="block text-sm font-medium text-dark-subtle">Documento de Identidad</label>
                                        <input id="docId" type="text" value={patientDocId} onChange={(e) => setPatientDocId(e.target.value)} placeholder="Ingrese el documento..." className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"/>
                                    </div>
                                    <button onClick={handleSearchPatient} type="button" className="bg-primary hover:bg-primary-800 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all">Buscar</button>
                                </div>
                                {foundPatient === null && (
                                    <div className="mt-4 text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <p className="text-sm text-yellow-800">Paciente no encontrado.</p>
                                        <button onClick={() => setIsNewPatientModalOpen(true)} type="button" className="mt-2 font-bold text-primary hover:underline">Registrar Nuevo Paciente</button>
                                    </div>
                                )}
                                {foundPatient && (
                                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                                        <p className="text-sm text-green-800 font-medium">Paciente encontrado: <span className="font-bold">{foundPatient.name}</span></p>
                                        <div>
                                            <button onClick={() => setConfirmedPatient(foundPatient)} type="button" className="bg-green-600 text-white py-1 px-3 rounded-md text-sm font-bold hover:bg-green-700">Confirmar</button>
                                            <button onClick={() => setFoundPatient(undefined)} type="button" className="ml-2 text-sm text-gray-600 hover:underline">Cancelar</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Service Selection */}
                    <div className="bg-light-card p-6 rounded-xl border border-light-border shadow-sm">
                        <h3 className="text-xl font-semibold text-dark-text mb-4">2. Seleccionar Servicios</h3>
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                            {services.map(service => (
                                <label key={service.id} className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${confirmedPatient ? 'hover:bg-gray-100 bg-gray-50' : 'bg-gray-200 opacity-50'}`}>
                                    <div>
                                        <p className="font-medium text-dark-text">{service.name}</p>
                                        <p className="text-sm text-dark-subtle">{service.description}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <p className="font-semibold text-primary">{formatCurrency(service.price)}</p>
                                        <input type="checkbox" checked={selectedServices.has(service.id)} onChange={() => handleServiceToggle(service.id)} className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary" disabled={!confirmedPatient}/>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Summary */}
                <div className="lg:col-span-1">
                     <div className="bg-light-card p-6 rounded-xl border border-light-border shadow-sm sticky top-8">
                        <h3 className="text-xl font-semibold text-dark-text mb-4">Resumen y Opciones</h3>
                        <div className="space-y-2 mb-4 min-h-[80px]">
                            {Array.from(selectedServices).length > 0 ? Array.from(selectedServices).map(id => services.find(s => s.id === id)).map(s => s && (
                                <div key={s.id} className="flex justify-between text-sm">
                                    <span className="text-dark-subtle truncate pr-2">{s.name}</span>
                                    <span className="font-medium text-dark-text">{formatCurrency(s.price)}</span>
                                </div>
                            )) : <p className="text-dark-subtle text-sm">Seleccione un paciente y servicios.</p>}
                        </div>

                        <div className="border-t border-light-border pt-4 mt-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-dark-subtle mb-2">Tipo de Facturación</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2"><input type="radio" name="billingType" value="Particular" checked={billingType === 'Particular'} onChange={(e) => setBillingType(e.target.value as any)} className="text-primary focus:ring-primary"/> Particular</label>
                                    <label className="flex items-center gap-2"><input type="radio" name="billingType" value="Dependencia" checked={billingType === 'Dependencia'} onChange={(e) => setBillingType(e.target.value as any)} className="text-primary focus:ring-primary"/> Dependencia</label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark-subtle">Descuento</label>
                                <div className="flex gap-2 mt-1">
                                    <select value={discountType} onChange={(e) => setDiscountType(e.target.value as any)} className="w-1/3 border border-light-border rounded-md shadow-sm py-2 px-3 bg-white focus:outline-none focus:ring-primary focus:border-primary">
                                        <option value="fixed">$</option>
                                        <option value="percentage">%</option>
                                    </select>
                                    <input type="number" value={discountValue} onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)} className="w-2/3 border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"/>
                                </div>
                            </div>
                            <label className="flex items-center gap-2 pt-2"><input type="checkbox" checked={showPrices} onChange={(e) => setShowPrices(e.target.checked)} className="h-4 w-4 rounded text-primary focus:ring-primary"/> Mostrar precios en factura</label>
                        </div>
                        
                        <div className="border-t border-light-border pt-4 mt-4 space-y-1">
                            <div className="flex justify-between text-sm"><span className="text-dark-subtle">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                            {discountAmount > 0 && <div className="flex justify-between text-sm text-red-600"><span className="text-dark-subtle">Descuento</span><span>-{formatCurrency(discountAmount)}</span></div>}
                             <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{formatCurrency(total)}</span></div>
                        </div>

                        {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
                        <button type="submit" className="w-full mt-6 bg-primary hover:bg-primary-800 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all disabled:bg-gray-400" disabled={!confirmedPatient || total < 0 || selectedServices.size === 0}>
                            Generar Factura
                        </button>
                    </div>
                </div>
            </form>
            
            <Modal title="Registrar Nuevo Paciente" isOpen={isNewPatientModalOpen} onClose={() => setIsNewPatientModalOpen(false)}>
                <form onSubmit={handleSaveNewPatient} className="space-y-4">
                    <PatientForm patientData={newPatientData} onDataChange={handleNewPatientDataChange} isNew={true} docId={patientDocId} />
                    <div className="flex justify-end pt-4">
                        <button type="submit" className="bg-primary hover:bg-primary-800 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all">
                            Guardar Paciente
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Billing;