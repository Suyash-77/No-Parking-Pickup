import userModal from "../modal/userModal.js";
import { VIOLATION_STATUS } from "../config/constants.js";
import { STATUS_CODES } from "../config/statusCode.js";
import { sendError, sendSuccess } from "../config/response.js";

const normalizePlate = (plate) => plate.trim().toUpperCase().replace(/\s+/g, '')

export const getViolationForPayment = async (req, res) => {
    try {
        const plate = normalizePlate(req.params.plate)
        const violation = await userModal.getViolationByPlate(plate)

        if (!violation) {
            return sendError(res, 404, 'No active violation found for this plate.' )
        }

        return sendSuccess(res, 200, null, {violation })
    } catch (error) {
        return sendError(res, 500, error.message )
    }
}

export const payViolationByPlate = async (req, res) => {
    try {
        const plate = normalizePlate(req.params.plate)
        const violation = await userModal.getViolationByPlate(plate)

        if (!violation) {
            return sendError(res, 404, 'Violation not found' )
        }

        if (violation.status === VIOLATION_STATUS.RELEASED) {
            return sendError(res, 400, 'Vehicle already released' )
        }

        if (violation.status === VIOLATION_STATUS.PAID) {
            return sendError(res, 400, 'Fine already paid' )
        }

        const txnId = `TXN${Date.now()}`
        const { receiptNumber } = await userModal.createPayment(violation.id, violation.fine_amount)
        await userModal.confirmPayment(violation.id, txnId)

        return sendSuccess(res, 200, 'Payment Successful! Your Vehicle will be released shortly!',
{
            receipt: {
                receipt_number: receiptNumber,
                transaction_id: txnId,
                plate_number: violation.plate_number,
                owner_name: violation.owner_name,
                fine_amount: violation.fine_amount,
                paid_at: new Date().toLocaleString('en-IN')
            }
        })
    } catch (error) {
        return sendError(res, 500, error.message )
    }
}