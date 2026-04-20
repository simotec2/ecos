"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
console.log("🔥 SERVER NUEVO ACTIVO");
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const companies_1 = __importDefault(require("./routes/companies"));
const participants_1 = __importDefault(require("./routes/participants"));
const participantsBulk_1 = __importDefault(require("./routes/participantsBulk"));
const assignments_1 = __importDefault(require("./routes/assignments"));
const session_1 = __importDefault(require("./routes/session"));
const results_1 = __importDefault(require("./routes/results"));
const reports_1 = __importDefault(require("./routes/reports"));
const evaluations_1 = __importDefault(require("./routes/evaluations"));
const participantAccess_1 = __importDefault(require("./routes/participantAccess"));
const participantInvite_1 = __importDefault(require("./routes/participantInvite"));
const sendInvitation_1 = __importDefault(require("./routes/sendInvitation"));
const evaluationFinish_1 = __importDefault(require("./routes/evaluationFinish"));
const finalReport_1 = __importDefault(require("./routes/finalReport"));
const evaluationAnswer_1 = __importDefault(require("./routes/evaluationAnswer"));
const history_1 = __importDefault(require("./routes/history"));
const questions_1 = __importDefault(require("./routes/questions"));
const debug_1 = __importDefault(require("./routes/debug"));
const app = (0, express_1.default)();
/* =========================
MIDDLEWARES
========================= */
app.use((0, cors_1.default)());
app.use(express_1.default.json());
/* =========================
HEALTH CHECK (CRÍTICO)
========================= */
app.get("/api/health", (req, res) => {
    res.json({ ok: true });
});
/* =========================
RUTAS
========================= */
app.use("/api/dashboard", dashboard_1.default);
app.use("/api/auth", auth_1.default);
app.use("/api/users", users_1.default);
app.use("/api/companies", companies_1.default);
app.use("/api/participants", participants_1.default);
app.use("/api/participants/bulk", participantsBulk_1.default);
app.use("/api/assignments", assignments_1.default);
app.use("/api/session", session_1.default);
app.use("/api/evaluationanswer", evaluationAnswer_1.default);
app.use("/api/results", results_1.default);
app.use("/api/reports", reports_1.default);
app.use("/api/evaluations", evaluations_1.default);
app.use("/api/participant/access", participantAccess_1.default);
app.use("/api/participant/invite", participantInvite_1.default);
app.use("/api/send-invitation", sendInvitation_1.default);
app.use("/api/evaluationfinish", evaluationFinish_1.default);
app.use("/api/history", history_1.default);
app.use("/api/questions", questions_1.default);
app.use("/api/debug", debug_1.default);
/* =========================
FINAL REPORT
========================= */
app.use("/api/final", finalReport_1.default);
/* =========================
START SERVER (CORREGIDO PARA RENDER)
========================= */
const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 API running on port ${PORT}`);
});
