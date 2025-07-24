
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import type { TemplateField, ResultTemplate } from '../types';

const StructuredResultRow: React.FC<{field: TemplateField, data: Record<string, any>}> = ({ field, data }) => {
    const value = data?.[field.id] ?? 'N/A';

    if (field.type === 'group') {
        return (
            <>
                <tr>
                    <td colSpan={3} className="py-3 px-4 bg-gray-100 font-bold text-gray-700">{field.label}</td>
                </tr>
                {field.children?.map(child => <StructuredResultRow key={child.id} field={child} data={data} />)}
            </>
        )
    }

    if(field.type === 'textarea') {
         return (
            <tr>
                <td colSpan={3} className="py-3 px-4">
                    <p className="font-semibold text-gray-700">{field.label}</p>
                    <p className="text-gray-600 whitespace-pre-wrap mt-1">{value}</p>
                </td>
            </tr>
         )
    }
    
    return (
        <tr className="border-b border-gray-200">
            <td className="py-2 px-4 text-gray-600">{field.label}</td>
            <td className="py-2 px-4 font-medium text-center text-gray-800">{value} {field.unit}</td>
            <td className="py-2 px-4 text-sm text-gray-500 text-right">{field.referenceValues}</td>
        </tr>
    )
}

const ProfessionalSignatureBlock: React.FC<{userId: string | null}> = ({ userId }) => {
    const { users } = useAppContext();
    if (!userId) return null;
    
    const professional = users.find(u => u.id === userId);
    if (!professional) return null;

    return (
        <div className="mt-4 text-right">
            <div className="inline-block text-center">
                {professional.signature && <img src={professional.signature} alt="Firma" className="h-16 mx-auto mb-1 object-contain" />}
                <p className="font-bold text-gray-700 text-sm border-t border-gray-300 pt-1 w-56 mx-auto">{professional.name}</p>
                {professional.professionalTitle && <p className="text-xs text-gray-500">{professional.professionalTitle}</p>}
                {professional.professionalRegistration && <p className="text-xs text-gray-500">Reg. Prof: {professional.professionalRegistration}</p>}
            </div>
        </div>
    )
}

const PrintableInvoice: React.FC = () => {
    const { invoiceId } = useParams<{ invoiceId: string }>();
    const navigate = useNavigate();
    const { getInvoiceById, patients, services, getResultsForInvoice, getTemplateById, companyInfo } = useAppContext();

    const formatCurrency = (amount: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);

    const invoice = invoiceId ? getInvoiceById(invoiceId) : undefined;
    const patient = invoice ? patients.find(p => p.id === invoice.patientId) : undefined;
    const results = invoice ? getResultsForInvoice(invoice.id) : [];

    useEffect(() => {
        if (!invoice) return;
        // Auto-print logic can be disruptive during development, enable if needed
        // setTimeout(() => window.print(), 500);
    }, [invoiceId, invoice]);

    if (!invoice || !patient) {
        return <div className="p-10 text-center">Factura no encontrada.</div>;
    }

    const hasCompletedResults = results.some(r => r.status === 'Completed');
    const shouldShowPrices = invoice.showPrices ?? !hasCompletedResults; // Show prices by default on old invoices or if not specified, unless results are ready

    const getDiscountAmount = () => {
        if (!invoice.discountValue || !invoice.subtotal) return 0;
        if (invoice.discountType === 'percentage') {
            return invoice.subtotal * (invoice.discountValue / 100);
        }
        return invoice.discountValue;
    }
    const discountAmount = getDiscountAmount();

    return (
        <div className="bg-gray-100 min-h-screen">
            <div className="fixed top-4 left-4 print:hidden flex gap-2">
                <button onClick={() => navigate(-1)} className="bg-primary text-white py-2 px-4 rounded-lg shadow-lg">Volver</button>
                <button onClick={() => window.print()} className="bg-gray-600 text-white py-2 px-4 rounded-lg shadow-lg">Imprimir</button>
            </div>
            <div className="p-4 md:p-8 max-w-4xl mx-auto bg-white shadow-lg print:shadow-none" id="invoice-content">
                <header className="flex justify-between items-center pb-6 border-b-2 border-gray-200">
                    <div>
                        <h1 className="text-4xl font-extrabold text-primary">{companyInfo.name}</h1>
                        <p className="text-gray-500">NIT: {companyInfo.nit}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl font-bold text-gray-800">{hasCompletedResults ? 'INFORME DE RESULTADOS' : 'FACTURA'}</h2>
                        <p className="text-gray-500">ID: {invoice.id}</p>
                    </div>
                </header>

                <section className="grid grid-cols-2 gap-8 my-8">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Paciente</h3>
                        <p className="font-bold text-lg text-gray-800">{patient.name}</p>
                        <p className="text-gray-600">ID: {patient.documentId}</p>
                        <p className="text-gray-600">Dirección: {patient.address}</p>
                        {invoice.billingType === 'Dependencia' && <p className="text-gray-600">Dependencia: {patient.dependency}</p>}
                        {invoice.billingType === 'Particular' && <p className="text-gray-600">Tipo: Particular</p>}
                        <p className="text-gray-600">Email: {patient.email}</p>
                        <p className="text-gray-600">Teléfono: {patient.phone}</p>
                    </div>
                    <div className="text-right">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Detalles del Documento</h3>
                        <p className="text-gray-600">Fecha de Emisión: {new Date(invoice.date).toLocaleDateString()}</p>
                        {hasCompletedResults && results.find(r => r.reportDate) && (
                             <p className="text-gray-600">Fecha de Informe: {new Date(results.find(r => r.reportDate)!.reportDate!).toLocaleDateString()}</p>
                        )}
                    </div>
                </section>

                <section>
                    <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">
                        {hasCompletedResults ? 'Resultados de Exámenes' : 'Servicios Solicitados'}
                    </h3>
                    {!hasCompletedResults && (
                        <table className="w-full text-left">
                           <thead>
                                <tr className="bg-gray-100 text-gray-600 uppercase text-sm">
                                    <th className="py-3 px-4 font-semibold">Servicio</th>
                                    {shouldShowPrices && <th className="py-3 px-4 font-semibold text-right">Precio</th>}
                                </tr>
                            </thead>
                             <tbody>
                                {invoice.services.map((service, index) => (
                                    <tr key={index} className="border-b border-gray-200">
                                        <td className="py-4 px-4 font-medium text-gray-700">{service.serviceName}</td>
                                        {shouldShowPrices && <td className="py-4 px-4 text-right font-medium text-gray-700">{formatCurrency(service.price)}</td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    
                    {hasCompletedResults && (
                        <div className="space-y-8">
                            {invoice.services.map((serviceItem) => {
                                const result = results.find(r => r.serviceId === serviceItem.serviceId);
                                if (!result || result.status !== 'Completed') return null;

                                const service = services.find(s => s.id === serviceItem.serviceId);
                                const template = service?.templateId ? getTemplateById(service.templateId) : undefined;
                                const isStructured = typeof result.resultData === 'object' && result.resultData !== null && template;

                                return (
                                    <div key={serviceItem.serviceId}>
                                        <h4 className="text-xl font-bold text-primary bg-primary-50 p-3 rounded-t-lg">{serviceItem.serviceName}</h4>
                                        <div className="border border-t-0 border-gray-200 rounded-b-lg">
                                            {isStructured ? (
                                                <table className="w-full text-left">
                                                    <thead className="bg-gray-100 text-gray-600 uppercase text-sm">
                                                        <tr>
                                                            <th className="py-2 px-4 font-semibold">Parámetro</th>
                                                            <th className="py-2 px-4 font-semibold text-center">Resultado</th>
                                                            <th className="py-2 px-4 font-semibold text-right">Valores de Referencia</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {template.fields.map(field => <StructuredResultRow key={field.id} field={field} data={result.resultData as Record<string,any>} />)}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <div className="p-4">
                                                    <p className="whitespace-pre-wrap text-gray-700">{result.resultData as string || 'Sin datos'}</p>
                                                </div>
                                            )}
                                            {result.status === 'Completed' && result.reportedById && (
                                                <div className="p-4 border-t border-gray-200">
                                                    <ProfessionalSignatureBlock userId={result.reportedById} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </section>
                
                {shouldShowPrices && !hasCompletedResults && (
                <section className="mt-8 flex justify-end">
                    <div className="w-full max-w-xs space-y-2">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>{formatCurrency(invoice.subtotal ?? invoice.total)}</span>
                        </div>
                        {discountAmount > 0 && (
                            <div className="flex justify-between text-red-600">
                                <span>Descuento ({invoice.discountType === 'percentage' ? `${invoice.discountValue}%` : formatCurrency(invoice.discountValue || 0)})</span>
                                <span>-{formatCurrency(discountAmount)}</span>
                            </div>
                        )}
                        <div className="border-t-2 border-gray-200 my-2"></div>
                        <div className="flex justify-between font-bold text-xl text-gray-800">
                            <span>Total a Pagar</span>
                            <span>{formatCurrency(invoice.total)}</span>
                        </div>
                    </div>
                </section>
                )}

                <footer className="mt-12 pt-6 border-t-2 border-gray-200 text-center text-gray-500 text-sm">
                    <p>{companyInfo.footerSlogan}</p>
                    <p>{companyInfo.address} | {companyInfo.phone} | {companyInfo.email}</p>
                </footer>
            </div>
        </div>
    );
};

export default PrintableInvoice;
