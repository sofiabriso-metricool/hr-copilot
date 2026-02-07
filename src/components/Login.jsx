import React, { useState } from 'react';

function Login({ onLogin, onRegister, error }) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [adminName, setAdminName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isRegistering) {
            onRegister({ companyName, adminName, email, password });
        } else {
            onLogin(email, password);
        }
    };

    return (
        <div className="login-screen">
            <div className="glass-card login-card">
                <header className="login-header">
                    <span className="logo-icon">🚀</span>
                    <h1>HR Co-pilot</h1>
                    <p>{isRegistering ? 'Crea el entorno de tu empresa ✨' : 'Potenciando equipos modernos ✨'}</p>
                </header>

                <form onSubmit={handleSubmit}>
                    {isRegistering && (
                        <>
                            <div className="form-group">
                                <label>Nombre de la Empresa</label>
                                <input
                                    type="text"
                                    className="modern-input"
                                    placeholder="Ej: Acme Corp"
                                    value={companyName}
                                    onChange={e => setCompanyName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Tu Nombre (Admin)</label>
                                <input
                                    type="text"
                                    className="modern-input"
                                    placeholder="Ej: Sonia Soler"
                                    value={adminName}
                                    onChange={e => setAdminName(e.target.value)}
                                    required
                                />
                            </div>
                        </>
                    )}
                    <div className="form-group">
                        <label>Email Corporativo</label>
                        <input
                            type="email"
                            className="modern-input"
                            placeholder="tu@empresa.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Contraseña</label>
                        <input
                            type="password"
                            className="modern-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <p className="error-message">⚠️ {error}</p>}

                    <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                        {loading ? (
                            <span className="spinner-mini" style={{ borderTopColor: 'white' }}></span>
                        ) : (
                            isRegistering ? 'Crear Empresa & Admin 🚀' : 'Entrar al Radar 🔒'
                        )}
                    </button>
                </form>

                <footer className="login-footer">
                    <button className="btn-link" onClick={() => { setIsRegistering(!isRegistering); setEmail(''); setPassword(''); }}>
                        {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿Nueva empresa? Regístrate aquí'}
                    </button>
                    {!isRegistering && (
                        <div style={{ marginTop: '1rem' }}>
                            <small>Credenciales demo: <b>sonia@hr.com</b> / <b>123</b></small>
                        </div>
                    )}
                </footer>
            </div>
        </div>
    );
}

export default Login;
