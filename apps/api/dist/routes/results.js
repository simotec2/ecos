"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const auth_1 = require("../auth");
const router = (0, express_1.Router)();
/* ======================================
PUBLIC VIEW
====================================== */
router.get("/public/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db_1.default.evaluationResult.findUnique({
            where: { id },
            include: {
                participant: {
                    include: { company: true }
                },
                evaluation: true
            }
        });
        if (!result) {
            return res.status(404).json({
                error: "Resultado no encontrado"
            });
        }
        return res.json(result);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            error: "Error obteniendo resultado"
        });
    }
});
/* ======================================
LISTAR RESULTADOS
====================================== */
router.get("/", auth_1.authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        let where = {};
        /* ======================================
        COMPANY ADMIN
        ====================================== */
        if (user.role === "COMPANY_ADMIN") {
            where = {
                participant: {
                    companyId: user.companyId
                }
            };
        }
        const results = await db_1.default.evaluationResult.findMany({
            where,
            include: {
                participant: {
                    include: { company: true }
                },
                evaluation: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });
        const map = new Map();
        for (const r of results) {
            const key = `${r.participantId}-${r.evaluationId}`;
            if (!map.has(key)) {
                map.set(key, r);
            }
        }
        return res.json(Array.from(map.values()));
    }
    catch (error) {
        console.error("RESULTS LIST ERROR:", error);
        return res.status(500).json({
            error: "Error obteniendo resultados"
        });
    }
});
/* ======================================
GROUPED
====================================== */
router.get("/grouped", auth_1.authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = (req.query.search || "")
            .toLowerCase();
        const company = (req.query.company || "")
            .toLowerCase();
        /* ======================================
        FILTRO COMPANY
        ====================================== */
        let where = {};
        if (user.role === "COMPANY_ADMIN") {
            where = {
                participant: {
                    companyId: user.companyId
                }
            };
        }
        /* ======================================
        RESULTADOS
        ====================================== */
        const results = await db_1.default.evaluationResult.findMany({
            where,
            include: {
                participant: {
                    include: { company: true }
                },
                evaluation: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });
        /* ======================================
        SOLO ÚLTIMO
        ====================================== */
        const map = new Map();
        for (const r of results) {
            const key = `${r.participantId}-${r.evaluationId}`;
            if (!map.has(key)) {
                map.set(key, r);
            }
        }
        const filtered = Array.from(map.values());
        /* ======================================
        AGRUPAR
        ====================================== */
        const grouped = {};
        filtered.forEach((r) => {
            const pid = r.participantId;
            if (!grouped[pid]) {
                grouped[pid] = {
                    participantId: pid,
                    name: `${r.participant?.nombre || ""} ${r.participant?.apellido || ""}`,
                    company: r.participant?.company?.name ||
                        "Sin empresa",
                    evaluations: []
                };
            }
            const data = JSON.parse(r.resultJson || "{}");
            grouped[pid].evaluations.push({
                id: r.id,
                type: r.evaluation?.type,
                name: r.evaluation?.name,
                score: data.score || 0,
                pdf: `${process.env.BASE_URL}/api/reports/${r.id}/pdf`
            });
        });
        let list = Object.values(grouped);
        /* ======================================
        FILTROS
        ====================================== */
        list = list.filter((g) => {
            const name = (g.name || "").toLowerCase();
            const comp = (g.company || "").toLowerCase();
            if (search &&
                !name.includes(search)) {
                return false;
            }
            /* ======================================
            COMPANY ADMIN NO FILTRA EMPRESA
            ====================================== */
            if (user.role !== "COMPANY_ADMIN" &&
                company &&
                !comp.includes(company)) {
                return false;
            }
            return true;
        });
        /* ======================================
        FINAL SCORE
        ====================================== */
        list = list.map((g) => {
            const scores = g.evaluations.map((e) => e.score);
            const finalScore = scores.length
                ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
                : 0;
            return {
                ...g,
                finalScore,
                finalPdf: `${process.env.BASE_URL}/api/final/${g.participantId}/pdf`
            };
        });
        /* ======================================
        ORDEN
        ====================================== */
        list.sort((a, b) => a.finalScore - b.finalScore);
        /* ======================================
        PAGINACIÓN
        ====================================== */
        const start = (page - 1) * limit;
        const end = start + limit;
        return res.json(list.slice(start, end));
    }
    catch (e) {
        console.error("GROUPED ERROR:", e);
        res.status(500).json({
            error: "Error agrupando resultados"
        });
    }
});
/* ======================================
DELETE
====================================== */
router.delete("/:id", auth_1.authMiddleware, async (req, res) => {
    try {
        /* ======================================
        SOLO SUPERADMIN
        ====================================== */
        if (req.user.role !== "SUPERADMIN") {
            return res.status(403).json({
                error: "Sin permisos"
            });
        }
        await db_1.default.evaluationResult.delete({
            where: {
                id: req.params.id
            }
        });
        res.json({
            ok: true
        });
    }
    catch (e) {
        console.error("DELETE ERROR:", e);
        res.status(500).json({
            error: "Error eliminando"
        });
    }
});
exports.default = router;
