"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEvaluationEmail = sendEvaluationEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
async function sendEvaluationEmail(email, name, token) {
    const transporter = nodemailer_1.default.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
    const link = `http://localhost:5173/access/${token}`;
    await transporter.sendMail({
        from: `"ECOS Evaluaciones" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Invitación a evaluación",
        html: `
      <h2>Invitación a evaluación</h2>

      <p>Hola ${name},</p>

      <p>Has sido invitado a rendir una evaluación.</p>

      <p>Para comenzar haz clic en el siguiente enlace:</p>

      <a href="${link}">${link}</a>

      <p>Plataforma ECOS</p>
    `
    });
}
