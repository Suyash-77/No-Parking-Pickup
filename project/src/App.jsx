import React from 'react'
import './css/Register.css'
import Register from './pages/Register'
import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Home from './pages/Home'
import Emailverify from './pages/Emailverify'
import Resetpassword from './pages/Resetpassword'
import Admin from './pages/Admin'
import ProtectedRoutes from './components/ProtectedRoutes'
import FieldAdmin from './pages/FieldAdmin'
import ViolationPage from './pages/Violation'
import Payment from './pages/Pay.jsx'
import { USER_ROLE } from './utils/constant.js'
import './css/Home.css'
import Profile from './pages/Profile.jsx'
import AddVehicle from './pages/AddVehicle.jsx'

const App = () => {
  return (
    <div>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/login' element={<Login/>}/>
        <Route path='/register' element={<Register/>}/>
        <Route path='/emailverify' element={<Emailverify/>}/>
        <Route path='/resetpassword' element={<Resetpassword/>}/>
        <Route path='/fieldadmin' element={<ProtectedRoutes allowedRole={USER_ROLE.FIELD_ADMIN}><FieldAdmin/></ProtectedRoutes>}/>

        <Route path='/admin' element={
          <ProtectedRoutes allowedRole={USER_ROLE.DASHBOARD_ADMIN}><Admin/></ProtectedRoutes>
        } />  

        <Route path='/violation/plate/:plate' element={<ViolationPage />} />    
        <Route path='/payment/:plate' element={<Payment />} />  
        <Route path='/profile' element={<Profile />} />  
        <Route path='/addVehicle' element={<AddVehicle />} />
      
             </Routes>
    </div>

  )
}

export default App
