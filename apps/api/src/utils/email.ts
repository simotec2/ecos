import nodemailer from "nodemailer"

/* ======================================
TRANSPORTER
====================================== */
const transporter = nodemailer.createTransport({

  host:
    process.env.SMTP_HOST ||
    "smtpout.secureserver.net",

  port:
    Number(process.env.SMTP_PORT) || 587,

  secure:false,

  auth:{
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }

})

/* ======================================
ENVIAR EMAIL
====================================== */
export async function sendEvaluationEmail(
  email:string,
  name:string,
  token:string
){

  try{

    /* =========================
    URL REAL
    ========================= */

    const baseUrl =
      process.env.FRONTEND_URL ||
      "https://seguridad-simotec.com"

    const link =
      `${baseUrl}/access/${token}`

    console.log("LINK EMAIL:", link)

    /* =========================
    ENVIO
    ========================= */

    const info = await transporter.sendMail({

      from: `"ECOS Evaluaciones" <${process.env.SMTP_USER}>`,

      to: email,

      subject:"Invitación a evaluación ECOS",

      html:`

        <div style="
          font-family:Arial;
          max-width:600px;
          margin:auto;
        ">

          <h2 style="color:#111827;">
            Invitación a evaluación
          </h2>

          <p>
            Hola ${name},
          </p>

          <p>
            Has sido invitado a rendir
            una evaluación en ECOS.
          </p>

          <div style="margin:25px 0;">

            <a
              href="${link}"
              style="
                background:#2563eb;
                color:white;
                padding:12px 20px;
                border-radius:8px;
                text-decoration:none;
                display:inline-block;
                font-weight:bold;
              "
            >
              Ingresar a evaluación
            </a>

          </div>

          <p style="
            font-size:12px;
            color:#6b7280;
          ">
            Si el botón no funciona,
            copia este enlace:
          </p>

          <p style="
            font-size:12px;
            word-break:break-all;
          ">
            ${link}
          </p>

          <p style="margin-top:30px;">
            Plataforma ECOS
          </p>

        </div>

      `

    })

    /* =========================
    LOGS
    ========================= */

    console.log("EMAIL ENVIADO:", info.accepted)

    if(info.rejected?.length){

      console.error(
        "EMAIL RECHAZADO:",
        info.rejected
      )

    }

  }catch(error:any){

    console.error(
      "ERROR EMAIL:",
      error?.message || error
    )

  }

}