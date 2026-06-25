import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { AppContent } from '../context/AppContext'

const AddVehicle = () => {
    const { backendUrl, userData } = useContext(AppContent)
    const navigate = useNavigate()

    const api = axios.create({ baseURL: backendUrl, withCredentials: true })

    const [form, setForm] = useState({ plate_number: '', owner_name: '', owner_email: '', owner_phone: '', make: '', model: '', color: '' })
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })

    const handleSubmit = async () => {
        if (!form.plate_number.trim() || !form.owner_name.trim()) {
            return setMessage({ type: 'error', text: 'Plate number and owner name are required' })
        }
        setLoading(true)
        try {
            const { data } = await api.post('/api/vehicle/add', {
                ...form,
                plate_number: form.plate_number.toUpperCase()
            })
            if (data.success) {
                setMessage({ type: 'success', text: `Vehicle ${form.plate_number.toUpperCase()} added successfully` })
                setForm({ plate_number: '', owner_name: '', owner_email: '', owner_phone: '', make: '', model: '', color: '' })
            } else {
                setMessage({ type: 'error', text: data.message })
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || err.message })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <div className="nav">
                <div className="logo">No Parking Pickup</div>
                <div className="nav-right">
                    <span className="nav-admin-name">{userData?.name}</span>
                    <button className="btn-logout" onClick={() => navigate('/profile')}>← Back</button>
                </div>
            </div>

            <div className="admin-wrap">
                <div style={{ width: '100%', maxWidth: '600px' }}>
                    <div className="admin-card">
                        <h2>Add Vehicle</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
                            Register a new vehicle under your account.
                        </p>

                        {message.text && (
                            <div className={message.type === 'success' ? 'alert-success' : 'alert-error'}
                                style={{ marginBottom: '16px' }}>
                                {message.text}
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Plate Number</label>
                                <input
                                    className="search-input"
                                    placeholder="e.g. RJ14AB1234"
                                    value={form.plate_number}
                                    onChange={e => setForm(f => ({ ...f, plate_number: e.target.value }))}
                                />
                            </div>

                            {[
                                { key: 'owner_name',  label: 'Owner Name',  placeholder: 'Full name' },
                                { key: 'owner_email', label: 'Owner Email', placeholder: 'email@example.com' },
                                { key: 'owner_phone', label: 'Owner Phone', placeholder: '10-digit number' },
                                { key: 'make',        label: 'Make',        placeholder: 'e.g. Maruti' },
                                { key: 'model',       label: 'Model',       placeholder: 'e.g. Swift' },
                                { key: 'color',       label: 'Color',       placeholder: 'e.g. White' },
                            ].map(({ key, label, placeholder }) => (
                                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{label}</label>
                                    <input className="search-input" placeholder={placeholder} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button className="btn-approve" onClick={handleSubmit} disabled={loading}>
                                {loading ? 'Adding...' : 'Add Vehicle'}
                            </button>
                            <button className="btn-reject" onClick={() => navigate('/profile')}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AddVehicle