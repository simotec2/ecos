import nodemailer from "nodemailer"

export async function sendEvaluationEmail(
  email: string,
  name: string,
  token: string
) {

  const transporter = nodemailer.createTransport({

    host: "smtp.gmail.com",
    port: 587,
    secure: false,

    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }

  })

  const link = `http://localhost:5173/access/${token}`

  await transporter.sendMail({

    from: `"ECOS Evaluaciones" <${process.env.SMTP_USER}>`,

    to: email,

    subject: "Invitación a evaluación ECOS",

    html: `
      <div style="font-family:Arial;padding:20px">

        <h2>Invitación a evaluación</h2>

        <p>Hola <b>${name}</b>,</p>

        <p>Has sido invitado a rendir una evaluación en la plataforma ECOS.</p>

        <p>Para comenzar haz clic en el siguiente enlace:</p>

        <p>
          <a href="${link}" style="
            background:#2563eb;
            color:white;
            padding:10px 18px;
            text-decoration:none;
            border-radius:6px
          ">
            Iniciar evaluación
          </a>
        </p>

        <p>Si el botón no funciona, copia este enlace en tu navegador:</p>

        <p>${link}</p>

        <hr>

        <p style="color:#777;font-size:12px">
          Plataforma ECOS – Sistema de Evaluaciones
        </p>

      </div>
    `

  })

}