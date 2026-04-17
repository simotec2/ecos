import nodemailer from "nodemailer"

/* ======================================
TRANSPORTER (GODADDY / SECURESERVER)
====================================== */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtpout.secureserver.net",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // IMPORTANTE: false para puerto 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

/* ======================================
ENVIAR EMAIL INVITACIÓN
====================================== */
export async function sendEvaluationEmail(
  email: string,
  name: string,
  token: string
) {

  try {

    /* =========================
    URL DINÁMICA
    ========================= */
    const baseUrl =
      process.env.FRONTEND_URL ||
      "http://localhost:5173"

    const link = `${baseUrl}/access/${token}`

    await transporter.sendMail({

      from: `"ECOS Evaluaciones" <${process.env.SMTP_USER}>`,

      to: email,

      subject: "Invitación a evaluación ECOS",

      html: `
        <div style="font-family: Arial; max-width:600px; margin:auto;">
          
          <h2 style="color:#111;">Invitación a evaluación</h2>

          <p>Hola ${name},</p>

          <p>Has sido invitado a rendir una evaluación en la plataforma ECOS.</p>

          <p>Haz clic en el siguiente enlace para comenzar:</p>

          <a 
            href="${link}" 
            style="
              display:inline-block;
              padding:10px 20px;
              background:#2563eb;
              color:#fff;
              text-decoration:none;
              border-radius:6px;
              margin:10px 0;
            "
          >
            Ingresar a evaluación
          </a>

          <p style="font-size:12px; color:#666;">
            Si el botón no funciona, copia este enlace:<br/>
            ${link}
          </p>

          <p style="margin-top:20px;">Plataforma ECOS</p>

        </div>
      `

    })

    console.log("EMAIL ENVIADO OK:", email)

  } catch (error: any) {

    console.error("ERROR EMAIL:", error?.message || error)

  }

}