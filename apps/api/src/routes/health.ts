import { Router } from "express"

const router = Router()

router.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "ECOS API",
    time: new Date()
  })
})

export default router