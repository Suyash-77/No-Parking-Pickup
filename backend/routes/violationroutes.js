import express from 'express'
import { getViolation, checkViolationByPlate, payViolation } from '../controller/violationcontroller.js'

const violationrouter = express.Router()

violationrouter.get('/check/:plate', checkViolationByPlate)
violationrouter.get('/plate/:plate', checkViolationByPlate)
violationrouter.post('/pay/:plate', payViolation)
violationrouter.get('/:id', getViolation)
violationrouter.post('/pay/:id', payViolation)         

export default violationrouter