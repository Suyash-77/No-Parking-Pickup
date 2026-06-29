import React, { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContent } from '../context/AppContext'
import axios from 'axios'
import { USER_ROLE_LABEL, USER_STATUS, USER_STATUS_LABEL, VIOLATION_STATUS, VIOLATION_STATUS_LABEL } from '../utils/constant'
import { getViolationStatusClass } from '../utils/helpers'

const Admin = () => {
  const { backendUrl, userData } = useContext(AppContent)
  const navigate = useNavigate()

  const apiRef = useRef(null)
  if (!apiRef.current) {
    apiRef.current = axios.create({ baseURL: backendUrl, withCredentials: true })
  }
  const api = apiRef.current

  const [activeTab, setActiveTab] = useState('violations')
  const [stats, setStats] = useState(null)

  const [violations, setViolations] = useState([])
  const [vSearch, setVSearch] = useState('')
  const [vSort, setVSort] = useState('captured_at')
  const [vOrder, setVOrder] = useState('DESC')
  const [vPage, setVPage] = useState(1)
  const [vPagination, setVPagination] = useState({})
  const [vLoading, setVLoading] = useState(true)

  const [users, setUsers] = useState([])
  const [uSearch, setUSearch] = useState('')
  const [uSort, setUSort] = useState('id')
  const [uOrder, setUOrder] = useState('DESC')
  const [uPage, setUPage] = useState(1)
  const [uPagination, setUPagination] = useState({})
  const [uLoading, setULoading] = useState(true)

  const [message, setMessage] = useState({ type: '', text: '' })
  const showMessage = (type, text) => setMessage({ type, text })

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/api/dashboard-admin/stats')
      if (data.success) setStats(data.stats)
    } catch (err) {
      console.log(err.message)
    }
  }

  const fetchViolations = async () => {
    setVLoading(true)
    try {
      const { data } = await api.get('/api/dashboard-admin/violations', {
        params: { search: vSearch, sort: vSort, order: vOrder, page: vPage, limit: 10 }
      })
      if (data.success) {
        setViolations(data.violations || [])
        setVPagination(data.pagination || {})
      }
    } catch (err) {
      console.log(err.message)
      setViolations([])
    } finally {
      setVLoading(false)
    }
  }

  const fetchUsers = async () => {
    setULoading(true)
    try {
      const { data } = await api.get('/api/dashboard-admin/all-users', {
        params: { search: uSearch, sort: uSort, order: uOrder, page: uPage, limit: 10 }
      })
      if (data.success) {
        setUsers(data.users || [])
        setUPagination(data.pagination || {})
      }
    } catch (err) {
      console.log(err.message)
      setUsers([])
    } finally {
      setULoading(false)
    }
  }

  const handleStatusChange = async (id, status) => {
    try {
      const { data } = await api.put(`/api/dashboard-admin/violation-status/${id}`, { status })
      if (data.success) {
        showMessage('success', `Status updated to ${VIOLATION_STATUS_LABEL[status]}`)
        fetchViolations()
        fetchStats()
      } else {
        showMessage('error', data.message)
      }
    } catch (err) {
      showMessage('error', err.message)
    }
  }

  const handleRelease = async (id) => {
    try {
      const { data } = await api.put(`/api/dashboard-admin/release/${id}`)
      if (data.success) {
        showMessage('success', 'Vehicle released successfully')
        fetchViolations()
        fetchStats()
      } else {
        showMessage('error', data.message)
      }
    } catch (err) {
      showMessage('error', err.message)
    }
  }

  const handleApprove = async (id) => {
    try {
      const { data } = await api.put(`/api/dashboard-admin/approve-users/${id}`)
      if (data.success) {
        showMessage('success', 'User approved')
        fetchUsers()
      } else {
        showMessage('error', data.message)
      }
    } catch (err) {
      showMessage('error', err.message)
    }
  }

  const handleReject = async (id) => {
    try {
      const { data } = await api.put(`/api/dashboard-admin/reject-users/${id}`)
      if (data.success) {
        showMessage('success', 'User rejected')
        fetchUsers()
      } else {
        showMessage('error', data.message)
      }
    } catch (err) {
      showMessage('error', err.message)
    }
  }

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout')
      navigate('/login')
    } catch (err) {
      navigate('/login')
    }
  }

  useEffect(() => {
    if (!userData) return
    const timer = setTimeout(() => {
      fetchStats()
      fetchViolations()
      fetchUsers()
    }, 200)
    return () => clearTimeout(timer)
  }, [userData])

  useEffect(() => {
    if (userData) fetchViolations()
  }, [vSearch, vSort, vOrder, vPage])

  useEffect(() => {
    if (userData) fetchUsers()
  }, [uSearch, uSort, uOrder, uPage])

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

      <div className="admin-wrap">
        <div style={{ width: '100%', maxWidth: '1200px' }}>

          {message.text && (
            <div className={message.type === 'success' ? 'alert-success' : 'alert-error'}
              style={{ marginBottom: '16px' }}>
              {message.text}
            </div>
          )}

          {stats && (
            <div className="stats-grid" style={{ marginBottom: '24px' }}>
              {[
                { label: 'Total',    value: stats.total,    color: 'var(--text-primary)' },
                { label: 'Captured', value: stats.captured, color: '#fbbf24' },
                { label: 'Notified', value: stats.notified, color: '#93c5fd' },
                { label: 'Paid',     value: stats.paid,     color: 'var(--accent)' },
                { label: 'Released', value: stats.released, color: '#c4b5fd' },
              ].map(s => (
                <div className="stat-card" key={s.label}>
                  <div className="stat-number" style={{ color: s.color }}>{s.value || 0}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          <div className="tabs" style={{ marginBottom: '20px' }}>
            <button
              className={`tab-btn ${activeTab === 'violations' ? 'active' : ''}`}
              onClick={() => setActiveTab('violations')}
            >
              Violations
            </button>
            <button
              className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              Users
            </button>
          </div>

          {activeTab === 'violations' && (
            <div className="admin-card">
              <h2>All Violations</h2>

              <div className="table-controls">
                <input
                  className="search-input"
                  placeholder="Search plate, owner, location..."
                  value={vSearch}
                  onChange={e => { setVSearch(e.target.value); setVPage(1) }}
                />
                <select className="sort-select" value={vSort}
                  onChange={e => { setVSort(e.target.value); setVPage(1) }}>
                  <option value="captured_at">Date</option>
                  <option value="plate_number">Plate</option>
                  <option value="owner_name">Owner</option>
                  <option value="fine_amount">Fine</option>
                  <option value="status">Status</option>
                </select>
                <select className="sort-select" value={vOrder}
                  onChange={e => { setVOrder(e.target.value); setVPage(1) }}>
                  <option value="DESC">Newest First</option>
                  <option value="ASC">Oldest First</option>
                </select>
              </div>

              {vLoading ? (
                <div className="loading-text">Loading...</div>
              ) : violations.length === 0 ? (
                <div className="empty-state">No violations found.</div>
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
                          <th>Field Admin</th>
                          <th>Captured At</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {violations.map(v => (
                          <tr key={v.id}>
                            <td className="plate-cell">{v.plate_number}</td>
                            <td>{v.owner_name}</td>
                            <td>{v.location}</td>
                            <td className="fine-cell">₹{v.fine_amount}</td>
                            <td>
                              <span className={`status-badge ${getViolationStatusClass(v.status)}`}>
                                {VIOLATION_STATUS_LABEL[v.status]}
                              </span>
                            </td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                              {v.field_admin_name}
                            </td>
                            <td className="date-cell">
                              {new Date(v.captured_at).toLocaleString('en-IN')}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <select
                                  className="sort-select"
                                  value={v.status}
                                  onChange={e => handleStatusChange(v.id, Number(e.target.value))}
                                  disabled={v.status === VIOLATION_STATUS.RELEASED}
                                  style={{ fontSize: '0.78rem', padding: '5px 8px' }}
                                >
                                  <option value={VIOLATION_STATUS.CAPTURED}>Captured</option>
                                  <option value={VIOLATION_STATUS.NOTIFIED}>Notified</option>
                                  <option value={VIOLATION_STATUS.PAID}>Paid</option>
                                  <option value={VIOLATION_STATUS.RELEASED}>Released</option>
                                </select>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="pagination">
                    <button className="page-btn"
                      onClick={() => setVPage(p => p - 1)}
                      disabled={vPage === 1}>
                      ← Prev
                    </button>
                    {Array.from({ length: vPagination?.totalPages || 1 }, (_, i) => (
                      <button key={i + 1}
                        className={`page-btn ${vPage === i + 1 ? 'active' : ''}`}
                        onClick={() => setVPage(i + 1)}>
                        {i + 1}
                      </button>
                    ))}
                    <button className="page-btn"
                      onClick={() => setVPage(p => p + 1)}
                      disabled={vPage === vPagination?.totalPages}>
                      Next →
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="admin-card">
              <h2>All Users</h2>

              <div className="table-controls">
                <input
                  className="search-input"
                  placeholder="Search name, email, role..."
                  value={uSearch}
                  onChange={e => { setUSearch(e.target.value); setUPage(1) }}
                />
                <select className="sort-select" value={uSort}
                  onChange={e => { setUSort(e.target.value); setUPage(1) }}>
                  <option value="id">ID</option>
                  <option value="name">Name</option>
                  <option value="email">Email</option>
                  <option value="role">Role</option>
                  <option value="status">Status</option>
                </select>
                <select className="sort-select" value={uOrder}
                  onChange={e => { setUOrder(e.target.value); setUPage(1) }}>
                  <option value="DESC">Newest First</option>
                  <option value="ASC">Oldest First</option>
                </select>
              </div>

              {uLoading ? (
                <div className="loading-text">Loading...</div>
              ) : users.length === 0 ? (
                <div className="empty-state">No users found.</div>
              ) : (
                <>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(u => (
                          <tr key={u.id}>
                            <td style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                              {u.name}
                            </td>
                            <td>{u.email}</td>
                            <td>
                              <span className="status-badge">
                                {USER_ROLE_LABEL[u.role]}
                              </span>
                            </td>
                            <td>
                              <span className="status-badge">
                                {USER_STATUS_LABEL[u.status]}
                              </span>
                            </td>
                            <td>
                              <div className="action-btns">
                                <button className="btn-approve"
                                  onClick={() => handleApprove(u.id)}
                                  disabled={u.status === USER_STATUS.APPROVED}>
                                  Approve
                                </button>
                                <button className="btn-reject"
                                  onClick={() => handleReject(u.id)}
                                  disabled={u.status === USER_STATUS.REJECTED}>
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="pagination">
                    <button className="page-btn"
                      onClick={() => setUPage(p => p - 1)}
                      disabled={uPage === 1}>
                      ← Prev
                    </button>
                    {Array.from({ length: uPagination?.totalPages || 1 }, (_, i) => (
                      <button key={i + 1}
                        className={`page-btn ${uPage === i + 1 ? 'active' : ''}`}
                        onClick={() => setUPage(i + 1)}>
                        {i + 1}
                      </button>
                    ))}
                    <button className="page-btn"
                      onClick={() => setUPage(p => p + 1)}
                      disabled={uPage === uPagination?.totalPages}>
                      Next →
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default Admin