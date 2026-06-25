import userModal from "../modal/userModal.js";
import { STATUS_CODES } from "../config/statusCode.js";
import { sendError, sendSuccess } from "../config/response.js";

export const getVehicleByPlate = async (req, res) => {
    try {
        const { plate } = req.params
        const vehicle = await userModal.findVehicleByPlate(plate.toUpperCase())
        if (!vehicle) {
            return sendError(res, 400, 'Vehicle not Found')
        }
        return sendSuccess(res, 200, null, { vehicle })
    } catch (error) {
        return sendError(res, 500, error.message)
    }
}

export const addVehicle = async (req, res) => {
    try {
        const {plate_number, owner_name, owner_email, owner_phone, make, model, color} = req.body
        const existing = await userModal.findVehicleByPlate(plate_number.toUpperCase())
        if(existing){
            return sendError(res, 409, `Vehicle with plate ${plate_number.toUpperCase()} already exists in database`)
        }
        const id = await userModal.addVehicle(plate_number.toUpperCase(), owner_name, owner_email, owner_phone, make, model, color)
        return sendSuccess(res, 200, 'Vehicle added', {id})
    } catch (error) {
        return sendError(res, 500, error.message)
    }
}

export const updateVehicle = async (req, res) => {
  try {
    const { id, owner_name, owner_email, owner_phone, make, model, color } = req.body
    if (!id) return sendError(res, 400, 'Vehicle ID is required')
    await userModal.updateVehicle(id, owner_name, owner_email, owner_phone, make, model, color)
    return sendSuccess(res, 200, 'Vehicle updated', {})
  } catch (error) {
    return sendError(res, 500, error.message)
  }
}

