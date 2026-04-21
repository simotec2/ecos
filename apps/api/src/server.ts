console.log("🔥 SERVER NUEVO ACTIVO")

import "dotenv/config"
import express from "express"
import cors from "cors"

import prisma from "./db"

import dashboardRoutes from "./routes/dashboard"
import authRoutes from "./routes/auth"
import usersRoutes from "./routes/users"
import companiesRoutes from "./routes/companies"
import participantsRoutes from "./routes/participants"
import participantsBulkRoutes from "./routes/participantsBulk"
import assignmentsRoutes from "./routes/assignments"
import sessionRoutes from "./routes/session"
import resultsRoutes from "./routes/results"
import reportsRoutes from "./routes/reports"
import evaluationsRoutes from "./routes/evaluations"
import participantAccessRoutes from "./routes/participantAccess"
import participantInviteRoutes from "./routes/participantInvite"
import sendInvitationRoutes from "./routes/sendInvitation"
import evaluationFinishRoutes from "./routes/evaluationFinish"
import finalReportRoutes from "./routes/finalReport"
import evaluationAnswerRoutes from "./routes/evaluationAnswer"
import historyRoutes from "./routes/history"
import questionsRoutes from "./routes/questions"
import debugRoutes from "./routes/debug"
import templateRoutes from "./routes/template"

const app = express()

/* =========================
MIDDLEWARES
========================= */
app.use(cors())
app.use(express.json())

/* =========================
HEALTH CHECK (CRÍTICO)
========================= */
app.get("/api/health", (req, res) => {
  res.json({ ok: true })
})
app.get("/api/test", (req, res) => {
  res.json({ ok: true, version: "NUEVA VERSION 123" })
})

/* =========================
RUTAS
========================= */
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/users", usersRoutes)
app.use("/api/companies", companiesRoutes)
app.use("/api/participants", participantsRoutes)
app.use("/api/participants/bulk", participantsBulkRoutes)
app.use("/api/assignments", assignmentsRoutes)
app.use("/api/session", sessionRoutes)
app.use("/api/evaluationanswer", evaluationAnswerRoutes)
app.use("/api/results", resultsRoutes)
app.use("/api/reports", reportsRoutes)
app.use("/api/evaluations", evaluationsRoutes)
app.use("/api/participant/access", participantAccessRoutes)
app.use("/api/participant/invite", participantInviteRoutes)
app.use("/api/send-invitation", sendInvitationRoutes)
app.use("/api/evaluationfinish", evaluationFinishRoutes)
app.use("/api/history", historyRoutes)
app.use("/api/questions", questionsRoutes)
app.use("/api/debug", debugRoutes)
app.use("/api/template", templateRoutes)

/* =========================
FINAL REPORT
========================= */
app.use("/api/final", finalReportRoutes)

/* =========================
START SERVER (CORREGIDO PARA RENDER)
========================= */
const PORT = Number(process.env.PORT) || 3001

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 API running on port ${PORT}`)
})