import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { VIOLATION_STATUS, VIOLATION_STATUS_LABEL } from '../utils/constant.js'
import generateReceipt from '../utils/generateReceipt.js'

const Payment = () => {
    const { plate } = useParams()
    const navigate = useNavigate()
    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const [violation, setViolation] = useState(null)
    const [loading, setLoading] = useState(true)
    const [payLoading, setPayLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [showConfirm, setShowConfirm] = useState(false)
    const [receipt, setReceipt] = useState(null)

    useEffect(() => { if (plate) fetchViolation() }, [plate])

    const fetchViolation = async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/pay/plate/${plate}`)
            if (data.success) {
                setViolation(data.violation)
            } else {
                setMessage({ type: 'error', text: 'No active violation found for this plate.' })
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to load violation.' })
        } finally {
            setLoading(false)
        }
    }

    const handlePay = async () => {
        setPayLoading(true)
        setMessage({ type: '', text: '' })
        try {
            const { data } = await axios.post(`${backendUrl}/api/pay/plate/${plate}`)
            if (data.success) {
                setMessage({ type: 'success', text: data.message })
                setShowConfirm(false)
                setReceipt(data.receipt)
                fetchViolation()
            } else {
                setMessage({ type: 'error', text: data.message })
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.message })
        } finally {
            setPayLoading(false)
        }
    }
    const downloadReceipt = () => {generateReceipt(receipt)}

    if (loading) {
        return (
            <div className="violation-page-root">
                <div className="nav"><div className="logo">No Parking Pickup</div></div>
                <div className="vp-center">
                    <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
                </div>
            </div>
        )
    }

    if (!violation) {
        return (
            <div className="violation-page-root">
                <div className="nav"><div className="logo">No Parking Pickup</div></div>
                <div className="vp-center">
                    <div className="vp-card">
                        <div className="vp-icon-wrap">💳</div>
                        <h2 className="vp-title">No Violation Found</h2>
                        <p className="vp-sub">Plate — <strong>{plate}</strong></p>
                        <div className="alert-error">{message.text}</div>
                        <button onClick={() => navigate('/')} style={{ marginTop: '16px' }}>Back to Home</button>
                    </div>
                </div>
            </div>
        )
    }

   
return (
    <>
        <div className="nav">
            <div className="logo">No Parking Pickup</div>
            <div className="nav-right">
                <button className="btn-logout" onClick={() => navigate('/')} >Back To Home</button>
            </div>
        </div>

        <div className="main1">
            <div className="payment-page">
                {message.text && (
                    <div className={message.type === 'success' ? 'alert-success' : 'alert-error'}
                        style={{ marginBottom: '20px' }} >
                        {message.text}
                    </div>
                )}

                <div className="payment-grid-3">
                    <div className="payment-card">
                        <h2 className="payment-title">
                            Vehicle Details
                        </h2>
                        <div className="payment-plate">
                            {violation.plate_number}
                        </div>
                        <div className="payment-row">
                            <span className="payment-label">
                                Owner
                            </span>
                            <span className="payment-value">
                                {violation.owner_name}
                            </span>
                        </div>
                        <div className="payment-row">
                            <span className="payment-label">
                                Location
                            </span>
                            <span className="payment-value">
                                {violation.location}
                            </span>
                        </div>
                        <div className="payment-row">
                            <span className="payment-label">
                                Status
                            </span>
                            <span className="payment-value">
                                {VIOLATION_STATUS_LABEL[violation.status]}
                            </span>
                        </div>
                    </div>
                    <div className="summary-card">
                        <h2 className="payment-title">
                            Payment Summary
                        </h2>
                        <div className="amount-box">
                            <p>Total Fine</p>
                              <h2> ₹{violation.fine_amount} </h2>
                        </div>
                        {violation.status === VIOLATION_STATUS.RELEASED ? (
                            <div className="alert-success"> Vehicle Released </div>
                        ) : violation.status === VIOLATION_STATUS.PAID ? (
                            <div className="alert-success"> Payment Received </div>
                        ) : !showConfirm ? (
                            <button className="pay-btn" onClick={() => setShowConfirm(true)}> Pay ₹{violation.fine_amount} </button>
                        ) : (
                            <div className="receipt-card">
                                <h4 style={{ marginBottom:'12px'}} > Confirm Payment</h4>
                                <p> Plate: { violation.plate_number } </p>
                                <p> Amount:₹ {violation.fine_amount} </p>
                                <div style={{
                                        display:'flex',
                                        gap: '10px',
                                        marginTop:'16px'
                                        }} >
                                    <button onClick={handlePay } disabled={ payLoading }> {payLoading ? 'Processing...' : 'Confirm'} </button>
                                    <button className="btn-logout" onClick={() => setShowConfirm(false)}>Cancel</button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="summary-card">
                        <h2 className="payment-title">  Receipt </h2>
                        {!receipt ? ( <div className="empty-state"  >
                                Receipt will appear
                                here after payment.
                            </div>
                        ) : (
                            <div className="receipt-card" >
                                <div className="receipt-row">
                                    <strong> Receipt No </strong>
                                    <br />
                                    { receipt.receipt_number }
                                </div>
                                <div className="receipt-row">
                                    <strong> Transaction</strong> <br />
                                    { receipt.transaction_id }
                                </div>
                                <div className="receipt-row">
                                    <strong> Amount </strong>
                                    <br />
                                    ₹{ receipt.fine_amount }
                                </div>
                                <div className="receipt-row">
                                    <strong> Paid At</strong>
                                    <br />
                                    {receipt.paid_at}
                                </div>

                                <button style={{ marginTop:'16px'}}
                                    onClick={downloadReceipt} >
                                    Download Receipt
                                </button>
                            </div> )}
                    </div>
                </div>
            </div>
        </div>
    </>
)
}

export default Payment