import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContent } from '../context/AppContext';

const Register = () => {
    const { backendUrl, setIsLoggedin, getUserData } = useContext(AppContent)
    const navigate = useNavigate()

    const [formValues, setFormValues] = useState({ fullname: '', email: '', password: '', confirmpass: '', phone: '' })
    const [formErrors, setFormErrors] = useState({})

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormValues({ ...formValues, [name]: value })
    }

    const validate = (values) => {
        const emailregex = /^[a-zA-Z0-9._%+$]+@[a-zA-Z0-9.]+\.[a-zA-Z]{2,}$/
        const passregex = /^[a-zA-Z0-9!@#%&*()_]{8,}$/
        const phoneregex = /^\d{10}$/
        const errors = {}
        if (!values.fullname) 
            errors.fullname = 'Name is required'
        if (!values.email) 
            errors.email = 'Email is required'
        else if (!emailregex.test(values.email)) 
            errors.email = 'Invalid email format'
        if (!values.password) 
            errors.password = 'Password is required'
        else if (!passregex.test(values.password)) 
            errors.password = 'Min 8 chars, letters & numbers only'
        if (!values.confirmpass) 
            errors.confirmpass = 'Confirm password is required'
        else if (values.password !== values.confirmpass) 
            errors.confirmpass = 'Passwords do not match'
        if (!values.phone) errors.phone = 'Phone is required'
        else if (!phoneregex.test(values.phone)) 
            errors.phone = 'Enter a valid 10-digit number'
        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validate(formValues)) return
        try {
            axios.defaults.withCredentials = true
            const { data } = await axios.post(`${backendUrl}/api/auth/register`, formValues)
            if (data.success) {
                setIsLoggedin(true)
                await getUserData()
                navigate('/')
            } else {
                alert(data.message)
            }
        } catch (err) {
            alert(err.message)
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
                        Register your account to track violations, pay fines, and manage your vehicles — all in one place.
                    </p>
                    <div className="auth-brand-steps">
                        <div className="auth-step">
                            <span className="auth-step-num">01</span>
                            <span>Create your account</span>
                        </div>
                        <div className="auth-step">
                            <span className="auth-step-num">02</span>
                            <span>Wait for admin approval</span>
                        </div>
                        <div className="auth-step">
                            <span className="auth-step-num">03</span>
                            <span>Access your dashboard</span>
                        </div>
                    </div>
                </div>

                <div className="auth-form-wrap">
                    <div className="auth-card">
                        <p className="auth-eyebrow">Get started</p>
                        <h2 className="auth-title">Create Account</h2>
                        <p className="auth-sub">Free Forever — no credit card needed</p>

                        <form onSubmit={handleSubmit}>
                            <label>Full Name</label>
                            <input type="text" placeholder="Enter Name" name="fullname" value={formValues.fullname} onChange={handleChange} />
                            <p className="error">{formErrors.fullname}</p>

                            <label>Email</label>
                            <input type="text" placeholder="Enter Email" name="email" value={formValues.email} onChange={handleChange} maxLength={30}/>
                            <p className="error">{formErrors.email}</p>

                            <label>Password</label>
                            <input type="password" placeholder="Password" name="password" value={formValues.password} onChange={handleChange} />
                            <p className="error">{formErrors.password}</p>

                            <label>Confirm Password</label>
                            <input type="password" placeholder="Confirm Password" name="confirmpass" value={formValues.confirmpass} onChange={handleChange} />
                            <p className="error">{formErrors.confirmpass}</p>

                            <label>Phone No.</label>
                            <input type="tel" placeholder="10-digit phone number" name="phone" value={formValues.phone} onChange={handleChange} maxLength={10}/>
                            <p className="error">{formErrors.phone}</p>

                            <button style={{ marginTop: '8px' }} onClick={() => navigate('/')}>Create Account</button>
                        </form>
                        <div className="auth-links">
                            <p>Already have an account? <a href="login">Login</a></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Register