import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import morgan from 'morgan'

import db from './config/mysql.js'
import authRouter from './routes/authroutes.js'
import userRouter from "./routes/userroutes.js";
import vehiclerouter from "./routes/vehicleroutes.js";
import dashboardadminrouter from "./routes/dashboardadminroutes.js";
import fieldadminrouter from "./routes/fieldadminroutes.js";
import ocrrouter from "./routes/ocrroutes.js";
import violationrouter from "./routes/violationroutes.js";
import payrouter from "./routes/payroutes.js";

const app = express();
const port = process.env.PORT || 4000


const allowedOrigins = [process.env.APP_URL,'http://localhost:5173']
app.use(morgan('dev'))
app.use(express.json());
app.use(cookieParser());
app.use(cors({origin: allowedOrigins, credentials: true}));


app.get('/', (req, res)=> res.send("API WORKING"));
app.use('/api/auth', authRouter)
app.use('/api/user', userRouter)
app.use('/api/dashboard-admin', dashboardadminrouter)
app.use('/api/vehicle', vehiclerouter)
app.use('/api/field-admin', fieldadminrouter)
app.use('/api/ocr', ocrrouter)
app.use('/api/violation', violationrouter)
app.use('/api/pay', payrouter)


app.listen(port, '0.0.0.0', ()=> console.log(`Server started on PORT: ${port}`));