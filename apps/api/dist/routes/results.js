"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderFinalReportHTML = renderFinalReportHTML;
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
/* ======================================
PUBLIC VIEW (SIN TOKEN - SOLO DEV)
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
            return res.status(404).json({ error: "Resultado no encontrado" });
        }
        return res.json(result);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Error obteniendo resultado" });
    }
});
/*
=====================================
LISTAR RESULTADOS (SOLO ÚLTIMOS)
=====================================
*/
router.get("/", async (req, res) => {
    try {
        const results = await db_1.default.evaluationResult.findMany({
            include: {
                participant: {
                    include: { company: true }
                },
                evaluation: true
            },
            orderBy: { createdAt: "desc" }
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
/*
=====================================
RESULTADOS AGRUPADOS (ESTABLE)
=====================================
*/
router.get("/grouped", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = (req.query.search || "").toLowerCase();
        const company = (req.query.company || "").toLowerCase();
        /* 🔥 TRAEMOS SIN FILTRO (SIN ERRORES) */
        const results = await db_1.default.evaluationResult.findMany({
            include: {
                participant: {
                    include: { company: true }
                },
                evaluation: true
            },
            orderBy: { createdAt: "desc" }
        });
        /* 🔥 SOLO ÚLTIMO */
        const map = new Map();
        for (const r of results) {
            const key = `${r.participantId}-${r.evaluationId}`;
            if (!map.has(key)) {
                map.set(key, r);
            }
        }
        const filtered = Array.from(map.values());
        /* 🔥 AGRUPAR */
        const grouped = {};
        filtered.forEach((r) => {
            const pid = r.participantId;
            if (!grouped[pid]) {
                grouped[pid] = {
                    participantId: pid,
                    name: `${r.participant?.nombre} ${r.participant?.apellido}`,
                    company: r.participant?.company?.name || "Sin empresa",
                    evaluations: []
                };
            }
            const data = JSON.parse(r.resultJson || "{}");
            grouped[pid].evaluations.push({
                id: r.id,
                name: r.evaluation?.name,
                score: data.score || 0,
                pdf: `${process.env.BASE_URL}/api/reports/${r.id}/pdf`
            });
        });
        let list = Object.values(grouped);
        /* 🔥 FILTRO EN BACKEND (100% SEGURO) */
        list = list.filter((g) => {
            const name = (g.name || "").toLowerCase();
            const comp = (g.company || "").toLowerCase();
            if (search && !name.includes(search))
                return false;
            if (company && !comp.includes(company))
                return false;
            return true;
        });
        /* 🔥 FINAL */
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
        /* 🔥 ORDEN */
        list.sort((a, b) => a.finalScore - b.finalScore);
        /* 🔥 PAGINACIÓN */
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
/*
=====================================
ELIMINAR
=====================================
*/
router.delete("/:id", async (req, res) => {
    try {
        await db_1.default.evaluationResult.delete({
            where: { id: req.params.id }
        });
        res.json({ ok: true });
    }
    catch (e) {
        console.error("DELETE ERROR:", e);
        res.status(500).json({
            error: "Error eliminando"
        });
    }
});
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const radarGenerator_1 = require("../services/radarGenerator");
async function renderFinalReportHTML(data) {
    const templatePath = path_1.default.join(__dirname, "..", "templates", "finalReportTemplate.html");
    let html = fs_1.default.readFileSync(templatePath, "utf-8");
    const participant = data.participant || {};
    const competencies = data.competencies || [];
    /* =========================
    LOGO
    ========================= */
    const logoPath = path_1.default.join(__dirname, "..", "..", "assets", "logos", "ecos.png");
    const logoBase64 = fs_1.default.readFileSync(logoPath).toString("base64");
    const logo = `<img src="data:image/png;base64,${logoBase64}" style="height:50px;" />`;
    /* =========================
    RADAR
    ========================= */
    let radarHTML = "";
    if (competencies.length > 0) {
        const radar = await (0, radarGenerator_1.generateRadarImage)(competencies);
        radarHTML = `<img src="${radar}" style="width:350px;margin:auto;display:block;" />`;
    }
    /* =========================
    EVALUACIONES
    ========================= */
    const evaluationsHTML = (data.evaluations || []).map((e) => `
    <div style="margin-bottom:8px;">
      ${e.type}: <b>${Math.round(e.score)}%</b>
    </div>
  `).join("");
    /* =========================
    COLOR
    ========================= */
    function getColor(c) {
        if (c === "VERDE")
            return "#16a34a";
        if (c === "AMARILLO")
            return "#f59e0b";
        return "#dc2626";
    }
    /* =========================
    REEMPLAZOS
    ========================= */
    html = html
        .replace(/{{logo}}/g, logo)
        .replace(/{{participant}}/g, `${participant.nombre} ${participant.apellido}`)
        .replace(/{{company}}/g, participant.company?.name || "")
        .replace(/{{score}}/g, data.score)
        .replace(/{{color}}/g, getColor(data.traffic.color))
        .replace(/{{result}}/g, data.traffic.result)
        .replace(/{{evaluations}}/g, evaluationsHTML)
        .replace(/{{radar}}/g, radarHTML)
        .replace(/{{analysis}}/g, data.analysis || "");
    return html;
}
exports.default = router;
