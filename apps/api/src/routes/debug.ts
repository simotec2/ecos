import { Router } from "express"
import prisma from "../db"
import bcrypt from "bcrypt"

const router = Router()

router.get("/create-admin", async (req, res) => {

  try{

    const password = await bcrypt.hash("123456", 10)

    const user = await prisma.user.create({
      data:{
        name: "Administrador",
        rut: "11111111-1", // ⚠️ debe ser único
        password,
        role: "SUPERADMIN",
        companyId: null // 🔥 IMPORTANTE en tu modelo
      }
    })

    res.json({
      message: "Admin creado",
      rut: "11111111-1",
      password: "123456"
    })

  }catch(err){
    console.error(err)
    res.status(500).json({ error:"Error creando admin" })
  }

})

export default router