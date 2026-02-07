import React from 'react';

const AddEmployeeModal = ({ isOpen, onClose, onSubmit, newEmployee, setNewEmployee, avatars }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="glass-card modal-content">
                <h3>Incorporar Talento 🚀</h3>
                <form onSubmit={onSubmit}>
                    <div className="form-group">
                        <label>Nombre</label>
                        <input
                            type="text"
                            value={newEmployee.name}
                            onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })}
                            className="modern-input"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Puesto</label>
                        <input
                            type="text"
                            value={newEmployee.role}
                            onChange={e => setNewEmployee({ ...newEmployee, role: e.target.value })}
                            className="modern-input"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={newEmployee.email}
                            onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })}
                            className="modern-input"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Avatar</label>
                        <div className="option-picker">
                            {avatars.map(a => (
                                <button
                                    key={a}
                                    type="button"
                                    className={`option-btn ${newEmployee.avatar === a ? 'active' : ''}`}
                                    onClick={() => setNewEmployee({ ...newEmployee, avatar: a })}
                                >
                                    {a}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary">Crear</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEmployeeModal;
