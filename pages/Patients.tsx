
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import Modal from '../components/Modal';
import { EditIcon, DeleteIcon } from '../components/Icons';
import type { Patient } from '../types';

const Patients: React.FC = () => {
    const { patients, addPatient, updatePatient, deletePatient, showConfirmation } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
    const [patientData, setPatientData] = useState<Omit<Patient, 'id'>>({
        name: '', documentId: '', dob: '', gender: 'Other', phone: '', email: '', address: '', dependency: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setPatientData(prev => ({ ...prev, [name]: value }));
    };

    const openAddModal = () => {
        setEditingPatient(null);
        setPatientData({ name: '', documentId: '', dob: '', gender: 'Other', phone: '', email: '', address: '', dependency: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (patient: Patient) => {
        setEditingPatient(patient);
        setPatientData(patient);
        setIsModalOpen(true);
    };
    
    const handleDelete = (patient: Patient) => {
        showConfirmation(
            'Confirmar Eliminación',
            `¿Está seguro de que desea eliminar al paciente ${patient.name}? Esta acción no se puede deshacer.`,
            () => deletePatient(patient.id)
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingPatient) {
            updatePatient({ ...patientData, id: editingPatient.id });
        } else {
            addPatient(patientData);
        }
        setIsModalOpen(false);
    };

    return (
        <div className="animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-dark-text">Pacientes</h2>
                <button
                    onClick={openAddModal}
                    className="bg-primary hover:bg-primary-800 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all"
                >
                    Agregar Paciente
                </button>
            </div>

            <div className="bg-light-card rounded-xl border border-light-border shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-light-border">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-subtle uppercase tracking-wider">Nombre</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-subtle uppercase tracking-wider">Documento</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-subtle uppercase tracking-wider">F. Nacimiento</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-subtle uppercase tracking-wider">Dependencia</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-subtle uppercase tracking-wider">Contacto</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-dark-subtle uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-light-border">
                        {patients.map((patient) => (
                            <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-text">{patient.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-subtle">{patient.documentId}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-subtle">{patient.dob}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-subtle">{patient.dependency}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-subtle">{patient.email} / {patient.phone}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => openEditModal(patient)} className="text-primary hover:text-primary-800 p-1 rounded-md hover:bg-gray-100 transition-colors">
                                            <EditIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDelete(patient)} className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-gray-100 transition-colors">
                                            <DeleteIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal title={editingPatient ? 'Editar Paciente' : 'Agregar Nuevo Paciente'} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-dark-subtle">Nombre Completo</label>
                            <input type="text" name="name" value={patientData.name} onChange={handleInputChange} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-dark-subtle">Nº Documento de Identidad</label>
                            <input type="text" name="documentId" value={patientData.documentId} onChange={handleInputChange} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-dark-subtle">Fecha de Nacimiento</label>
                            <input type="date" name="dob" value={patientData.dob} onChange={handleInputChange} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-dark-subtle">Género</label>
                            <select name="gender" value={patientData.gender} onChange={handleInputChange} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary">
                                <option>Male</option>
                                <option>Female</option>
                                <option>Other</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-dark-subtle">Dirección</label>
                        <input type="text" name="address" value={patientData.address} onChange={handleInputChange} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-dark-subtle">Dependencia (Empresa, Seguro, etc.)</label>
                        <input type="text" name="dependency" value={patientData.dependency} onChange={handleInputChange} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-dark-subtle">Teléfono</label>
                        <input type="tel" name="phone" value={patientData.phone} onChange={handleInputChange} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-dark-subtle">Email</label>
                        <input type="email" name="email" value={patientData.email} onChange={handleInputChange} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" required />
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="submit" className="bg-primary hover:bg-primary-800 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all">
                            {editingPatient ? 'Guardar Cambios' : 'Guardar Paciente'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Patients;
