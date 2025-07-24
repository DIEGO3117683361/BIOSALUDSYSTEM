
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { PatientsIcon, ServicesIcon, BillingIcon, ResultsIcon, BellIcon } from '../components/Icons';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ComponentType<{ className?: string }> }> = ({ title, value, icon: Icon }) => (
    <div className="bg-light-card p-6 rounded-xl border border-light-border shadow-sm hover:shadow-lg transition-shadow duration-300 animate-fadeIn">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-dark-subtle">{title}</p>
                <p className="text-3xl font-bold text-dark-text">{value}</p>
            </div>
            <div className="bg-primary-100 p-3 rounded-full">
                <Icon className="h-6 w-6 text-primary" />
            </div>
        </div>
    </div>
);

const Dashboard: React.FC = () => {
    const { patients, services, invoices, results, dashboardAnnouncements } = useAppContext();
    const pendingResults = results.filter(r => r.status === 'Pending').length;

    const welcomeCardStyle: React.CSSProperties = {
        animationDelay: '200ms'
    };

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-dark-text animate-slideIn">Dashboard</h2>

            {/* Announcements Section */}
            {dashboardAnnouncements.length > 0 && (
                <div className="space-y-4 animate-slideIn">
                    {dashboardAnnouncements.map((announcement, index) => (
                        <div key={announcement.id} className="bg-primary-50 border-l-4 border-primary p-4 rounded-r-lg shadow-sm" style={{animationDelay: `${index * 100}ms`}}>
                            <div className="flex items-start gap-3">
                                <BellIcon className="h-5 w-5 text-primary mt-1 flex-shrink-0"/>
                                <div>
                                    <h3 className="font-bold text-primary text-lg">{announcement.title}</h3>
                                    <p className="text-dark-text mt-1">{announcement.message}</p>
                                    {announcement.imageUrl && (
                                        <img 
                                            src={announcement.imageUrl} 
                                            alt={announcement.title} 
                                            className="mt-4 rounded-lg max-h-60 w-auto shadow-md border border-light-border" 
                                            onError={(e) => (e.currentTarget.style.display = 'none')}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Pacientes" value={patients.length} icon={PatientsIcon} />
                <StatCard title="Servicios Ofrecidos" value={services.length} icon={ServicesIcon} />
                <StatCard title="Facturas Pendientes" value={invoices.filter(inv => inv.status === 'Pending').length} icon={BillingIcon} />
                <StatCard title="Resultados Pendientes" value={pendingResults} icon={ResultsIcon} />
            </div>
            <div className="bg-light-card p-6 rounded-xl border border-light-border shadow-sm animate-fadeIn" style={welcomeCardStyle}>
                 <h3 className="text-xl font-semibold text-dark-text mb-4">Bienvenido a BIOSALUD</h3>
                 <p className="text-dark-subtle">
                    Utilice la barra de navegación de la izquierda para gestionar pacientes, registrar nuevos servicios, generar facturas y procesar resultados de exámenes. Este panel le ofrece una vista rápida de las operaciones clave de su laboratorio.
                 </p>
            </div>
        </div>
    );
};

export default Dashboard;
