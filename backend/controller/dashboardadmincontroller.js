import userModal from "../modal/userModal.js";
import { VIOLATION_STATUS } from "../config/constants.js";
import { STATUS_CODES } from "../config/statusCode.js";
import { sendError, sendSuccess } from "../config/response.js";

export const getalluserslist = async (req, res) => {
    try {
        const { search = '', sort = 'id', order = 'DESC', page = 1, limit = 10 } = req.query
        const [users, total] = await Promise.all([
            userModal.getallusers(search, sort, order, parseInt(page), parseInt(limit)),
            userModal.getUsersCount(search)
        ]);
        return sendSuccess(res, 200, undefined,{
            users,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        return sendError(res, 500, error.message )
    }
};

export const approveusersaccount = async (req, res) => {
    try {
        const userId = req.params.id;

        if (!userId) {
            return sendError(res, 400, 'Userid parameter is missing' );
        }

        const result = await userModal.approveusers(userId);

        if (result.affectedRows === 0) {
            return sendError(res, 404, "User not found or status already updated" );
        }

        return sendSuccess(
           res, 200,"", "User account approved successfully!"
        );
    } catch (error) {
        return sendError(res, 500, error.message || "Failed to approve user account"
        );
    }
};

export const rejectUserAccount = async (req, res) => {
    try {
        const userId = req.params.id;

        if (!userId) {
            return sendError(res, 400, "User ID parameter is missing" );
        }

        const result = await userModal.rejectusers(userId);

        if (result.affectedRows === 0) {
            return sendError(res, 404, "User not found or status already updated" );
        }

        return sendError(
            res, 200, "User account rejected successfully."
        );
    } catch (error) {
        return sendError( res, 500, error.message || "Failed to reject user account"
        );
    }
};

export const getAllViolations = async (req, res) => {
    try {
        const { search = '', sort = 'captured_at', order = 'DESC', page = 1, limit = 10 } = req.query
        const [violations, total] = await Promise.all([
            userModal.getAllViolations(search, sort, order, parseInt(page), parseInt(limit)),
            userModal.getViolationsCount(search)
        ])
        return sendSuccess(res, 200, undefined,{
            violations,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
    })
    } catch (error) {
        return sendError(res, 500, error.message )
    }
};

export const releaseVehicle = async (req, res) => {
    try {
        const { id } = req.params
        const result = await userModal.releaseVehicle(id, req.dashboardAdminId)
        if (result.affectedRows === 0) {
            return sendError(res, 404, 'Vehicle not found or fine not paid yet' )
        }
        return sendSuccess( res, 200,"", 'Vehicle released successfully' )
    } catch (error) {
        return sendError(res, 500, error.message )
    }
};

export const getStats = async (req, res) => {
    try {
        const stats = await userModal.getViolationStats()
        return sendSuccess(res, 200, undefined, { stats })
    } catch (error) {
        return sendError(res, 500, error.message)
    }
};

const STATUS_LABELS = {
    [VIOLATION_STATUS.CAPTURED]: 'Captured',
    [VIOLATION_STATUS.NOTIFIED]: 'Notified',
    [VIOLATION_STATUS.PAID]: 'Paid',
    [VIOLATION_STATUS.RELEASED]: 'Released'
};

export const updateViolationStatus = async (req, res) => {
    try {

        const { id } = req.params;
        const { status } = req.body;

        const numericStatus = Number(status);

        const allowedStatuses =
            Object.values(VIOLATION_STATUS);

        if (!allowedStatuses.includes(numericStatus)) {
            return sendError(
              res, 400, 'Invalid status'
            );
        }

        const result =
            await userModal.updateViolationStatus(
                id,
                numericStatus
            );

        if (result.affectedRows === 0) {
            return sendError(
                 res, 404, 'Violation not found'
            );
        }

        return sendSuccess(
            res, 200,"", `Status updated to ${STATUS_LABELS[numericStatus]}`
        );

    } catch (error) {

        return sendError( res, 500, error.message);

    }
};