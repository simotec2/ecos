import jwt from "jsonwebtoken"

const SECRET = "ECOS_SECRET_KEY"

/* =========================
GENERAR TOKEN
========================= */
export function signAccessToken(payload: any) {
  return jwt.sign(payload, SECRET, {
    expiresIn: "8h"
  })
}

/* =========================
VALIDAR TOKEN
========================= */
export function verifyAccessToken(token: string) {
  try {
    return jwt.verify(token, SECRET)
  } catch {
    return null
  }
}