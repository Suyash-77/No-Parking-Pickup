import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContent } from '../context/AppContext';
import axios from 'axios';

axios.defaults.withCredentials = true;

const Emailverify = () => {
    const navigate = useNavigate();
    const { backendUrl, setIsLoggedin, getUserData } = useContext(AppContent);

    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const hasSentOtp = useRef(false);

    useEffect(() => {
        if (hasSentOtp.current) return;
        hasSentOtp.current = true;

        const sendOtpEmail = async () => {
            try {
                await axios.post(`${backendUrl}/api/auth/send-verify-otp`);
            } catch (err) {
                console.error("Failed to send OTP automatically:", err.message);
            }
        };

        sendOtpEmail();
    }, [backendUrl]);

    const handleCodeChange = (e) => {
        const value = e.target.value.replace(/\D/g, '');
        setCode(value);
        if (value.length === 6) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!code) { setError("OTP code is required"); return; }
        if (code.length !== 6) { setError("OTP must be exactly 6 digits"); return; }

        setLoading(true);
        try {
            const { data } = await axios.post(
                `${backendUrl}/api/auth/verify-account`,
                { optCode: code },
                { withCredentials: true }
            );

            if (data.success) {
                setIsLoggedin(true);
                await getUserData();
                navigate("/");
            } else {
                setError(data.message || "Verification failed");
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Server connectivity issue");
        } finally {
            setLoading(false);
        }
    };


return (
    <>
        <div className="nav">
            <div className="logo">
                <h1>No Parking Pickup</h1>
            </div>
        </div>
        <div className="verify-page">
            <div className="verify-left">

                <span className="verify-tag">
                    Account Security
                </span>
                <h1 className="verify-title"> Verify Your
                    <span className="green"> Email</span>
                </h1>
                <p className="verify-desc">
                    We have sent a 6-digit verification code
                    to your registered email address.
                    Enter the code to activate your account.
                </p>
                <div className="verify-steps">
                    <div className="verify-step">
                        <span>01</span>
                        OTP sent to your email
                    </div>
                    <div className="verify-step">
                        <span>02</span>
                        Enter the verification code
                    </div>
                    <div className="verify-step">
                        <span>03</span>
                        Activate your account
                    </div>
                </div>
            </div>
            <div className="verify-right">
                <div className="verify-card">
                    <h2>Verify Email</h2>
                    <p> Enter the 6-digit code sent to your email. </p>
                    <form onSubmit={handleSubmit}>
                        <input
                            className="otp-input"
                            type="text"
                            placeholder="000000"
                            maxLength="6"
                            value={code}
                            onChange={handleCodeChange}
                            disabled={loading} />
                        {error && ( <p className="error"> {error} </p> )}
                        <button type="submit" disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify Account'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </>
)
};
export default Emailverify;