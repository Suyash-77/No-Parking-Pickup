import userModal from '../modal/userModal.js'
import { VIOLATION_STATUS } from '../config/constants.js'
import { STATUS_CODES } from '../config/statusCode.js'
import { sendError, sendSuccess } from '../config/response.js'

const normalizePlate = (plate) => plate.trim().toUpperCase().replace(/\s+/g, '')

export const checkViolationByPlate = async (req, res) => {
  try {
    const plate = normalizePlate(req.params.plate)
    const violation = await userModal.getViolationByPlate(plate)
    return sendSuccess(res, 200, null,{violation })
  } catch (error) {
    return sendError(res, 500, error.message )
  }
}

export const getViolation = async (req, res) =>{
    try {
        const { id } = req.params
        const violation = await userModal.getViolationById(id)
        if (!violation){
            return sendError(res, 400, 'Violation not found')
        }
        return sendSuccess(res, 200, null,{ violation})
    } catch (error) {
        return sendError(res, 500, error.message)
    }
}

export const payViolation = async (req, res) => {
    try {
        const { id } = req.params
        const { transaction_id } = req.body

        const violation = await userModal.getViolationById(id)
        if (!violation) {
            return sendError( res, 400, 'Violation not found' )
        }

        if (violation.status === VIOLATION_STATUS.RELEASED) {
            return sendError(res, 404, 'Vehicle already released' )
        }

        if (violation.status === VIOLATION_STATUS.PAID) {
            return sendError(res, 404, 'Fine already paid' )
        }

        await userModal.createPayment(id, violation.fine_amount)

        await userModal.confirmPayment(id, transaction_id || `TXN${Date.now()}`)

        sendSuccess(res, 200,"", 'Payment successful! Vehicle will be released shortly.' )
    } catch (err) {
        sendError(res, 500, err.message )
    }
}