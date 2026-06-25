import express from 'express'
import fildadminauth from '../middleware/fieldadminauth.js'
import {captureVehicle, getMyViolations } from '../controller/fieldadmincontroller.js'
import multer from 'multer'

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
})

const upload = multer({storage})

const fieldadminrouter = express.Router()
fieldadminrouter.use(fildadminauth)

fieldadminrouter.post('/capture', upload.single('image'), captureVehicle)
fieldadminrouter.get('/violations', getMyViolations)

export default fieldadminrouter