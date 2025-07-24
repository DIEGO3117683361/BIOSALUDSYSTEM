
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import Modal from '../components/Modal';
import { EditIcon, DeleteIcon } from '../components/Icons';
import type { Service } from '../types';

const Services: React.FC = () => {
    const { services, addService, updateService, deleteService, templates, showConfirmation } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [serviceData, setServiceData] = useState<Omit<Service, 'id'>>({
        name: '', price: 0, description: '', templateId: ''
    });

    const formatCurrency = (amount: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setServiceData(prev => ({ ...prev, [name]: name === 'price' ? parseFloat(value) || 0 : value }));
    };

    const openAddModal = () => {
        setEditingService(null);
        setServiceData({ name: '', price: 0, description: '', templateId: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (service: Service) => {
        setEditingService(service);
        setServiceData(service);
        setIsModalOpen(true);
    };

    const handleDelete = (service: Service) => {
        showConfirmation(
            'Confirmar Eliminación',
            `¿Está seguro de que desea eliminar el servicio ${service.name}?`,
            () => deleteService(service.id)
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingService) {
            updateService({ ...serviceData, id: editingService.id });
        } else {
            addService(serviceData);
        }
        setIsModalOpen(false);
    };

    return (
        <div className="animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-dark-text">Servicios y Exámenes</h2>
                <button
                    onClick={openAddModal}
                    className="bg-primary hover:bg-primary-800 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all"
                >
                    Agregar Servicio
                </button>
            </div>

            <div className="bg-light-card rounded-xl border border-light-border shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-light-border">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-subtle uppercase tracking-wider">Nombre del Servicio</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-subtle uppercase tracking-wider">Precio</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-subtle uppercase tracking-wider">Descripción</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-subtle uppercase tracking-wider">Plantilla</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-dark-subtle uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-light-border">
                        {services.map((service) => {
                            const template = templates.find(t => t.id === service.templateId);
                            return (
                                <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-text">{service.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-subtle">{formatCurrency(service.price)}</td>
                                    <td className="px-6 py-4 text-sm text-dark-subtle">{service.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-subtle">{template?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => openEditModal(service)} className="text-primary hover:text-primary-800 p-1 rounded-md hover:bg-gray-100 transition-colors">
                                                <EditIcon className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleDelete(service)} className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-gray-100 transition-colors">
                                                <DeleteIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            <Modal title={editingService ? 'Editar Servicio' : 'Agregar Nuevo Servicio'} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-dark-subtle">Nombre del Servicio</label>
                        <input type="text" name="name" value={serviceData.name} onChange={handleInputChange} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-dark-subtle">Precio (COP)</label>
                        <input type="number" name="price" value={serviceData.price} onChange={handleInputChange} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-dark-subtle">Descripción</label>
                        <textarea name="description" value={serviceData.description} onChange={handleInputChange} rows={3} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-dark-subtle">Plantilla de Resultado (Opcional)</label>
                        <select name="templateId" value={serviceData.templateId} onChange={handleInputChange} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 bg-white focus:outline-none focus:ring-primary focus:border-primary">
                            <option value="">Ninguna</option>
                            {templates.map(template => (
                                <option key={template.id} value={template.id}>{template.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="submit" className="bg-primary hover:bg-primary-800 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all">
                            {editingService ? 'Guardar Cambios' : 'Guardar Servicio'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Services;
