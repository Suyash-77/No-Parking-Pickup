import userModal from "../modal/userModal.js";
import { STATUS_CODES } from "../config/statusCode.js";
import { sendError, sendSuccess } from "../config/response.js";

export const getUserData = async(req, res)=>{
    try{
        const {userId} = req.body;

        const user = await userModal.findById(userId);

        if(!user){
            return sendError(res, 400, 'user not found');
        }

        return sendSuccess(res, 200, null,{
            userdata: user
        });
    }
    catch(error){
        return sendError(res, 500, error.message);
    }
}

export const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.body
    const { name, phone } = req.body
    if (!name?.trim() || !phone?.trim()) {
      return sendError(res, 400, 'Name and phone are required')
    }
    await userModal.updateUserProfile(userId, name.trim(), phone.trim())
    const updated = await userModal.findById(userId)
    return sendSuccess(res, 200, 'Profile updated', { userdata: updated })
  } catch (error) {
    return sendError(res, 500, error.message)
  }
}

export const getMyVehicles = async (req, res) => {
  try {
    const { userId } = req.body
    const user = await userModal.findById(userId)
    if (!user) return sendError(res, 400, 'User not found')
    const vehicles = await userModal.getVehiclesByEmail(user.email)
    return sendSuccess(res, 200, null, { vehicles })
  } catch (error) {
    return sendError(res, 500, error.message)
  }
}