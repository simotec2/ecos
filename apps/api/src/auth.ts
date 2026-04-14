import jwt from "jsonwebtoken"
import prisma from "./db"

const JWT_SECRET = process.env.JWT_SECRET || "secret"

// ==========================
// GENERAR TOKEN
// ==========================
export function signToken(user:any){

  return jwt.sign(
    {
      id: user.id,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  )
}

// ==========================
// MIDDLEWARE AUTH
// ==========================
export async function authMiddleware(req:any, res:any, next:any){

  try{

    const header = req.headers.authorization

    if(!header){
      return res.status(401).json({ error:"No token" })
    }

    const token = header.split(" ")[1]

    const decoded:any = jwt.verify(token, JWT_SECRET)

    const user = await prisma.user.findUnique({
      where:{ id: decoded.id }
    })

    if(!user){
      return res.status(401).json({ error:"User not found" })
    }

    req.user = user

    next()

  }catch(e){

    return res.status(401).json({ error:"Invalid token" })
  }
}