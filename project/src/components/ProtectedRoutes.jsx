import { useContext, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { AppContent } from '../context/AppContext'

const ProtectedRoutes = ({ children, allowedRole }) => {
    const { userData, isLoggedin } = useContext(AppContent)
    const [checking, setChecking] = useState(true)

    useEffect(() => {
        if (userData !== false) {
            setChecking(false)
        }
    }, [userData])

    if (checking) return null

    if (!isLoggedin) return <Navigate to='/login' />

    if (userData?.role !== allowedRole) return <Navigate to='/' />

    return children
}

export default ProtectedRoutes