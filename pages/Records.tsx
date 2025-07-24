import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { ExportIcon } from '../components/Icons';

// Define the type for the combined record for better type safety
interface RecordItem {
    id: string; // invoice id
    dateTime: string;
    patientName: string;
    patientDocument: string;
    patientDependency: string;
    requestedServices: string;
    status: 'Pendiente' | 'Completado';
    total: number;
}

const Records: React.FC = () => {
    const { invoices, patients, getResultsForInvoice } = useAppContext();
    const navigate = useNavigate();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const formatCurrency = (amount: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);

    const combinedRecords = useMemo((): RecordItem[] => {
        return invoices.map(invoice => {
            const patient = patients.find(p => p.id === invoice.patientId);
            const results = getResultsForInvoice(invoice.id);
            // If there are no results for an invoice, it can't be 'Completed'.
            const status: 'Pendiente' | 'Completado' = (results.length > 0 && results.every(r => r.status === 'Completed')) ? 'Completado' : 'Pendiente';
            
            return {
                id: invoice.id,
                dateTime: invoice.date,
                patientName: patient?.name || 'N/A',
                patientDocument: patient?.documentId || 'N/A',
                patientDependency: patient?.dependency || 'N/A',
                requestedServices: invoice.services.map(s => s.serviceName).join(', '),
                status: status,
                total: invoice.total,
            };
        }).sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
    }, [invoices, patients, getResultsForInvoice]);

    const filteredRecords = useMemo(() => {
        return combinedRecords.filter(record => {
            const recordDate = new Date(record.dateTime);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;

            if(start) start.setHours(0,0,0,0);
            if(end) end.setHours(23,59,59,999);

            const lowerCaseSearch = searchTerm.toLowerCase();
            const matchesSearch = searchTerm === '' ||
                record.patientName.toLowerCase().includes(lowerCaseSearch) ||
                record.patientDocument.toLowerCase().includes(lowerCaseSearch) ||
                record.patientDependency.toLowerCase().includes(lowerCaseSearch);

            const matchesDate = (!start || recordDate >= start) && (!end || recordDate <= end);

            return matchesSearch && matchesDate;
        });
    }, [combinedRecords, searchTerm, startDate, endDate]);
    
    const clearFilters = () => {
        setSearchTerm('');
        setStartDate('');
        setEndDate('');
    };

    const exportToExcel = () => {
        const dataToExport = filteredRecords.map(r => ({
            'Fecha y Hora': new Date(r.dateTime).toLocaleString('es-CO'),
            'Paciente': r.patientName,
            'Documento': r.patientDocument,
            'Dependencia': r.patientDependency,
            'Exámenes Solicitados': r.requestedServices,
            'Costo Total': formatCurrency(r.total),
            'Estado': r.status,
        }));

        const ws = (window as any).XLSX.utils.json_to_sheet(dataToExport);
        const wb = (window as any).XLSX.utils.book_new();
        (window as any).XLSX.utils.book_append_sheet(wb, ws, "Registros");
        (window as any).XLSX.writeFile(wb, `registros_biosalud_${new Date().toISOString().slice(0,10)}.xlsx`);
    };

    const exportToPDF = () => {
        const doc = new (window as any).jspdf.jsPDF();
        
        doc.setFontSize(18);
        doc.setTextColor("#007AFF");
        doc.text("BIOSALUD - Reporte de Registros", 14, 22);
        
        const tableColumn = ["Fecha y Hora", "Paciente", "Documento", "Dependencia", "Exámenes", "Costo", "Estado"];
        const tableRows: any[][] = [];

        filteredRecords.forEach(record => {
            const recordData = [
                new Date(record.dateTime).toLocaleString('es-CO'),
                record.patientName,
                record.patientDocument,
                record.patientDependency,
                record.requestedServices,
                formatCurrency(record.total),
                record.status
            ];
            tableRows.push(recordData);
        });

        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 30,
            headStyles: { fillColor: '#007AFF' },
            styles: { cellPadding: 2, fontSize: 8 },
            alternateRowStyles: { fillColor: '#F9FAFB' },
            columnStyles: { 4: { cellWidth: 45 } } // Wider column for exams
        });

        doc.save(`registros_biosalud_${new Date().toISOString().slice(0,10)}.pdf`);
    };

    return (
        <div className="animate-fadeIn">
            <h2 className="text-3xl font-bold text-dark-text mb-6">Registros</h2>

            <div className="bg-light-card p-4 rounded-xl border border-light-border shadow-sm mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
                    <div className="lg:col-span-2 xl:col-span-2">
                        <label className="block text-sm font-medium text-dark-subtle">Buscar por Nombre, Documento o Dependencia</label>
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-dark-subtle">Fecha Inicio</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-dark-subtle">Fecha Fin</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"/>
                    </div>
                    <div className="flex gap-2">
                         <button onClick={clearFilters} className="w-full bg-gray-200 hover:bg-gray-300 text-dark-text font-bold py-2 px-4 rounded-lg transition-all">
                            Limpiar
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-2 mb-4">
                <button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                    <ExportIcon className="w-5 h-5"/> Excel
                </button>
                <button onClick={exportToPDF} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                   <ExportIcon className="w-5 h-5"/> PDF
                </button>
            </div>

            <div className="bg-light-card rounded-xl border border-light-border shadow-sm overflow-x-auto">
                <table className="min-w-full divide-y divide-light-border">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-subtle uppercase tracking-wider">Fecha y Hora</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-subtle uppercase tracking-wider">Paciente</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-subtle uppercase tracking-wider">Documento</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-subtle uppercase tracking-wider">Dependencia</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-subtle uppercase tracking-wider">Exámenes</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-subtle uppercase tracking-wider">Costo Total</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-subtle uppercase tracking-wider">Estado</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-dark-subtle uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-light-border">
                        {filteredRecords.map((record) => (
                            <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-subtle">{new Date(record.dateTime).toLocaleString('es-CO')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-text">{record.patientName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-subtle">{record.patientDocument}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-subtle">{record.patientDependency}</td>
                                <td className="px-6 py-4 text-sm text-dark-subtle truncate max-w-xs">{record.requestedServices}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-subtle">{formatCurrency(record.total)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {record.status === 'Completado' ? (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Completado</span>
                                    ) : (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pendiente</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => navigate(`/invoice/print/${record.id}`)} className="text-primary hover:text-primary-800">
                                        Ver Detalle
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredRecords.length === 0 && (
                    <p className="p-6 text-center text-dark-subtle">
                        No se encontraron registros que coincidan con los filtros aplicados.
                    </p>
                )}
            </div>
        </div>
    );
};

export default Records;