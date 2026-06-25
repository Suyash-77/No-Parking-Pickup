import express from 'express'
import adminauth from '../middleware/dashboardadminauth.js'
import {  approveusersaccount, getalluserslist, rejectUserAccount, getAllViolations, releaseVehicle, getStats, updateViolationStatus } from '../controller/dashboardadmincontroller.js';


const dashboardadminrouter = express.Router();
dashboardadminrouter.use(adminauth);

dashboardadminrouter.get('/all-users', getalluserslist);
dashboardadminrouter.put('/approve-users/:id', approveusersaccount);
dashboardadminrouter.put('/reject-users/:id', rejectUserAccount);
dashboardadminrouter.get('/violations', getAllViolations)
dashboardadminrouter.put('/release/:id', releaseVehicle)
dashboardadminrouter.get('/stats', getStats)
dashboardadminrouter.put('/violation-status/:id', updateViolationStatus)

export default dashboardadminrouter;