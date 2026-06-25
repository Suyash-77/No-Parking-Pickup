import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContent } from '../context/AppContext'
import axios from 'axios'
import { USER_ROLE } from '../utils/constant'

const Home = () => {
  const navigate = useNavigate()
  const { userData, backendUrl, setUserData, setIsLoggedin } = useContext(AppContent)
  const [plate, setPlate] = useState('')

  const logout = async () => {
    try {
      axios.defaults.withCredentials = true
      const { data } = await axios.post(backendUrl + '/api/auth/logout')
      if (data.success) {
        setIsLoggedin(false)
        setUserData(false)
        navigate('/')
      }
    } catch (error) {
      alert(error.message)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const clean = plate.trim().toUpperCase().replace(/\s/g, '')
    if (clean) navigate(`/violation/plate/${clean}`)
  }

  return (
    <div>
      {userData && !userData.is_verified && (
    <div style={{
        background: '#fef3c7',
        borderBottom: '1px solid #fbbf24',
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        fontSize: '0.9rem',
        color: '#92400e'
    }}>
        <span>⚠️ Your email is not verified.</span>
        <button
            onClick={() => navigate('/emailverify')}
            style={{
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '5px 14px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.85rem',
                width: 'fit-content',
                flexShrink: 0
            }}
        >
            Verify Email
        </button>
    </div>
)}
      <nav className="nav">
        <div className="logo">No Parking Pickup</div>
        <div className="nav-right">
          {userData ? (
            <>
              <span className="nav-admin-name">{userData.name}</span>
              <div className="namelogo">
                {userData.name[0].toUpperCase()}
                <div className="list">
                  <ul>
                    <li onClick={() => navigate('/profile')}>Profile</li>
                    {(userData.role === USER_ROLE.USER || userData.role === USER_ROLE.DASHBOARD_ADMIN) && (
                      <li onClick={() => navigate('/addvehicle')}>Add Vehicle Details</li>
                    )}
                    {userData.role === USER_ROLE.FIELD_ADMIN && (
                      <li onClick={() => navigate('/fieldadmin')}>Dashboard</li>
                    )}
                    {userData.role === USER_ROLE.DASHBOARD_ADMIN && (
                      <li onClick={() => navigate('/admin')}>Dashboard</li>
                    )}
                    <li onClick={logout}>Logout</li>
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <button className="login-btn" onClick={() => navigate('/login')}>Login</button>
          )}
        </div>
      </nav>

      <div className="hero">
        <div className="orb orb-green" />
        <div className="orb orb-purple" />

        <div className="hero-content">
          <p className="tag">India's No Parking Management</p>

          <h1 className="title">
            Find your violation.<br />
            Pay the fine.<br />
            <span className="green">Get your vehicle back.</span>
          </h1>

          <p className="desc">
            Enter your plate number to check if your vehicle has been picked up
            and pay the fine online.
          </p>

          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              className="plate-input"
              placeholder="Enter plate Number('RJ14CD1234')"
              value={plate}
              onChange={e => setPlate(e.target.value.toUpperCase())}
              maxLength={12}
              autoComplete="off"
              spellCheck={false}
            />
            <button type="submit" className="search-btn" disabled={!plate.trim()}>
              Check Violation
            </button>
          </form>

          <p className="hint">Spaces don't matter — RJ14AB1234 and RJ14 AB 1234 both work</p>
        </div>
      </div>

      <div className="steps">
        <div className="step">
          <span className="step1">01</span>
          <h3>Search your plate</h3>
          <p>Enter your vehicle's plate number to pull up the violation details and fine amount.</p>
        </div>
        <div className="step">
          <span className="step1">02</span>
          <h3>Pay online</h3>
          <p>Pay the fine securely. You'll get a confirmation once the payment goes through.</p>
        </div>
        <div className="step">
          <span className="step1">03</span>
          <h3>Vehicle released</h3>
          <p>Our team gets notified and releases your vehicle from the yard.</p>
        </div>
      </div>

      <footer className="footer">
        <span>&copy; 2026 No Parking Pickup</span>
      </footer>

    </div>
  )
}

export default Home