
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import Modal from '../components/Modal';
import { EditIcon, DeleteIcon } from '../components/Icons';
import type { InventoryItem } from '../types';

const Inventory: React.FC = () => {
    const { inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, showConfirmation } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [itemData, setItemData] = useState<Omit<InventoryItem, 'id'>>({
        name: '', quantity: 0, reorderLevel: 0
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setItemData(prev => ({ ...prev, [name]: name === 'name' ? value : parseInt(value) || 0 }));
    };
    
    const openAddModal = () => {
        setEditingItem(null);
        setItemData({ name: '', quantity: 0, reorderLevel: 0 });
        setIsModalOpen(true);
    };

    const openEditModal = (item: InventoryItem) => {
        setEditingItem(item);
        setItemData(item);
        setIsModalOpen(true);
    };

    const handleDelete = (item: InventoryItem) => {
        showConfirmation(
            'Confirmar Eliminación',
            `¿Está seguro de que desea eliminar el ítem '${item.name}' del inventario?`,
            () => deleteInventoryItem(item.id)
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            updateInventoryItem({ ...itemData, id: editingItem.id });
        } else {
            addInventoryItem(itemData);
        }
        setIsModalOpen(false);
    };

    return (
        <div className="animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-dark-text">Inventario</h2>
                <button
                    onClick={openAddModal}
                    className="bg-primary hover:bg-primary-800 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all"
                >
                    Agregar Ítem
                </button>
            </div>

            <div className="bg-light-card rounded-xl border border-light-border shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-light-border">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-subtle uppercase tracking-wider">Nombre del Ítem</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-subtle uppercase tracking-wider">Cantidad</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-subtle uppercase tracking-wider">Nivel de Reorden</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-subtle uppercase tracking-wider">Estado</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-dark-subtle uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-light-border">
                        {inventory.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-text">{item.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-subtle">{item.quantity}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-subtle">{item.reorderLevel}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {item.quantity <= item.reorderLevel ? (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Bajo Stock</span>
                                    ) : (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">En Stock</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => openEditModal(item)} className="text-primary hover:text-primary-800 p-1 rounded-md hover:bg-gray-100 transition-colors">
                                            <EditIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDelete(item)} className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-gray-100 transition-colors">
                                            <DeleteIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal title={editingItem ? 'Editar Ítem del Inventario' : 'Agregar Ítem al Inventario'} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-dark-subtle">Nombre del Ítem</label>
                        <input type="text" name="name" value={itemData.name} onChange={handleInputChange} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-dark-subtle">Cantidad Inicial</label>
                        <input type="number" name="quantity" value={itemData.quantity} onChange={handleInputChange} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-dark-subtle">Nivel de Reorden</label>
                        <input type="number" name="reorderLevel" value={itemData.reorderLevel} onChange={handleInputChange} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" required />
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="submit" className="bg-primary hover:bg-primary-800 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all">
                            {editingItem ? 'Guardar Cambios' : 'Guardar Ítem'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Inventory;
