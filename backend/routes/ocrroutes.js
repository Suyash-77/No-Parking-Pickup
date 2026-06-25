import express from 'express'
import multer from 'multer'
import fieldadminauth from '../middleware/fieldadminauth.js'
import { readPlateFromImage } from '../controller/ocrcontroller.js'

const Storage = multer.diskStorage({
    destination: (req, res, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `ocr-${Date.now()}-${file.originalname}`)
})

const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 }
})

const ocrrouter = express.Router()
ocrrouter.post('/read-plate', fieldadminauth, upload.single('image'), readPlateFromImage)

export default ocrrouter