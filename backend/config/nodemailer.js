import nodemailer from 'nodemailer'

const transporter =  nodemailer.createTransport({
     host: 'smtp.gmail.com',
     port: 587,
     auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
     }

});

export default transporter;
