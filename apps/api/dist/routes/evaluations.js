"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const jwt_1 = require("../utils/jwt");
const router = (0, express_1.Router)();
/* ===============================
USER AUTH
=============================== */
function getUser(req) {
    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Bearer "))
        return null;
    const token = auth.replace("Bearer ", "");
    return (0, jwt_1.verifyAccessToken)(token);
}
function isAdmin(user) {
    return user?.role === "SUPERADMIN" || user?.role === "PSYCHOLOGIST";
}
/* ===============================
UTIL
=============================== */
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = a[i];
        a[i] = a[j];
        a[j] = temp;
    }
    return a;
}
/* ======================================
LISTAR EVALUACIONES (TODOS PUEDEN)
====================================== */
router.get("/", async (req, res) => {
    const data = await db_1.default.evaluation.findMany();
    res.json(data);
});
/* ======================================
OBTENER EVALUACIÓN (VER / EDITOR)
====================================== */
router.get("/:id", async (req, res) => {
    const id = String(req.params.id);
    const evaluation = await db_1.default.evaluation.findUnique({
        where: { id },
        include: { questions: true }
    });
    res.json(evaluation);
});
/* ======================================
🔥 EDITAR EVALUACIÓN (PROTEGIDO)
====================================== */
router.put("/:id", async (req, res) => {
    const user = getUser(req);
    if (!user) {
        return res.status(401).json({ error: "No autorizado" });
    }
    if (!isAdmin(user)) {
        return res.status(403).json({
            error: "No tienes permisos para editar evaluaciones"
        });
    }
    const id = String(req.params.id);
    const { name, type } = req.body;
    const updated = await db_1.default.evaluation.update({
        where: { id },
        data: {
            name,
            type
        }
    });
    res.json(updated);
});
/* ======================================
🔥 CREAR EVALUACIÓN (PROTEGIDO)
====================================== */
router.post("/", async (req, res) => {
    const user = getUser(req);
    if (!user) {
        return res.status(401).json({ error: "No autorizado" });
    }
    if (!isAdmin(user)) {
        return res.status(403).json({
            error: "No tienes permisos para crear evaluaciones"
        });
    }
    const { name, type } = req.body;
    const created = await db_1.default.evaluation.create({
        data: {
            name,
            type
        }
    });
    res.json(created);
});
/* ======================================
🔥 ELIMINAR EVALUACIÓN (PROTEGIDO)
====================================== */
router.delete("/:id", async (req, res) => {
    const user = getUser(req);
    if (!user) {
        return res.status(401).json({ error: "No autorizado" });
    }
    if (!isAdmin(user)) {
        return res.status(403).json({
            error: "No tienes permisos para eliminar evaluaciones"
        });
    }
    const id = String(req.params.id);
    await db_1.default.evaluation.delete({
        where: { id }
    });
    res.json({ ok: true });
});
/* ======================================
🔥 TEST (SOLO ADMIN)
====================================== */
router.get("/:id/test", async (req, res) => {
    const user = getUser(req);
    if (!user) {
        return res.status(401).json({ error: "No autorizado" });
    }
    if (!isAdmin(user)) {
        return res.status(403).json({
            error: "No tienes permisos para probar evaluaciones"
        });
    }
    try {
        const id = String(req.params.id);
        const evaluation = await db_1.default.evaluation.findUnique({
            where: { id },
            include: { questions: true }
        });
        if (!evaluation) {
            return res.status(404).json({
                error: "Evaluación no existe"
            });
        }
        let questions = evaluation.questions;
        if (evaluation.type === "SECURITY") {
            questions = shuffle(questions).slice(0, 20);
        }
        res.json({
            evaluation: {
                id: evaluation.id,
                name: evaluation.name,
                type: evaluation.type
            },
            questions: questions.map(q => ({
                id: q.id,
                text: q.text,
                type: q.type,
                options: q.optionsJson ? JSON.parse(q.optionsJson) : null
            }))
        });
    }
    catch (err) {
        console.error("ERROR TEST:", err);
        res.status(500).json({
            error: "Error cargando test"
        });
    }
});
exports.default = router;
