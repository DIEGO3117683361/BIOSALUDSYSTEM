
import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { DashboardIcon, PatientsIcon, ServicesIcon, InventoryIcon, BillingIcon, ResultsIcon, TemplateIcon, RecordsIcon, UserAdminIcon, SettingsIcon } from './Icons';
import type { PermissionKey } from '../types';

const allNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: DashboardIcon, permission: 'dashboard' as PermissionKey },
  { name: 'Pacientes', href: '/patients', icon: PatientsIcon, permission: 'patients' as PermissionKey },
  { name: 'Servicios', href: '/services', icon: ServicesIcon, permission: 'services' as PermissionKey },
  { name: 'Facturación', href: '/billing', icon: BillingIcon, permission: 'billing' as PermissionKey },
  { name: 'Registros', href: '/records', icon: RecordsIcon, permission: 'records' as PermissionKey },
  { name: 'Resultados', href: '/results', icon: ResultsIcon, permission: 'results' as PermissionKey },
  { name: 'Plantillas', href: '/templates', icon: TemplateIcon, permission: 'templates' as PermissionKey },
  { name: 'Inventario', href: '/inventory', icon: InventoryIcon, permission: 'inventory' as PermissionKey },
  { name: 'Usuarios', href: '/users', icon: UserAdminIcon, permission: 'users' as PermissionKey },
  { name: 'Configuración', href: '/settings', icon: SettingsIcon, permission: 'settings' as PermissionKey },
];

const Sidebar: React.FC = () => {
  const { currentUser } = useAppContext();

  const accessibleNav = useMemo(() => {
    if (!currentUser) return [];
    const userPermissions = new Set(currentUser.permissions);
    return allNavigation.filter(item => userPermissions.has(item.permission));
  }, [currentUser]);

  return (
    <div className="hidden md:flex md:flex-col md:w-64 bg-light-card border-r border-light-border">
      <div className="flex items-center h-16 flex-shrink-0 px-6 border-b border-light-border">
        <h1 className="text-2xl font-extrabold text-primary">BIOSALUD</h1>
      </div>
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-4 py-6 space-y-2">
          {accessibleNav.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group flex items-center px-3 py-2 text-base font-medium rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-50 text-primary'
                    : 'text-dark-subtle hover:bg-gray-100 hover:text-dark-text'
                }`
              }
            >
              <item.icon
                className="mr-3 flex-shrink-0 h-6 w-6"
                aria-hidden="true"
              />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
