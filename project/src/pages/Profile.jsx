import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { AppContent } from '../context/AppContext'

const Profile = () => {
  const { backendUrl, userData, getUserData } = useContext(AppContent)
  const navigate = useNavigate()

  const api = axios.create({ baseURL: backendUrl, withCredentials: true })

  const [profileEdit, setProfileEdit] = useState(false)
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' })
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' })

  const [vehicles, setVehicles] = useState([])
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [vehicleEdit, setVehicleEdit] = useState(false)
  const [vehicleForm, setVehicleForm] = useState({
    id: '', owner_name: '', owner_email: '', owner_phone: '', make: '', model: '', color: ''
  })
  const [vehicleLoading, setVehicleLoading] = useState(false)
  const [vehicleMessage, setVehicleMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (userData) {
      setProfileForm({ name: userData.name || '', phone: userData.phone || '' })
      fetchVehicles()
    }
  }, [userData])

  const fetchVehicles = async () => {
    try {
      const { data } = await api.get('/api/user/my-vehicles')
      if (data.success) {
        setVehicles(data.vehicles)
        if (data.vehicles.length > 0) selectVehicle(data.vehicles[0])
      }
    } catch (err) {
      console.log(err.message)
    }
  }

  const selectVehicle = (v) => {
    setSelectedVehicle(v)
    setVehicleForm({
      id: v.id,
      owner_name: v.owner_name || '',
      owner_email: v.owner_email || '',
      owner_phone: v.owner_phone || '',
      make: v.make || '',
      model: v.model || '',
      color: v.color || ''
    })
    setVehicleEdit(false)
    setVehicleMessage({ type: '', text: '' })
  }

  const handleProfileSave = async () => {
    if (!profileForm.name.trim() || !profileForm.phone.trim()) {
      return setProfileMessage({ type: 'error', text: 'Name and phone are required' })
    }
    setProfileLoading(true)
    try {
      const { data } = await api.put('/api/user/update-profile', profileForm)
      if (data.success) {
        await getUserData()
        setProfileMessage({ type: 'success', text: 'Profile updated successfully' })
        setProfileEdit(false)
      } else {
        setProfileMessage({ type: 'error', text: data.message })
      }
    } catch (err) {
      setProfileMessage({ type: 'error', text: err.response?.data?.message || err.message })
    } finally {
      setProfileLoading(false)
    }
  }

  const handleProfileCancel = () => {
    setProfileForm({ name: userData.name || '', phone: userData.phone || '' })
    setProfileMessage({ type: '', text: '' })
    setProfileEdit(false)
  }

  const handleVehicleSave = async () => {
    setVehicleLoading(true)
    try {
      const { data } = await api.put('/api/vehicle/update', vehicleForm)
      if (data.success) {
        setVehicleMessage({ type: 'success', text: 'Vehicle updated successfully' })
        setVehicleEdit(false)
        fetchVehicles()
      } else {
        setVehicleMessage({ type: 'error', text: data.message })
      }
    } catch (err) {
      setVehicleMessage({ type: 'error', text: err.response?.data?.message || err.message })
    } finally {
      setVehicleLoading(false)
    }
  }

  const handleVehicleCancel = () => {
    if (selectedVehicle) selectVehicle(selectedVehicle)
    setVehicleEdit(false)
    setVehicleMessage({ type: '', text: '' })
  }

  const InfoRow = ({ label, value }) => (
    <div className="vp-row">
      <span className="vp-label">{label}</span>
      <span className="vp-value">{value || '—'}</span>
    </div>
  )

  return (
    <div>
      <div className="nav">
        <div className="logo">No Parking Pickup</div>
        <div className="nav-right">
          <span className="nav-admin-name">{userData?.name}</span>
          <button className="btn-logout" onClick={() => navigate('/')}>← Back</button>
        </div>
      </div>

      <div className="admin-wrap">
        <div style={{ width: '100%', maxWidth: '900px' }}>

          <div className="admin-card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0 }}>Profile</h2>
              {!profileEdit && (
                <button className="btn-approve" onClick={() => { setProfileEdit(true); setProfileMessage({ type: '', text: '' }) }}>
                  Edit
                </button>
              )}
            </div>

            {profileMessage.text && (
              <div className={profileMessage.type === 'success' ? 'alert-success' : 'alert-error'}
                style={{ marginBottom: '16px' }}>
                {profileMessage.text}
              </div>
            )}

            {!profileEdit ? (
              <div className="vp-rows">
                <InfoRow label="Full Name" value={userData?.name} />
                <InfoRow label="Email" value={userData?.email} />
                <InfoRow label="Phone" value={userData?.phone} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '500px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Full Name</label>
                  <input
                    className="search-input"
                    value={profileForm.name}
                    onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Full name"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Email</label>
                  <input
                    className="search-input"
                    value={userData?.email || ''}
                    disabled
                    style={{ opacity: 0.5, cursor: 'not-allowed' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Phone</label>
                  <input
                    className="search-input"
                    value={profileForm.phone}
                    onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="10-digit phone"
                    maxLength={10}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  <button className="btn-approve" onClick={handleProfileSave} disabled={profileLoading}>
                    {profileLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button className="btn-reject" onClick={handleProfileCancel}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="admin-card">
            <h2>My Vehicles</h2>
            {vehicles.length === 0 ? (
              <div className="empty-state">No vehicles registered under your account.</div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
                  {vehicles.map(v => (
                    <button
                      key={v.id}
                      className={`tab-btn ${selectedVehicle?.id === v.id ? 'active' : ''}`}
                      onClick={() => selectVehicle(v)}
                    >
                      {v.plate_number}
                    </button>
                  ))}
                </div>

                {selectedVehicle && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {selectedVehicle.plate_number}
                      </span>
                      {!vehicleEdit && (
                        <button className="btn-approve" onClick={() => { setVehicleEdit(true); setVehicleMessage({ type: '', text: '' }) }}>
                          Edit
                        </button>
                      )}
                    </div>

                    {vehicleMessage.text && (
                      <div className={vehicleMessage.type === 'success' ? 'alert-success' : 'alert-error'}
                        style={{ marginBottom: '16px' }}>
                        {vehicleMessage.text}
                      </div>
                    )}

                    {!vehicleEdit ? (
                      <div className="vp-rows">
                        <InfoRow label="Owner Name"  value={selectedVehicle.owner_name} />
                        <InfoRow label="Owner Email" value={selectedVehicle.owner_email} />
                        <InfoRow label="Owner Phone" value={selectedVehicle.owner_phone} />
                        <InfoRow label="Make"        value={selectedVehicle.make} />
                        <InfoRow label="Model"       value={selectedVehicle.model} />
                        <InfoRow label="Color"       value={selectedVehicle.color} />
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxWidth: '600px' }}>
                        {[
                          { key: 'owner_name',  label: 'Owner Name' },
                          { key: 'owner_email', label: 'Owner Email' },
                          { key: 'owner_phone', label: 'Owner Phone' },
                          { key: 'make',        label: 'Make' },
                          { key: 'model',       label: 'Model' },
                          { key: 'color',       label: 'Color' },
                        ].map(({ key, label }) => (
                          <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{label}</label>
                            <input
                              className="search-input"
                              value={vehicleForm[key]}
                              onChange={e => setVehicleForm(f => ({ ...f, [key]: e.target.value }))}
                              placeholder={label}
                            />
                          </div>
                        ))}
                        <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', marginTop: '4px' }}>
                          <button className="btn-approve" onClick={handleVehicleSave} disabled={vehicleLoading}>
                            {vehicleLoading ? 'Saving...' : 'Save'}
                          </button>
                          <button className="btn-reject" onClick={handleVehicleCancel}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

export default Profile