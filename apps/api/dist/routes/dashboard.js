"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const jwt_1 = require("../utils/jwt");
const router = (0, express_1.Router)();
function getUser(req) {
    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Bearer "))
        return null;
    const token = auth.replace("Bearer ", "");
    return (0, jwt_1.verifyAccessToken)(token);
}
router.get("/", async (req, res) => {
    try {
        const user = getUser(req);
        if (!user) {
            return res.status(401).json({ error: "No autorizado" });
        }
        const companyFilter = user.role === "COMPANY_ADMIN"
            ? { companyId: user.companyId }
            : {};
        const participants = await db_1.default.participant.findMany({
            where: companyFilter
        });
        const participantIds = participants.map(p => p.id);
        const assignments = await db_1.default.assignment.findMany({
            where: {
                participantId: { in: participantIds }
            }
        });
        const totalEvaluaciones = assignments.length;
        const pendientes = assignments.filter(a => a.status !== "COMPLETED").length;
        const results = await db_1.default.evaluationResult.findMany({
            where: {
                participantId: { in: participantIds }
            }
        });
        let verde = 0;
        let amarillo = 0;
        let rojo = 0;
        results.forEach(r => {
            if (r.score >= 85)
                verde++;
            else if (r.score >= 55)
                amarillo++;
            else
                rojo++;
        });
        /* ===============================
        🔥 COMPETENCIAS (CORREGIDO REAL)
        =============================== */
        const competenciasMap = {};
        results.forEach(r => {
            try {
                const json = typeof r.resultJson === "string"
                    ? JSON.parse(r.resultJson)
                    : r.resultJson;
                /* ===== CASO 1: OBJETO ===== */
                if (json?.competencias && typeof json.competencias === "object") {
                    Object.entries(json.competencias).forEach(([name, value]) => {
                        if (!competenciasMap[name]) {
                            competenciasMap[name] = { total: 0, count: 0 };
                        }
                        competenciasMap[name].total += Number(value);
                        competenciasMap[name].count++;
                    });
                }
                /* ===== CASO 2: ARRAY ===== */
                else if (Array.isArray(json?.competenciasDetalle)) {
                    json.competenciasDetalle.forEach((c) => {
                        const name = c.name;
                        const score = Number(c.score || 0);
                        if (!competenciasMap[name]) {
                            competenciasMap[name] = { total: 0, count: 0 };
                        }
                        competenciasMap[name].total += score;
                        competenciasMap[name].count++;
                    });
                }
            }
            catch (e) {
                console.error("Error parsing resultJson:", e);
            }
        });
        const competencias = {};
        Object.entries(competenciasMap).forEach(([k, v]) => {
            competencias[k] = Math.round(v.total / v.count);
        });
        const sorted = Object.entries(competencias)
            .sort((a, b) => a[1] - b[1]);
        const criticas = sorted.slice(0, 5);
        const mejores = sorted.slice(-5).reverse();
        return res.json({
            ok: true,
            role: user.role,
            data: {
                participantes: participants.length,
                evaluaciones: totalEvaluaciones,
                pendientes,
                semaforo: { verde, amarillo, rojo },
                competencias,
                criticas,
                mejores
            }
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error dashboard" });
    }
});
exports.default = router;
