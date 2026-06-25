import express from 'express'
import { getVehicleByPlate, addVehicle, updateVehicle } from '../controller/vehiclecontroller.js'

const vehiclerouter = express.Router()

vehiclerouter.get('/:plate', getVehicleByPlate)
vehiclerouter.post('/add', addVehicle)
vehiclerouter.put('/update', updateVehicle)

export default vehiclerouter