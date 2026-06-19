import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret"

/* =========================
GENERAR TOKEN
========================= */
export function signToken(user: any) {

  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      companyId: user.companyId || null
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  )

}

/* =========================
COMPATIBILIDAD HACIA ATRÁS
========================= */
export const signAccessToken = signToken

/* =========================
VERIFICAR TOKEN
========================= */
export function verifyAccessToken(token: string) {

  try {

    return jwt.verify(token, JWT_SECRET)

  } catch (error) {

    return null

  }

}