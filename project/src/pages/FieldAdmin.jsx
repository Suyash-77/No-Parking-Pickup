import React, { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { AppContent } from '../context/AppContext'
import { VIOLATION_STATUS_LABEL } from '../utils/constant'
import { getViolationStatusClass } from '../utils/helpers'
import '../css/FieldAdmin.css'

const PAGE_SIZE = 7

const FieldAdmin = () => {
    const { backendUrl, userData } = useContext(AppContent)
    const navigate = useNavigate()

    const api = axios.create({ baseURL: backendUrl, withCredentials: true })

    const [form, setForm] = useState({ plateNumber: '', location: '', fineAmount: 500 })
    const [image, setImage] = useState(null)
    const [preview, setPreview] = useState(null)
    const [ownerInfo, setOwnerInfo] = useState(null)
    const [violations, setViolations] = useState([])
    const [message, setMessage] = useState({ type: '', text: '' })
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState({ lookup: false, submit: false, violations: true })
    const [scanning, setScanning] = useState(false)
    const [vehicleForm, setVehicleForm] = useState({ plate_number: '', owner_name: '', owner_email: '', owner_phone: '', make: '', model: '', color: '' })
    const [vehicleLoading, setVehicleLoading] = useState(false)
    const [vehicleMessage, setVehicleMessage] = useState({ type: '', text: '' })
    const [activeTab, setActiveTab] = useState('capture')

    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const scanIntervalRef = useRef(null)
    const streamRef = useRef(null)
    const plateHits = useRef({})
    const isScanningRef = useRef(false)

    const showMessage = (type, text) => setMessage({ type, text })
const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

const stopScanning = () => {
    clearInterval(scanIntervalRef.current)
    scanIntervalRef.current = null
    if (videoRef.current) {
        videoRef.current.srcObject = null
    }
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => {
            t.stop()
            t.enabled = false
        })
        streamRef.current = null
    }
    setScanning(false)
    plateHits.current = {}
}

const resetForm = () => {
    setForm({ plateNumber: '', location: '', fineAmount: 500 })
    setImage(null)
    setPreview(null)
    setOwnerInfo(null)
}

const fetchViolations = async () => {
    try {
        const { data } = await api.get('/api/field-admin/violations')
        if (data.success) setViolations(data.violations)
    } catch (err) {
        console.log(err.message)
    } finally {
        setLoading(prev => ({ ...prev, violations: false }))
    }
}

useEffect(() => { fetchViolations() }, [])
useEffect(() => { return () => stopScanning() }, [])
useEffect(() => {
    const handleBeforeUnload = () => stopScanning()
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
}, [])
useEffect(() => {
    const handleVisibilityChange = () => {
        if (document.hidden && scanning) stopScanning()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
}, [scanning])
   
    const lookupVehicle = async () => {
        if (!form.plateNumber.trim()) return
        setLoading(prev => ({ ...prev, lookup: true }))
        setOwnerInfo(null)
        try {
            const plate = form.plateNumber.trim().toUpperCase()
            const { data } = await api.get(`/api/vehicle/${plate}`)
            if (data.success) {
                setOwnerInfo(data.vehicle)
                showMessage('', '')
            } else {
                showMessage('error', `Vehicle not found: ${plate}`)
            }
        } catch (err) {
            showMessage('error', err.message)
        } finally {
            setLoading(prev => ({ ...prev, lookup: false }))
        }
    }

    const startScanning = async () => {
        setScanning(true)
        setMessage({ type: '', text: '' })
        setOwnerInfo(null)
        setImage(null)
        setPreview(null)
        setForm(prev => ({ ...prev, plateNumber: '' }))

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const { latitude, longitude } = pos.coords
                    try {
                        const res = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
                        )
                        const json = await res.json()
                        const addr = json.display_name || `${latitude}, ${longitude}`
                        setForm(prev => ({ ...prev, location: addr }))
                    } catch {
                        setForm(prev => ({ ...prev, location: `${latitude}, ${longitude}` }))
                    }
                },
                () => showMessage('error', 'Location access denied. Fill manually.')
            )
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
            })
            streamRef.current = stream
            if (videoRef.current) videoRef.current.srcObject = stream
            scanIntervalRef.current = setInterval(() => captureAndScan(), 2000)
        } catch (err) {
            showMessage('error', 'Camera access denied.')
            setScanning(false)
        }
    }

    const captureAndScan = async () => {
        if (isScanningRef.current) return
        if (!videoRef.current || !canvasRef.current) return

        isScanningRef.current = true

        const video = videoRef.current
        const canvas = canvasRef.current

        const vw = video.videoWidth
        const vh = video.videoHeight

        const cropW = vw * 0.70
        const cropH = vh * 0.25
        const cropX = (vw - cropW) / 2
        const cropY = (vh - cropH) / 2

        canvas.width = Math.min(cropW, 640)
        canvas.height = Math.min(cropH, 160)
        canvas.getContext('2d').drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)

        canvas.toBlob(async (blob) => {
            if (!blob) return
            const file = new File([blob], `scan-${Date.now()}.jpg`, { type: 'image/jpeg' })
            try {
                const formData = new FormData()
                formData.append('image', file)
                const { data } = await api.post('/api/ocr/read-plate', formData)

                if (data.success && data.patternMatched) {
                    plateHits.current[data.plate] = (plateHits.current[data.plate] || 0) + 1

                    if (plateHits.current[data.plate] >= 1) {
                        plateHits.current = {}
                        stopScanning()
                        setImage(file)
                        setPreview(URL.createObjectURL(file))
                        setForm(prev => ({ ...prev, plateNumber: data.plate }))
                        showMessage('success', `Plate detected: ${data.plate}`)

                        setLoading(prev => ({ ...prev, lookup: true }))
                        try {
                            const { data: vehicleData } = await api.get(`/api/vehicle/${data.plate}`)
                            if (vehicleData.success) setOwnerInfo(vehicleData.vehicle)
                            else showMessage('error', `Plate ${data.plate} not found in database`)
                        } catch {
                            showMessage('error', 'Could not look up vehicle')
                        } finally {
                            setLoading(prev => ({ ...prev, lookup: false }))
                        }
                    }
                }
            } catch {}
            finally {
                isScanningRef.current = false
            }
        }, 'image/jpeg', 0.8)
    }


    const validateForm = () => {
        if (!form.plateNumber.trim()) return 'Plate number is required'
        if (!ownerInfo) return 'Vehicle not found'
        if (!form.location.trim()) return 'Location is required'
        if (!image) return 'Image is required'
        return null
    }

    const handleAddVehicle = async () => {
        if (!vehicleForm.plate_number.trim() || !vehicleForm.owner_name.trim()) {
            return setVehicleMessage({ type: 'error', text: 'Plate number and owner name are required' })
        }
        setVehicleLoading(true)
        try {
            const { data } = await api.post('/api/vehicle/add', {
                ...vehicleForm,
                plate_number: vehicleForm.plate_number.toUpperCase()
            })
            if (data.success) {
                setVehicleMessage({ type: 'success', text: `Vehicle ${vehicleForm.plate_number.toUpperCase()} added to database` })
                setVehicleForm({ plate_number: '', owner_name: '', owner_email: '', owner_phone: '', make: '', model: '', color: '' })
            } else {
                setVehicleMessage({ type: 'error', text: data.message })
            }
        } catch (err) {
            setVehicleMessage({ type: 'error', text: err.response?.data?.message || err.message })
        } finally {
            setVehicleLoading(false)
        }
    }

    const handleSubmit = async () => {
        const error = validateForm()
        if (error) return showMessage('error', error)
        setLoading(prev => ({ ...prev, submit: true }))
        try {
            const dataToSend = new FormData()
            dataToSend.append('plate_number', form.plateNumber.toUpperCase())
            dataToSend.append('location', form.location)
            dataToSend.append('fine_amount', form.fineAmount)
            dataToSend.append('image', image)
            const { data } = await api.post('/api/field-admin/capture', dataToSend)
            if (data.success) {
                showMessage('success', `Vehicle captured! Violation ID: ${data.violationId}`)
                resetForm()
                fetchViolations()
                setPage(1)
            } else {
                showMessage('error', data.message)
            }
        } catch (err) {
            showMessage('error', err.message)
        } finally {
            setLoading(prev => ({ ...prev, submit: false }))
        }
    }

    const handleLogout = async () => {
        try { await api.post('api/auth/logout') } finally { navigate('/login') }
    }

    const totalPages = Math.ceil(violations.length / PAGE_SIZE)
    const paginated = violations.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    return (
        <div>
            <div className="nav">
                <div className="logo">No Parking Pickup</div>
                <div className="nav-right">
                    <span className="nav-admin-name">{userData?.name}</span>
                    <button className="btn-logout" onClick={() => navigate('/')}>Home</button>
                    <button className="btn-logout" onClick={handleLogout}>Logout</button>
                </div>
            </div>

            <div className="field-wrap">
                <div className="field-wrap-inner">

                    <div className="tabs field-tabs">
                        <button className={`tab-btn ${activeTab === 'capture' ? 'active' : ''}`} onClick={() => setActiveTab('capture')} >
                            Capture Violation
                        </button>
                        <button className={`tab-btn ${activeTab === 'addVehicle' ? 'active' : ''}`} onClick={() => setActiveTab('addVehicle')} >
                            Add Vehicle
                        </button>
                    </div>

                    {activeTab === 'capture' && (
                        <div className="capture-grid">
                            <div className="field-card">
                                <h2>Capture Violation</h2>
                                {message.text && (
                                    <div className={message.type === 'success' ? 'alert-success' : 'alert-error'}>
                                        {message.text}
                                    </div>
                                )}
                                {scanning && (
                                    <div className="camera-wrap">
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="camera-video"
                                        />
                                        <div className="camera-overlay" />
                                        <div className="camera-label">
                                            Scanning for plate... • Hold 30–60 cm from plate • Keep steady
                                        </div>
                                    </div>
                                )}

                                {!scanning && preview && (
                                    <img src={preview} alt="captured" className="capture-preview" />
                                )}

                                <canvas ref={canvasRef} className="canvas-hidden" />

                                <input name="plateNumber" placeholder="Plate Number" value={form.plateNumber} onChange={handleChange} onBlur={lookupVehicle} />
                                {loading.lookup && <small className="text-muted">Looking up vehicle...</small>}

                                <input name="location" placeholder="Location (auto-filled on scan)" value={form.location} onChange={handleChange}/>
                                <input type="number" name="fineAmount" value={form.fineAmount} onChange={handleChange} />

                                <div className="scan-btn-wrap">
                                    {!scanning ? (
                                        <button className="btn-scan" onClick={startScanning}>
                                            📷 Scan Live
                                        </button>
                                    ) : (
                                        <button className="btn-stop" onClick={stopScanning}>
                                            ⏹ Stop Scan
                                        </button>
                                    )}
                                </div>

                                <button className="btn-capture" onClick={handleSubmit} disabled={loading.submit}>
                                    {loading.submit ? 'Capturing...' : 'Capture Vehicle'}
                                </button>
                            </div>

                            <div className="field-card">
                                <h2>Owner Details</h2>
                                {!ownerInfo ? (
                                    <p className="text-muted">Enter a plate number to look up owner</p>
                                ) : (
                                    <div className="vp-rows">
                                        <div className="vp-row">
                                            <span className="vp-label">Name</span>
                                            <span className="vp-value">{ownerInfo.owner_name}</span>
                                        </div>
                                        <div className="vp-row">
                                            <span className="vp-label">Email</span>
                                            <span className="vp-value">{ownerInfo.owner_email}</span>
                                        </div>
                                        <div className="vp-row">
                                            <span className="vp-label">Phone</span>
                                            <span className="vp-value">{ownerInfo.owner_phone}</span>
                                        </div>
                                        <div className="vp-row">
                                            <span className="vp-label">Vehicle</span>
                                            <span className="vp-value">{ownerInfo.make} {ownerInfo.model}</span>
                                        </div>
                                        <div className="vp-row">
                                            <span className="vp-label">Color</span>
                                            <span className="vp-value">{ownerInfo.color}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'addVehicle' && (
                        <div className="field-card">
                            <h2>Add Vehicle to Database</h2>
                            {vehicleMessage.text && (
                                <div className={vehicleMessage.type === 'success' ? 'alert-success' : 'alert-error'}>
                                    {vehicleMessage.text}
                                </div>
                            )}

                            <div className="add-vehicle-grid">
                                <input  className="span-2" placeholder="Plate Number (e.g. RJ14AB1234)" value={vehicleForm.plate_number} onChange={e => setVehicleForm(f => ({ ...f, plate_number: e.target.value }))} />
                                <input placeholder="Owner Name" value={vehicleForm.owner_name} onChange={e => setVehicleForm(f => ({ ...f, owner_name: e.target.value }))} />
                                <input  placeholder="Owner Email"  value={vehicleForm.owner_email} onChange={e => setVehicleForm(f => ({ ...f, owner_email: e.target.value }))} />
                                <input placeholder="Owner Phone"  value={vehicleForm.owner_phone} onChange={e => setVehicleForm(f => ({ ...f, owner_phone: e.target.value }))} />
                                <input  placeholder="Make (e.g. Maruti)" value={vehicleForm.make}  onChange={e => setVehicleForm(f => ({ ...f, make: e.target.value }))} />
                                <input  placeholder="Model (e.g. Swift)" value={vehicleForm.model} onChange={e => setVehicleForm(f => ({ ...f, model: e.target.value }))} />
                                <input  placeholder="Color" value={vehicleForm.color} onChange={e => setVehicleForm(f => ({ ...f, color: e.target.value }))} />
                            </div>

                            <button className="btn-add-vehicle" onClick={handleAddVehicle} disabled={vehicleLoading}>
                                {vehicleLoading ? 'Adding...' : 'Add Vehicle'}
                            </button>
                        </div>
                    )}

                    <div className="admin-card field-violations">
                        <div className="acc">
                            <h2>My Captured Vehicles ({violations.length})</h2>
                        </div>

                        {loading.violations ? (
                            <div className="loading-text">Loading...</div>
                        ) : violations.length === 0 ? (
                            <div className="empty-state">
                                <span className="empty-icon">🚗</span>
                                <strong>No violations captured yet</strong>
                            </div>
                        ) : (
                            <>
                                <div className="admin-table-wrap">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Plate</th>
                                                <th>Owner</th>
                                                <th>Location</th>
                                                <th>Fine</th>
                                                <th>Status</th>
                                                <th>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginated.map(v => (
                                                <tr key={v.id}>
                                                    <td className="td-plate">{v.plate_number}</td>
                                                    <td>{v.owner_name}</td>
                                                    <td className="td-location">{v.location}</td>
                                                    <td className="td-fine">₹{v.fine_amount}</td>
                                                    <td>
                                                        <span className={`status-badge ${getViolationStatusClass(v.status)}`}>
                                                            {VIOLATION_STATUS_LABEL[v.status]}
                                                        </span>
                                                    </td>
                                                    <td className="td-date">
                                                        {new Date(v.captured_at).toLocaleString('en-IN')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="pagination">
                                    <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Prev</button>
                                    {Array.from({ length: totalPages }, (_, i) => (
                                        <button key={i + 1} className={`page-btn ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)} >
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>Next →</button>
                                </div>
                            </>
                        )}
                    </div>

                </div>
            </div>
        </div>
    )
}

export default FieldAdmin