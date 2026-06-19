import jwt from "jsonwebtoken"
import prisma from "./db"
import { getUserPermissions } from "./permissions"

const JWT_SECRET = process.env.JWT_SECRET || "secret"

export function signToken(user:any){

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

    const effectiveCompanyId =
      decoded.companyId !== undefined && decoded.companyId !== null
        ? decoded.companyId
        : user.companyId

    req.user = {
      ...user,
      companyId: effectiveCompanyId,
      permissions: getUserPermissions({
        ...user,
        companyId: effectiveCompanyId
      })
    }

    next()

  }catch(e){

    return res.status(401).json({ error:"Invalid token" })

  }

}