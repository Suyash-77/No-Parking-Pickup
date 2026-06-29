import React, { useContext, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContent } from '../context/AppContext'
import axios from 'axios'
import { USER_ROLE } from '../utils/constant.js'
import { loadModels, getFaceDescriptor } from '../utils/faceAuth'

const Login = () => {
    const navigate = useNavigate()
    const { backendUrl, setIsLoggedin, getUserData } = useContext(AppContent)

    const [formValues, setFormValues] = useState({ email: '', password: '' })
    const [formErrors, setFormErrors] = useState({})
    const [faceLoading, setFaceLoading] = useState(false)
    const [faceError, setFaceError] = useState('')
    const [showFaceCamera, setShowFaceCamera] = useState(false)
    const faceVideoRef = useRef(null)
    const faceStreamRef = useRef(null)

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormValues({ ...formValues, [name]: value })
    }

    const validate = (values) => {
        const emailregex = /^[a-zA-Z0-9._%+$]+@[a-zA-Z0-9.]+\.[a-zA-Z]{2,}$/
        const passregex = /^[a-zA-Z0-9!@#%&*()_]{8,}$/
        const errors = {}
        if (!values.email) errors.email = 'Email is required'
        else if (!emailregex.test(values.email)) 
            errors.email = 'Invalid email format'
        if (!values.password) 
            errors.password = 'Password is required'
        else if (!passregex.test(values.password)) 
            errors.password = 'Invalid password format'
        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validate(formValues)) return
        try {
            axios.defaults.withCredentials = true
            const { data } = await axios.post(`${backendUrl}/api/auth/login`, formValues)
            if (data.success) {
                setIsLoggedin(true)
                await getUserData()
                const { data: userData } = await axios.get(`${backendUrl}/api/user/data`, { withCredentials: true })
                if (userData.userdata?.role === USER_ROLE.DASHBOARD_ADMIN) navigate('/admin')
                else if (userData.userdata?.role === USER_ROLE.FIELD_ADMIN) navigate('/fieldadmin')
                else navigate('/')
            } else {
                alert(data.message)
            }
        } catch (err) {
            alert(err.message)
        }
    }

    const stopFaceCamera = () => {
        if (faceStreamRef.current) {
            faceStreamRef.current.getTracks().forEach(t => t.stop())
            faceStreamRef.current = null
        }
        setShowFaceCamera(false)
        setFaceLoading(false)
    }

    const startFaceLogin = async () => {
        setFaceError('')
        setFaceLoading(true)
        setShowFaceCamera(true)

        try {
            await loadModels()
            const s = await navigator.mediaDevices.getUserMedia({ video: true })
            faceStreamRef.current = s

            setTimeout(() => {
                if (faceVideoRef.current) faceVideoRef.current.srcObject = s
            }, 100)

            let attempts = 0
            const interval = setInterval(async () => {
                attempts++
                if (!faceVideoRef.current) return

                const descriptor = await getFaceDescriptor(faceVideoRef.current)

                if (descriptor) {
                    clearInterval(interval)
                    stopFaceCamera()

                    try {
                        const { data } = await axios.post(
                            `${backendUrl}/api/auth/face-login`,
                            { descriptor: Array.from(descriptor) },
                            { withCredentials: true }
                        )

                        if (data.success) {
                            setIsLoggedin(true)
                            const role = data.userdata?.role
                            if (role === USER_ROLE.DASHBOARD_ADMIN) navigate('/admin')
                            else if (role === USER_ROLE.FIELD_ADMIN) navigate('/fieldadmin')
                            else navigate('/')
                            setTimeout(() => getUserData(), 100)
                        } else {
                            setFaceError(data.message || 'Face not recognized.')
                        }
                    } catch (err) {
                        setFaceError(err.response?.data?.message || 'Face not recognized. Use password login.')
                    }
                    return
                }

                if (attempts > 15) {
                    clearInterval(interval)
                    stopFaceCamera()
                    setFaceError('Face not recognized. Use password login.')
                }
            }, 500)

        } catch (err) {
            setFaceError(`Error: ${err.name} — ${err.message}`)
            setFaceLoading(false)
            setShowFaceCamera(false)
        }
    }

    return (
        <div className="auth-root">
            <div className="nav">
                <div className="logo">No Parking Pickup</div>
            </div>

            <div className="auth-wrap">
                <div className="auth-brand">
                    <div className="auth-brand-tag">Jaipur Traffic Management</div>
                    <h1 className="auth-brand-title">No Parking<br />Pickup</h1>
                    <p className="auth-brand-desc">
                        Track your vehicle violation, pay your fine online, and get your vehicle released — all in one place.
                    </p>
                    <div className="auth-brand-steps">
                        <div className="auth-step">
                            <span className="auth-step-num">01</span>
                            <span>Search your plate number</span>
                        </div>
                        <div className="auth-step">
                            <span className="auth-step-num">02</span>
                            <span>View violation details</span>
                        </div>
                        <div className="auth-step">
                            <span className="auth-step-num">03</span>
                            <span>Pay fine & get released</span>
                        </div>
                    </div>
                </div>

                <div className="auth-form-wrap">
                    <div className="auth-card">
                        <p className="auth-eyebrow">Welcome back</p>
                        <h2 className="auth-title">Login Account</h2>
                        <p className="auth-sub">Free Forever — no credit card needed</p>

                        <form onSubmit={handleSubmit}>
                            <label>Email</label>
                            <input
                                type="text"
                                placeholder="Enter Email"
                                name="email"
                                value={formValues.email}
                                onChange={handleChange}
                            />
                            <p className="error">{formErrors.email}</p>

                            <label>Password</label>
                            <input
                                type="password"
                                placeholder="Enter Password"
                                name="password"
                                value={formValues.password}
                                onChange={handleChange}
                            />
                            <p className="error">{formErrors.password}</p>

                            <button style={{ marginTop: '8px' }}>Login Account</button>
                        </form>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '12px 0' }}>
                            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>or</span>
                            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                        </div>

                        <button
                            className="btn-approve"
                            style={{ width: '100%' }}
                            onClick={startFaceLogin}
                            disabled={faceLoading}
                        >
                            {faceLoading ? 'Scanning face...' : '😊 Login with Face'}
                        </button>

                        {showFaceCamera && (
                            <>
                                <video
                                    ref={faceVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    style={{ width: '100%', borderRadius: '10px', marginTop: '12px' }}
                                />
                                <button
                                    className="btn-reject"
                                    style={{ width: '100%', marginTop: '8px' }}
                                    onClick={() => {
                                        stopFaceCamera()
                                        setFaceError('')
                                    }}
                                >
                                    Cancel
                                </button>
                            </>
                        )}

                        {faceError && (
                            <div className="alert-error" style={{ marginTop: '8px' }}>
                                {faceError}
                            </div>
                        )}

                        <div className="auth-links">
                            <p>Don't have an account? <a href="register">Create Account</a></p>
                            <p><a href="resetpassword">Reset Password</a></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login