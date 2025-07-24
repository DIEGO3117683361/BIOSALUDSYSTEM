
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const LoginPage: React.FC = () => {
    const [id, setId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAppContext();
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const isLoggedIn = login(id, password);
        if (isLoggedIn) {
            navigate('/dashboard', { replace: true });
        } else {
            setError('La identificación o la contraseña son incorrectas.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-light-bg">
            <div className="w-full max-w-md p-8 space-y-8 bg-light-card rounded-xl shadow-2xl animate-fadeIn">
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold text-primary">BIOSALUD</h1>
                    <p className="mt-2 text-dark-subtle">Laboratorio Clínico</p>
                </div>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="user-id" className="sr-only">Nº de Identificación</label>
                            <input
                                id="user-id"
                                name="id"
                                type="text"
                                required
                                value={id}
                                onChange={(e) => setId(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-dark-text rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                placeholder="Nº de Identificación"
                            />
                        </div>
                        <div>
                            <label htmlFor="password-input" className="sr-only">Contraseña</label>
                            <input
                                id="password-input"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-dark-text rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                placeholder="Contraseña"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all"
                        >
                            Ingresar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
