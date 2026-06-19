import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret"

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

export const signAccessToken = signToken

export function verifyAccessToken(token: string) {

  try {

    return jwt.verify(token, JWT_SECRET)

  } catch (error) {

    return null

  }

}