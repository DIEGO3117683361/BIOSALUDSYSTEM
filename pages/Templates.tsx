
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import Modal from '../components/Modal';
import { EditIcon, DeleteIcon } from '../components/Icons';
import type { ResultTemplate, TemplateField } from '../types';

// Recursive component for editing fields and groups
const FieldEditor: React.FC<{
    field: TemplateField;
    path: number[];
    onUpdate: (path: number[], newProps: Partial<TemplateField>) => void;
    onRemove: (path: number[]) => void;
    onAddChild: (path: number[]) => void;
}> = ({ field, path, onUpdate, onRemove, onAddChild }) => {
    
    const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newProps: Partial<TemplateField> = { [name]: value };
        // When changing type to group, ensure children array exists
        if (name === 'type') {
            newProps.children = value === 'group' ? (field.children || []) : undefined;
        }
        onUpdate(path, newProps);
    };

    return (
        <div className="p-4 border border-light-border rounded-lg bg-gray-50/50 space-y-3">
            <div className="flex justify-between items-start gap-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
                    <div>
                        <label className="block text-xs font-medium text-dark-subtle">Etiqueta del Campo</label>
                        <input type="text" name="label" value={field.label} onChange={handleLocalChange} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 text-sm" required />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-dark-subtle">Tipo de Campo</label>
                        <select name="type" value={field.type} onChange={handleLocalChange} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 text-sm bg-white">
                            <option value="number">Numérico</option>
                            <option value="textarea">Texto Largo</option>
                            <option value="group">Grupo</option>
                        </select>
                    </div>
                </div>
                <div className="pt-6">
                    <button type="button" onClick={() => onRemove(path)} className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-100 transition-colors">
                        <DeleteIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>

            {field.type === 'number' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-dark-subtle">Unidad (ej. mg/dL)</label>
                        <input type="text" name="unit" value={field.unit || ''} onChange={handleLocalChange} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-dark-subtle">Valores de Referencia</label>
                        <input type="text" name="referenceValues" value={field.referenceValues || ''} onChange={handleLocalChange} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 text-sm" />
                    </div>
                </div>
            )}

            {field.type === 'group' && (
                <div className="pl-4 pt-4 mt-4 border-l-2 border-primary-200 space-y-4">
                    <div className="space-y-4">
                         {(field.children || []).map((child, index) => (
                            <FieldEditor 
                                key={child.id}
                                field={child}
                                path={[...path, index]}
                                onUpdate={onUpdate}
                                onRemove={onRemove}
                                onAddChild={onAddChild}
                            />
                        ))}
                    </div>
                    <button type="button" onClick={() => onAddChild(path)} className="text-sm bg-primary-50 text-primary hover:bg-primary-100 font-bold py-1 px-3 rounded-md border border-primary-200 transition-all">
                        + Agregar Campo al Grupo
                    </button>
                </div>
            )}
        </div>
    );
};

const Templates: React.FC = () => {
    const { templates, addTemplate, updateTemplate, deleteTemplate, showConfirmation } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<ResultTemplate | null>(null);
    const [currentTemplate, setCurrentTemplate] = useState<Omit<ResultTemplate, 'id'>>({
        name: '', fields: []
    });

    const updateFieldByPath = (fields: TemplateField[], path: number[], newProps: Partial<TemplateField>): TemplateField[] => {
        return fields.map((field, index) => {
            if (index === path[0]) {
                if (path.length === 1) return { ...field, ...newProps };
                return { ...field, children: updateFieldByPath(field.children || [], path.slice(1), newProps) };
            }
            return field;
        });
    };
    
    const removeFieldByPath = (fields: TemplateField[], path: number[]): TemplateField[] => {
        if (path.length === 1) return fields.filter((_, index) => index !== path[0]);
        return fields.map((field, index) => {
             if (index === path[0]) return { ...field, children: removeFieldByPath(field.children || [], path.slice(1)) };
             return field;
        });
    };

    const addFieldByPath = (fields: TemplateField[], path: number[], newField: TemplateField): TemplateField[] => {
        if (path.length === 0) return [...fields, newField];
        return fields.map((field, index) => {
            if (index === path[0]) {
                const children = addFieldByPath(field.children || [], path.slice(1), newField);
                return { ...field, children };
            }
            return field;
        });
    };
    
    const handleUpdateField = (path: number[], newProps: Partial<TemplateField>) => {
        setCurrentTemplate(prev => ({ ...prev, fields: updateFieldByPath(prev.fields, path, newProps) }));
    };
    
    const handleRemoveField = (path: number[]) => {
        setCurrentTemplate(prev => ({ ...prev, fields: removeFieldByPath(prev.fields, path) }));
    };

    const handleAddField = (path: number[] = []) => {
        const newField: TemplateField = {
            id: `field-${Date.now()}-${Math.random()}`,
            label: '',
            type: 'number',
        };
        setCurrentTemplate(prev => ({ ...prev, fields: addFieldByPath(prev.fields, path, newField) }));
    };

    const openAddModal = () => {
        setEditingTemplate(null);
        setCurrentTemplate({ name: '', fields: [] });
        setIsModalOpen(true);
    };

    const openEditModal = (template: ResultTemplate) => {
        setEditingTemplate(template);
        setCurrentTemplate({
            name: template.name,
            fields: JSON.parse(JSON.stringify(template.fields)) // Deep copy
        });
        setIsModalOpen(true);
    };

    const handleDelete = (template: ResultTemplate) => {
        showConfirmation(
            'Confirmar Eliminación',
            `¿Está seguro de que desea eliminar la plantilla "${template.name}"? Esta acción podría afectar a los servicios que la utilizan.`,
            () => deleteTemplate(template.id)
        );
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingTemplate) {
            updateTemplate({ ...currentTemplate, id: editingTemplate.id });
        } else {
            addTemplate(currentTemplate);
        }
        setIsModalOpen(false);
    };

    const countFields = (fields: TemplateField[]): number => {
        let count = 0;
        fields.forEach(field => {
            count++;
            if (field.children) {
                count += countFields(field.children);
            }
        });
        return count;
    };

    return (
        <div className="animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-dark-text">Plantillas de Resultados</h2>
                <button
                    onClick={openAddModal}
                    className="bg-primary hover:bg-primary-800 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all"
                >
                    Crear Plantilla
                </button>
            </div>

            <div className="bg-light-card rounded-xl border border-light-border shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-light-border">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-subtle uppercase tracking-wider">Nombre de la Plantilla</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-subtle uppercase tracking-wider">Nº de Campos</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-dark-subtle uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-light-border">
                        {templates.map((template) => (
                            <tr key={template.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-text">{template.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-subtle">{countFields(template.fields)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => openEditModal(template)} className="text-primary hover:text-primary-800 p-1 rounded-md hover:bg-gray-100 transition-colors">
                                            <EditIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDelete(template)} className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-gray-100 transition-colors">
                                            <DeleteIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {templates.length === 0 && <p className="p-6 text-center text-dark-subtle">No has creado ninguna plantilla todavía.</p>}
            </div>

            <Modal title={editingTemplate ? "Editar Plantilla" : "Crear Nueva Plantilla"} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] flex flex-col">
                    <div className="px-1">
                        <label className="block text-sm font-medium text-dark-subtle">Nombre de la Plantilla</label>
                        <input type="text" value={currentTemplate.name} onChange={(e) => setCurrentTemplate(prev => ({...prev, name: e.target.value}))} className="mt-1 block w-full border border-light-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" required />
                    </div>

                    <div className="space-y-4 flex-grow overflow-y-auto pr-2 -mr-2">
                        <h4 className="text-lg font-semibold text-dark-text px-1">Campos de la Plantilla</h4>
                        
                        <div className="space-y-4">
                            {currentTemplate.fields.map((field, index) => (
                                <FieldEditor 
                                    key={field.id}
                                    field={field}
                                    path={[index]}
                                    onUpdate={handleUpdateField}
                                    onRemove={handleRemoveField}
                                    onAddChild={handleAddField}
                                />
                            ))}
                        </div>

                         <button type="button" onClick={() => handleAddField([])} className="w-full bg-primary-50 text-primary hover:bg-primary-100 font-bold py-2 px-4 rounded-lg border border-primary-200 transition-all">
                            + Agregar Campo Raíz
                        </button>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-light-border mt-auto">
                        <button type="submit" className="bg-primary hover:bg-primary-800 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all">
                            {editingTemplate ? "Guardar Cambios" : "Guardar Plantilla"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Templates;
