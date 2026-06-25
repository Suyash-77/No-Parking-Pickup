import jwt from 'jsonwebtoken'
import { USER_ROLE } from '../config/constants.js';
import { sendError, sendSuccess } from '../config/response.js';

const adminauth = async(req, res, next)=>{
    try {
const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];        
        if (!token) {
            return sendError(res, 401, "Not Authorized. Please login first." );
        }

        const decodedtoken = jwt.verify(token, process.env.JWT_SECRET);

        if(decodedtoken.role !== USER_ROLE.DASHBOARD_ADMIN){
            return sendError(res, 403, 'Access Denied. Admin priveliges required');
        }

        req.dashboardAdminId = decodedtoken.id;
        next();
    } catch (error) {
    
    return sendError(res, 401, "Session expired or invalid token. Please login again." );
    }
}

export default adminauth;