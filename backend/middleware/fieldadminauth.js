import jwt from 'jsonwebtoken'
import userModal from '../modal/userModal.js'
import { USER_ROLE } from '../config/constants.js'
import { sendError, sendSuccess } from '../config/response.js'

const fildadminauth = async (req, res, next)=>{
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1]

    if(!token){
        return sendError(res, 401, 'Not Authorized, login again')
    }

    try {
        const decodedtoken = jwt.verify(token, process.env.JWT_SECRET)

        if(decodedtoken.role !== USER_ROLE.FIELD_ADMIN){
            return sendError(res, 403, 'Access Denied, Field Admin privileges required')
        }
        req.fieldAdminId = decodedtoken.id;
        next();
    } catch (error) {
        return sendError(res, 401, 'Session Expired, login again')
    }
}

export default fildadminauth