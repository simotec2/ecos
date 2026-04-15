import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret"

/* =========================
GENERAR TOKEN
========================= */
export function signToken(user: any) {

  return jwt.sign(
    {
      id: user.id,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  )
}