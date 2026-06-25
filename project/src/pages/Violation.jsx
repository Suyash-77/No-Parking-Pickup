import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
    VIOLATION_STATUS,
    VIOLATION_STATUS_LABEL
} from '../utils/constant.js'

const ViolationPage = () => {
    const { plate } = useParams()
    const navigate = useNavigate()
    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const [violation, setViolation] = useState(null)
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState({
        type: '',
        text: ''
    })

    useEffect(() => {
        if (plate) {
            fetchViolation()
        }
    }, [plate])

    const fetchViolation = async () => {
        try {
            const { data } = await axios.get(
                `${backendUrl}/api/violation/plate/${plate}`
            )
            if (data.success && data.violation) {
                setViolation(data.violation)
            } else {
                setMessage({
                    type: 'error',
                    text: 'No active violation found.'
                })
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: 'Failed to load violation details.'
            })
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <>
                <div className="nav">
                    <div className="logo">
                        No Parking Pickup
                    </div>
                </div>
                <div className="main1">
                    <div className="loading-text">
                        Loading violation details...
                    </div>
                </div>
            </>
        )
    }
    if (!violation) {
        return (
            <>
                <div className="nav">
                    <div className="logo">
                        No Parking Pickup
                    </div>
                </div>
                <div className="main1">
                    <div className="violation-card"
                        style={{ maxWidth: '600px',
                            margin: '0 auto'
                        }} >
                        <h2>No Violation Found</h2>
                        <p style={{ marginTop: '10px',
                                color: 'var(--text-muted)' }} >
                            Plate Number: {plate}
                        </p>
                        <div className="error">
                            {message.text}
                        </div>
                        <button style={{ marginTop: '20px' }} onClick={() => navigate('/')} > Back to Home </button>
                    </div>
                </div>
            </>
        )
    }
    return (
        <>
            <div className="nav">
                <div className="logo">
                    No Parking Pickup
                </div>
                <div className="nav-right">
                    <button
                        className="btn-logout"
                        onClick={() => navigate('/')}  >
                        Back To Home
                    </button>
                </div>
            </div>
            <div className="main1">
                <div className="violation-page">
                    <div className="violation-grid">
                        <div className="violation-card">
                            <h2 style={{ marginBottom: '24px' }}  >
                                Violation Details
                            </h2>
                            <div className="plate-box">
                                 {violation.plate_number}
                            </div>
                            <div className="info-row">
                                <span className="info-label">  Owner Name</span>
                                <span className="info-value"> {violation.owner_name} </span>
                            </div>

                            <div className="info-row">
                                <span className="info-label">
                                    Vehicle Location
                                </span>

                                <span className="info-value">
                                    {violation.location}
                                </span>
                            </div>

                            <div className="info-row">
                                <span className="info-label">
                                    Violation Status
                                </span>

                                <span
                                    className={`status-badge status-${VIOLATION_STATUS_LABEL[
                                        violation.status
                                    ]}`}>
                                    { VIOLATION_STATUS_LABEL[violation.status] }
                                </span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">
                                    Captured At
                                </span>
                                <span className="info-value">
                                    {new Date( violation.captured_at ).toLocaleString('en-IN')}
                                </span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">  Plate Number </span>
                                <span className="info-value"> {violation.plate_number} </span>
                            </div>
                        </div>
                        <div className="vehicle-card">
                            <h3 style={{ marginBottom: '20px'  }}> Fine Summary </h3>
                            <div className="fine-box">
                                <p>Total Fine</p>
                                <h2> ₹{violation.fine_amount} </h2>
                            </div>
                            <a href={'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(violation.location)} target="_blank" rel="noopener noreferrer" className="map-btn" >
                                Open Vehicle Location
                            </a>
                            {violation.status === VIOLATION_STATUS.RELEASED ? (
                                <div className="alert-success" style={{
                                        marginTop: '20px' }}>
                                    Vehicle Released.
                                    Please collect it from
                                    the yard.
                                </div>
                            ) : violation.status === VIOLATION_STATUS.PAID ? (
                                <div className="alert-success" style={{ marginTop: '20px' }}>
                                    Payment Received.
                                    Awaiting release.
                                </div>
                            ) : (
                                <button className="pay-btn" onClick={() => navigate( `/payment/${violation.plate_number}`)}>
                                    Pay ₹
                                    { violation.fine_amount  }
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ViolationPage