import React, { useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContent } from '../context/AppContext'
import axios from 'axios'

const Resetpassword = () => {
    const navigate = useNavigate()
    const { backendUrl, setIsLoggedin } = useContext(AppContent)

    const [email, setEmail] = useState('')
    const [newpassword, setNewpassword] = useState('')
    const [isEmailSent, setIsEmailSent] = useState(false)
    const [code, setCode] = useState('')
    const [isOtpVerified, setIsOtpVerified] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        axios.defaults.withCredentials = true
    }, [])

    const handleEmailSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const { data } = await axios.post(
                `${backendUrl}/api/auth/send-reset-otp`,
                { email }
            )

            if (data.success) {
                setIsEmailSent(true)
            } else {
                setError(data.message)
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleCodeChange = (e) => {
        const value = e.target.value.replace(/\D/g, '')
        setCode(value)
    }

    const handleOtpSubmit = async (e) => {
        e.preventDefault()

        if (code.length !== 6) {
            setError('OTP must be 6 digits')
            return
        }

        setLoading(true)

        try {
            const { data } = await axios.post(
                `${backendUrl}/api/auth/verify-reset-otp`,
                {
                    email,
                    otp: code
                }
            )

            if (data.success) {
                setIsOtpVerified(true)
            } else {
                setError(data.message)
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message)
        } finally {
            setLoading(false)
        }
    }

    const handlePasswordSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const { data } = await axios.post(
                `${backendUrl}/api/auth/reset-password`,
                {
                    email,
                    otp: code,
                    newPassword: newpassword
                }
            )

            if (data.success) {
                setIsLoggedin(false)
                localStorage.removeItem('token')
                navigate('/login')
            } else {
                setError(data.message)
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <div className="nav">
                <div className="logo">
                    <h1>No Parking Pickup</h1>
                </div>
            </div>

            <div className="reset-page">

                <div className="reset-left">
                    <span className="reset-tag">
                        Account Recovery
                    </span>

                    <h1 className="reset-brand-title">
                        Reset Your
                        <span className="green"> Password</span>
                    </h1>

                    <p className="reset-brand-desc">
                        Securely recover access to your account.
                        Follow the simple 3-step process to verify your
                        identity and create a new password.
                    </p>

                    <div className="reset-features">
                        <div className="reset-feature">
                            <span>01</span>
                            Verify Email
                        </div>

                        <div className="reset-feature">
                            <span>02</span>
                            Enter OTP
                        </div>

                        <div className="reset-feature">
                            <span>03</span>
                            Create Password
                        </div>
                    </div>
                </div>

                <div className="reset-right">
                    <div className="resetcard">
                        <div className="resetsteps">
                            <span className={!isEmailSent ? 'active' : 'done'}></span>
                            <span className={isEmailSent && !isOtpVerified ? 'active' : isOtpVerified ? 'done'  : '' }></span>
                            <span className={isOtpVerified ? 'active' : ''}></span>
                        </div>

                        {!isEmailSent && (
                            <form onSubmit={handleEmailSubmit}>
                                <h1>Step 1 of 3</h1>
                                <h2>Reset Password</h2>
                                <p>
                                    Enter your registered email address.
                                </p>

                                <div>
                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        placeholder="Enter email"
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                    />
                                </div>
    {error && ( <p className="error">{error}</p> )}
<button type="submit">
 {loading ? 'Sending...'  : 'Send OTP'}  </button>
                            </form>
                         )}
                        {isEmailSent && !isOtpVerified && (
                            <form onSubmit={handleOtpSubmit}>
                                <h1>Step 2 of 3</h1>
                                <h2>Verify OTP</h2>
                                <p>
                                    Enter the code sent to {email}
                                </p>
                                <div>
                                    <label>OTP</label>
                                    <input
                                        className="otp-input"
                                        value={code}
                                        maxLength="6"
                                        placeholder="000000"
                                        onChange={handleCodeChange}
                                    />
                                </div>
                                {error && (
                                    <p className="error">{error}</p>
                                )}

                                <button type="submit">
                                    {loading  ? 'Verifying...'  : 'Verify OTP'}
                                </button>
                            </form>
                        )}
                        {isOtpVerified && (
                            <form onSubmit={handlePasswordSubmit}>
                                <h1>Step 3 of 3</h1>
                                <h2>Create Password</h2>
                                <p>
                                    Choose a strong password.
                                </p>
                                <div>
                                    <label>New Password</label>

                                    <input
                                        type="password"
                                        placeholder="Enter password"
                                        value={newpassword}
                                        onChange={(e) =>
                                            setNewpassword(
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>
                                {error && ( <p className="error">{error}</p>
                                )}
                                <button type="submit">
                                    {loading ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}

export default Resetpassword