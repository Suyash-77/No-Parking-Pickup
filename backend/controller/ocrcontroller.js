import Tesseract from "tesseract.js";
import sharp from "sharp";
import path from 'path'
import { fileURLToPath } from "url";
import { STATUS_CODES } from "../config/statusCode.js";
import { sendError, sendSuccess } from "../config/response.js";

const _filename = fileURLToPath(import.meta.url)
const _dirname = path.dirname(_filename)

export const readPlateFromImage = async (req, res) => {

    try {
        if (!req.file) {
            return sendError(res, 400, 'No image uploaded')
        }
        const inputPath = req.file.path
        const processedPath = path.join(_dirname, '..', 'uploads', `processed-${Date.now()}.png`)
        await sharp(inputPath)
            .resize({ width: 640 })
            .greyscale()
            .normalize()
            .modulate({ brightness: 1.1, saturation: 0 })
            .sharpen({ sigma: 1.5, m1: 1.5, m2: 0.7 })
            .linear(1.3, -30)
            .threshold(140)
            .png()
            .toFile(processedPath)

        const { data } = await Tesseract.recognize(processedPath, 'eng', {
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
            tessedit_pageseg_mode: '7',
            tessedit_ocr_engine_mode: '1',
            preserve_interword_spaces: '0'
        })
        const cleaned = data.text
            .trim()
            .replace(/[^A-Z0-9]/g, '')
            .toUpperCase()

        if (!cleaned || cleaned.length < 4) {
            return sendError(res, 400, 'Could not detect plate number from image')
        }

        const indianPlateRegex = /[A-Z]{2}\d{0,2}[A-Z]{1,3}\d{4}/
        const match = cleaned.match(indianPlateRegex)

        return sendSuccess(res, 200, null, {
            plate: match ? match[0] : cleaned,
            raw: cleaned,
            patternMatched: !!match
        })
    } catch (error) {
        return sendError(res, 500, error.message)
    }
}