import express from 'express'
import { getViolationForPayment, payViolationByPlate } from '../controller/paycontroller.js'

const payrouter = express.Router()

payrouter.get('/plate/:plate', getViolationForPayment)
payrouter.post('/plate/:plate', payViolationByPlate)

export default payrouter