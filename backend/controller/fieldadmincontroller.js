import userModal from "../modal/userModal.js";
import transporter from "../config/nodemailer.js";
import { sendWhatsAppMessage } from "../config/whatsapp.js";
import { STATUS_CODES } from "../config/statusCode.js";
import { sendError, sendSuccess } from "../config/response.js";

export const captureVehicle = async (req, res)=>{
    try {
        const {plate_number, location, fine_amount} = req.body
        const image_url = req.file ? req.file.path : null
        const captured_by = req.fieldAdminId

        const vehicle = await userModal.findVehicleByPlate(plate_number.toUpperCase())
        if(!vehicle){
            return sendError(res, 404, 'vehicle not found in Database')
        }

        const activeViolation = await userModal.hasActiveViolation(plate_number.toUpperCase())
        if (activeViolation) {
            return sendError(res, 400, 'This vehicle already has an active violation that has not been released yet.' )
        }

        const {owner_name, owner_email} = vehicle

        const violationId = await userModal.createViolation(
            plate_number.toUpperCase(),
            owner_email,
            owner_name,
            location,
            image_url,
            fine_amount || 500,
            captured_by
        )

        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: owner_email,
            subject: `Vehicle Pickup Notice - ${plate_number.toUpperCase()}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #050510; color: #ffffff; padding: 30px; border-radius: 16px;">
                    <h1 style="color: #a855f7;">No Parking Pickup Notice</h1>
                    <p>Dear <strong>${owner_name}</strong>,</p>
                    <p>Your vehicle with plate number <strong>${plate_number.toUpperCase()}</strong> has been picked up for illegal parking.</p>
                    
                    <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; margin: 20px 0;">
                        <p><strong> Location:</strong> ${location}</p>
                        <p><strong> Fine Amount:</strong> ₹${fine_amount || 500}</p>
                        <p><strong> Captured At:</strong> ${new Date().toLocaleString('en-IN')}</p>
                    </div>

                    <p>To release your vehicle, please pay the fine using the link below:</p>
                    
                    <a href="${process.env.APP_URL}/violation/${violationId}" 
                       style="display: inline-block; background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: bold; margin: 10px 0;">
                        Pay Fine & Get Location
                    </a>

                    <p style="color: #94a3b8; font-size: 13px; margin-top: 20px;">If you think this is a mistake, please contact us immediately.</p>
                </div>
            `
        })

        await sendWhatsAppMessage(
            vehicle.owner_phone,
            `🚨 *No Parking Pickup*\n\nDear ${owner_name},\n\nYour vehicle *${plate_number.toUpperCase()}* has been picked up from *${location}*.\n\n💰 Fine: ₹${fine_amount || 500}\n\nPay here: ${process.env.APP_URL}/violation/${violationId}`
        )

        console.log('whatsapp sent ...')

        await userModal.markAsNotified(violationId)
        sendSuccess(res, 200, 'Vehicle captured and owner notified', {violationId})
    } catch (error) {
        return sendError(res, 500, error.message)
    }
}

export const getMyViolations = async (req, res) => {
    try {
        const violations = await userModal.getFieldViolations(req.fieldAdminId)
        return sendSuccess(res, 200, null, { violations})
    } catch (error) {
      return sendError(res, 500, error.message)  
    }
}