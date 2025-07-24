import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import Modal from '../components/Modal';
import type { TestResult, Invoice, ResultTemplate, TemplateField } from '../types';

interface ResultWithTemplate extends TestResult {
    template?: ResultTemplate;
}

const isResultComplete = (result: ResultWithTemplate): boolean => {
    // Simple text result: complete if not empty.
    if (!result.template) {
        return typeof result.resultData === 'string' && result.resultData.trim() !== '';
    }

    // Structured result: data must be an object
    if (typeof result.resultData !== 'object' || result.resultData === null) {
        return false;
    }
    
    // Recursive check for all fields in the template
    const checkFields = (fields: TemplateField[], data: Record<string, any>): boolean => {
        return fields.every(field => {
            if (field.type === 'group') {
                return checkFields(field.children || [], data);
            }
            // For textareas, any content is fine. For numbers, 0 is a valid result.
            // Check if the key exists and the value is not empty/null/undefined.
            const value = data[field.id];
            return value != null && String(value).trim() !== '';
        });
    };

    return checkFields(result.template.fields, result.resultData as Record<string, any>);
};


const TemplateFieldInput: React.FC<{
    field: TemplateField, 
    value: Record<string, any>, 
    onChange: (fieldId: string, value: any) => void
}> = ({ field, value, onChange }) => {
    const commonClasses = "mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary";
    
    if (field.type === 'group') {
        return (
            <div className="p-4 border border-light-border rounded-lg mt-2 bg-gray-50/50">
                <p className="font-semibold text-dark-text">{field.label}</p>
                <div className="space-y-4 mt-2">
                    {field.children?.map(child => (
                        <TemplateFieldInput key={child.id} field={child} value={value} onChange={onChange} />
                    ))}
                </div>
            </div>
        );
    }
    
    return (
        <div>
            <label className="block text-sm font-medium text-dark-subtle">{field.label} {field.unit && `(${field.unit})`}</label>
            {field.type === 'textarea' ? (
                <textarea
                    rows={4}
                    value={value?.[field.id] || ''}
                    onChange={(e) => onChange(field.id, e.target.value)}
                    className={commonClasses}
                    placeholder={field.referenceValues ? `Valores de referencia: ${field.referenceValues}` : ''}
                />
            ) : (
                <input
                    type={field.type}
                    value={value?.[field.id] || ''}
                    onChange={(e) => onChange(field.id, e.target.value)}
                    className={commonClasses}
                    placeholder={field.referenceValues ? `Ref: ${field.referenceValues}` : ''}
                />
            )}
        </div>
    );
};

const InvoiceTable: React.FC<{
    title: string;
    list: Invoice[];
    patients: any[];
    isPending: boolean;
    onOpenModal: (invoice: Invoice) => void;
    onNavigate: (path: string) => void;
}> = ({ title, list, patients, isPending, onOpenModal, onNavigate }) => (
    <div className="mb-10">
        <h3 className="text-2xl font-bold text-dark-text mb-4">{title}</h3>
        <div className="bg-light-card rounded-xl border border-light-border shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-light-border">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-subtle uppercase tracking-wider">Factura ID</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-subtle uppercase tracking-wider">Paciente</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-subtle uppercase tracking-wider">Fecha</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-subtle uppercase tracking-wider">Estado</th>
                        {isPending && (
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-subtle uppercase tracking-wider">Servicios Facturados</th>
                        )}
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-dark-subtle uppercase tracking-wider">Acción</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-light-border">
                    {list.map((invoice) => {
                        const patient = patients.find(p => p.id === invoice.patientId);
                        return (
                            <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-text">{invoice.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-subtle">{patient?.name || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-subtle">{new Date(invoice.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {isPending ? (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pendiente</span>
                                    ) : (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Completado</span>
                                    )}
                                </td>
                                {isPending && (
                                    <td className="px-6 py-4 text-sm text-dark-subtle max-w-xs truncate" title={invoice.services.map(s => s.serviceName).join(', ')}>
                                        {invoice.services.map(s => s.serviceName).join(', ')}
                                    </td>
                                )}
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {isPending ? (
                                        <button onClick={() => onOpenModal(invoice)} className="text-primary hover:text-primary-800">
                                            Cargar Resultados
                                        </button>
                                    ) : (
                                        <>
                                             <button onClick={() => onOpenModal(invoice)} className="text-primary hover:text-primary-800 mr-4">
                                                Editar
                                            </button>
                                            <button onClick={() => onNavigate(`/invoice/print/${invoice.id}`)} className="text-primary hover:text-primary-800">
                                                Ver / Imprimir
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                     {list.length === 0 && (
                        <tr>
                            <td colSpan={isPending ? 6 : 5} className="p-6 text-center text-dark-subtle">
                                {isPending ? 'No hay resultados pendientes por cargar.' : 'No hay resultados completados.'}
                            </td>
                        </tr>
                     )}
                </tbody>
            </table>
        </div>
    </div>
);

const Results: React.FC = () => {
    const { currentUser, invoices, patients, services, getResultsForInvoice, updateResult, getTemplateById } = useAppContext();
    const navigate = useNavigate();
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [currentResults, setCurrentResults] = useState<ResultWithTemplate[]>([]);
    const [originalResults, setOriginalResults] = useState<ResultWithTemplate[]>([]);
    
    const { pendingInvoices, completedInvoices } = useMemo(() => {
        const pending: Invoice[] = [];
        const completed: Invoice[] = [];
        
        const sortedInvoices = [...invoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        sortedInvoices.forEach(invoice => {
            const results = getResultsForInvoice(invoice.id);
            if (results.length === 0) return;

            if (results.some(r => r.status === 'Pending')) {
                pending.push(invoice);
            } else {
                completed.push(invoice);
            }
        });
        return { pendingInvoices: pending, completedInvoices: completed };
    }, [invoices, getResultsForInvoice]);

    const openModal = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        const invoiceResults = getResultsForInvoice(invoice.id);
        const resultsWithTemplates = invoiceResults.map(res => {
            const service = services.find(s => s.id === res.serviceId);
            const template = service?.templateId ? getTemplateById(service.templateId) : undefined;
            const resultData = (template && (typeof res.resultData !== 'object' || res.resultData === null)) ? {} : res.resultData;
            return { ...res, resultData, template };
        });
        setCurrentResults(resultsWithTemplates);
        setOriginalResults(JSON.parse(JSON.stringify(resultsWithTemplates)));
    };

    const closeModal = () => {
        setSelectedInvoice(null);
        setCurrentResults([]);
        setOriginalResults([]);
    };

    const handleResultChange = (resultId: string, fieldId: string, value: any) => {
        setCurrentResults(prev => prev.map(res => {
            if (res.id === resultId) {
                const newResultData = { ...(res.resultData as Record<string, any>), [fieldId]: value };
                return { ...res, resultData: newResultData };
            }
            return res;
        }));
    };
    
    const handleSimpleResultChange = (resultId: string, value: string) => {
        setCurrentResults(prev => prev.map(res => res.id === resultId ? { ...res, resultData: value } : res));
    };

    const handleSaveResults = () => {
        if (!currentUser) return;

        currentResults.forEach(result => {
            const originalResult = originalResults.find(o => o.id === result.id);

            // Check if data has changed. If originalResult is not found, or if data is different.
            if (!originalResult || JSON.stringify(result.resultData) !== JSON.stringify(originalResult.resultData)) {
                const isNowComplete = isResultComplete(result);
                
                updateResult(result.id, { 
                    resultData: result.resultData,
                    reportedById: currentUser.id,
                    // Pass the new status to updateResult
                    status: isNowComplete ? 'Completed' : 'Pending'
                });
            }
        });
        closeModal();
    };

    return (
        <div className="animate-fadeIn">
            <h2 className="text-3xl font-bold text-dark-text mb-6">Gestión de Resultados</h2>

            <InvoiceTable 
                title="Pendientes" 
                list={pendingInvoices} 
                patients={patients} 
                isPending={true} 
                onOpenModal={openModal} 
                onNavigate={navigate}
            />

            <InvoiceTable 
                title="Completados" 
                list={completedInvoices} 
                patients={patients} 
                isPending={false} 
                onOpenModal={openModal} 
                onNavigate={navigate}
            />

            {selectedInvoice && (
                <Modal title={`Resultados para Factura ${selectedInvoice.id}`} isOpen={!!selectedInvoice} onClose={closeModal}>
                    <div className="space-y-6 max-h-[70vh] overflow-y-auto p-1">
                        {currentResults.map(result => {
                             const service = services.find(s => s.id === result.serviceId);

                             if (result.template) {
                                return (
                                    <div key={result.id} className="p-4 bg-gray-50 rounded-lg">
                                        <h4 className="text-lg font-bold text-dark-text mb-2">{service?.name}</h4>
                                        <div className="space-y-4">
                                            {result.template.fields.map(field => (
                                                <TemplateFieldInput 
                                                    key={field.id} 
                                                    field={field} 
                                                    value={result.resultData as Record<string, any>} 
                                                    onChange={(fieldId, value) => handleResultChange(result.id, fieldId, value)} 
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )
                             }

                             return(
                                <div key={result.id}>
                                    <label className="block text-sm font-semibold text-dark-text">{service?.name}</label>
                                    <textarea
                                        rows={4}
                                        value={typeof result.resultData === 'string' ? result.resultData : ''}
                                        onChange={(e) => handleSimpleResultChange(result.id, e.target.value)}
                                        className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                                        placeholder="Ingrese los hallazgos del examen aquí..."
                                    />
                                </div>
                             )
                        })}
                        <div className="flex justify-end pt-4 sticky bottom-0 bg-light-card pb-1">
                            <button onClick={handleSaveResults} className="bg-primary hover:bg-primary-800 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all">
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Results;