
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import Modal from '../components/Modal';
import { EditIcon, DeleteIcon } from '../components/Icons';
import type { User, PermissionKey } from '../types';
import { ALL_PERMISSIONS } from '../types';

const Users: React.FC = () => {
    const { users, addUser, updateUser, deleteUser, showConfirmation } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<Omit<User, 'id' | 'isDeletable'>>({
        name: '', password: '', permissions: [], isProfessional: false, professionalTitle: '', professionalRegistration: '', signature: ''
    });
    const [userId, setUserId] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUserData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setUserData(prev => ({ ...prev, [name]: checked }));
    };

    const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setUserData(prev => ({ ...prev, signature: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePermissionChange = (permission: PermissionKey) => {
        setUserData(prev => {
            const permissions = new Set(prev.permissions);
            if (permissions.has(permission)) {
                permissions.delete(permission);
            } else {
                permissions.add(permission);
            }
            return { ...prev, permissions: Array.from(permissions) };
        });
    };

    const openAddModal = () => {
        setEditingUser(null);
        setUserId('');
        setUserData({ name: '', password: '', permissions: [], isProfessional: false, professionalTitle: '', professionalRegistration: '', signature: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setUserId(user.id);
        setUserData({ 
            name: user.name, 
            password: user.password, 
            permissions: user.permissions,
            isProfessional: !!user.isProfessional,
            professionalTitle: user.professionalTitle || '',
            professionalRegistration: user.professionalRegistration || '',
            signature: user.signature || '',
        });
        setIsModalOpen(true);
    };
    
    const handleDelete = (user: User) => {
        if (!user.isDeletable) {
            // Using a simple alert-like confirmation for info, not action
            showConfirmation(
                'Acción no permitida',
                'El usuario Administrador principal no se puede eliminar para garantizar el acceso al sistema.',
                () => {} // No action on confirm
            );
            return;
        }

        showConfirmation(
            'Confirmar Eliminación',
            `¿Está seguro de que desea eliminar al usuario ${user.name}?`,
            () => deleteUser(user.id)
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUser) {
            updateUser({ ...userData, id: editingUser.id, isDeletable: editingUser.isDeletable });
        } else {
            addUser({ ...userData, id: userId });
        }
        setIsModalOpen(false);
    };
    
    return (
        <div className="animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-dark-text">Gestión de Usuarios</h2>
                <button
                    onClick={openAddModal}
                    className="bg-primary hover:bg-primary-800 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all"
                >
                    Agregar Usuario
                </button>
            </div>

            <div className="bg-light-card rounded-xl border border-light-border shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-light-border">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-subtle uppercase tracking-wider">Nombre</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-subtle uppercase tracking-wider">Identificación</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-subtle uppercase tracking-wider">Permisos</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-dark-subtle uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-light-border">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-text">{user.name} {user.isProfessional && '🔬'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-subtle">{user.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-subtle">
                                    {user.permissions.length === Object.keys(ALL_PERMISSIONS).length
                                        ? 'Todos'
                                        : `${user.permissions.length} permisos`}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => openEditModal(user)} className="text-primary hover:text-primary-800 p-1 rounded-md hover:bg-gray-100 transition-colors">
                                            <EditIcon className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(user)} 
                                            className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-gray-100 transition-colors disabled:text-gray-400 disabled:hover:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                            disabled={!user.isDeletable}
                                            title={!user.isDeletable ? "Este usuario no se puede eliminar" : "Eliminar usuario"}
                                        >
                                            <DeleteIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal title={editingUser ? 'Editar Usuario' : 'Agregar Nuevo Usuario'} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleSubmit} className="max-h-[80vh] flex flex-col">
                    <div className="overflow-y-auto space-y-6 p-2 -m-2">
                        <div>
                            <label className="block text-sm font-medium text-dark-subtle">Nombre Completo</label>
                            <input type="text" name="name" value={userData.name} onChange={handleInputChange} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-dark-subtle">Nº Documento de Identidad</label>
                            <input type="text" name="id" value={userId} onChange={(e) => setUserId(e.target.value)} disabled={!!editingUser} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary disabled:bg-gray-100" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-dark-subtle">Contraseña</label>
                            <input type="password" name="password" value={userData.password} onChange={handleInputChange} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" required />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-dark-subtle mb-2">Permisos de Acceso</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border border-light-border rounded-lg">
                                {(Object.keys(ALL_PERMISSIONS) as PermissionKey[]).map(key => (
                                    <label key={key} className="flex items-center space-x-2 cursor-pointer">
                                        <input 
                                            type="checkbox"
                                            checked={userData.permissions.includes(key)}
                                            onChange={() => handlePermissionChange(key)}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm text-dark-text">{ALL_PERMISSIONS[key]}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-light-border pt-4 space-y-4">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input 
                                    type="checkbox"
                                    name="isProfessional"
                                    checked={!!userData.isProfessional}
                                    onChange={handleCheckboxChange}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <span className="text-sm font-medium text-dark-text">Es profesional (puede firmar resultados)</span>
                            </label>

                            {userData.isProfessional && (
                                <div className="p-4 border border-primary-200 rounded-lg space-y-4 bg-primary-50/30 animate-fadeIn">
                                    <h4 className="font-semibold text-primary">Detalles Profesionales</h4>
                                    <div>
                                        <label className="block text-sm font-medium text-dark-subtle">Cargo (Ej: Bacteriólogo/a)</label>
                                        <input type="text" name="professionalTitle" value={userData.professionalTitle} onChange={handleInputChange} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-dark-subtle">Registro Profesional</label>
                                        <input type="text" name="professionalRegistration" value={userData.professionalRegistration} onChange={handleInputChange} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-dark-subtle">Firma Digital (Imagen)</label>
                                        <input type="file" accept="image/png, image/jpeg" onChange={handleSignatureUpload} className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary hover:file:bg-primary-100" />
                                        {userData.signature && (
                                            <div className="mt-2 p-2 bg-white border border-gray-200 rounded-md inline-block">
                                                <p className="text-xs text-dark-subtle mb-1">Vista Previa:</p>
                                                <img src={userData.signature} alt="Signature Preview" className="h-16 border border-gray-300 p-1 rounded" />
                                                <button type="button" onClick={() => setUserData(prev => ({...prev, signature: ''}))} className="text-xs text-red-500 hover:underline mt-1">
                                                    Eliminar Firma
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-shrink-0 mt-auto flex justify-end pt-4 border-t border-light-border">
                        <button type="submit" className="bg-primary hover:bg-primary-800 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all">
                            {editingUser ? 'Guardar Cambios' : 'Guardar Usuario'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Users;
