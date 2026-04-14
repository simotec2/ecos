import nodemailer from "nodemailer"

export async function sendEvaluationEmail(
  email: string,
  name: string,
  token: string
){

  try{

    const transporter = nodemailer.createTransport({

      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,

      auth:{
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }

    })

    const link = `http://localhost:5173/participant/${token}`

    const info = await transporter.sendMail({

      from: `"ECOS Evaluaciones" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Invitación a evaluación ECOS",

      html: `
        <div style="font-family:Arial;padding:20px">

          <h2>Invitación a evaluación</h2>

          <p>Hola <b>${name}</b>,</p>

          <p>Has sido invitado a rendir una evaluación en ECOS.</p>

          <p>
            <a href="${link}" style="
              background:#16a34a;
              color:white;
              padding:12px 20px;
              text-decoration:none;
              border-radius:6px
            ">
              Iniciar evaluación
            </a>
          </p>

          <p>O copia este enlace:</p>
          <p>${link}</p>

          <hr>

          <p style="font-size:12px;color:#777">
            ECOS by Simotec
          </p>

        </div>
      `
    })

    console.log("✅ Email enviado:", info.messageId)

  }catch(error){
    console.error("❌ Error enviando email:", error)
    throw error
  }

}