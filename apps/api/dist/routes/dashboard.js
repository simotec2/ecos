"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const jwt_1 = require("../utils/jwt");
const router = (0, express_1.Router)();
/* ================= AUTH ================= */
function getUser(req) {
    try {
        const auth = req.headers.authorization || "";
        if (!auth.startsWith("Bearer "))
            return null;
        const token = auth.replace("Bearer ", "");
        return (0, jwt_1.verifyAccessToken)(token);
    }
    catch {
        return null;
    }
}
/* ================= CONSOLIDADOR ================= */
function consolidateResults(results) {
    const byType = {};
    results.forEach(r => {
        const type = r.evaluation?.type;
        const score = Number(r.score);
        if (!type || isNaN(score))
            return;
        if (byType[type] === undefined) {
            byType[type] = score;
        }
    });
    const scores = Object.values(byType);
    if (scores.length === 0)
        return null;
    const sum = scores.reduce((a, b) => a + b, 0);
    const finalScore = sum / scores.length;
    let estado = "VERDE";
    if (finalScore < 55)
        estado = "ROJO";
    else if (finalScore < 85)
        estado = "AMARILLO";
    return {
        score: Math.round(finalScore),
        estado
    };
}
/* ================= RECOMENDACIÓN EMPRESA ================= */
function getCompanyRecommendation(rojoPct) {
    if (rojoPct > 50) {
        return "Nivel crítico. Se recomienda intervención inmediata, reentrenamiento y supervisión operativa.";
    }
    if (rojoPct > 25) {
        return "Riesgo moderado. Implementar refuerzo en competencias críticas.";
    }
    return "Nivel controlado. Mantener estándar operacional y monitoreo.";
}
/* ================= ROUTE ================= */
router.get("/", async (req, res) => {
    try {
        const user = getUser(req);
        if (!user) {
            return res.status(401).json({ error: "No autorizado" });
        }
        const companyFilter = user.role === "COMPANY_ADMIN"
            ? { companyId: user.companyId }
            : {};
        /* ================= PARTICIPANTES ================= */
        const participants = await db_1.default.participant.findMany({
            where: companyFilter,
            include: { company: true }
        });
        const participantIds = participants.map(p => p.id);
        /* ================= RESULTADOS ================= */
        const allResults = await db_1.default.evaluationResult.findMany({
            where: { participantId: { in: participantIds } },
            include: { evaluation: true },
            orderBy: { createdAt: "desc" }
        });
        /* ================= AGRUPAR POR PARTICIPANTE ================= */
        const grouped = {};
        allResults.forEach(r => {
            if (!grouped[r.participantId]) {
                grouped[r.participantId] = [];
            }
            grouped[r.participantId].push(r);
        });
        /* ================= CONSOLIDADO ================= */
        const consolidated = [];
        Object.entries(grouped).forEach(([participantId, results]) => {
            const final = consolidateResults(results);
            if (!final)
                return;
            const participant = participants.find(p => p.id === participantId);
            consolidated.push({
                participantId,
                companyId: participant?.companyId,
                companyName: participant?.company?.name,
                ...final
            });
        });
        /* ================= DASHBOARD GLOBAL ================= */
        let verde = 0;
        let amarillo = 0;
        let rojo = 0;
        consolidated.forEach(r => {
            if (r.estado === "VERDE")
                verde++;
            else if (r.estado === "AMARILLO")
                amarillo++;
            else
                rojo++;
        });
        /* ================= DASHBOARD POR EMPRESA ================= */
        const companyMap = {};
        consolidated.forEach(r => {
            if (!r.companyId)
                return;
            if (!companyMap[r.companyId]) {
                companyMap[r.companyId] = {
                    id: r.companyId,
                    name: r.companyName,
                    total: 0,
                    verde: 0,
                    amarillo: 0,
                    rojo: 0
                };
            }
            companyMap[r.companyId].total++;
            if (r.estado === "VERDE")
                companyMap[r.companyId].verde++;
            else if (r.estado === "AMARILLO")
                companyMap[r.companyId].amarillo++;
            else
                companyMap[r.companyId].rojo++;
        });
        const companies = Object.values(companyMap).map((c) => {
            const rojoPct = c.total > 0
                ? Math.round((c.rojo / c.total) * 100)
                : 0;
            return {
                ...c,
                riesgo: rojoPct,
                recomendacion: getCompanyRecommendation(rojoPct)
            };
        });
        /* ================= RESPONSE ================= */
        return res.json({
            ok: true,
            data: {
                participantes: consolidated.length,
                semaforo: { verde, amarillo, rojo },
                companies
            }
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            error: "Error dashboard"
        });
    }
});
exports.default = router;
