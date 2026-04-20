"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const jwt_1 = require("../utils/jwt");
const router = (0, express_1.Router)();
/* =====================================
LISTAR USUARIOS
===================================== */
router.get("/", async (req, res) => {
    try {
        const users = await db_1.default.user.findMany({
            include: { company: true },
            orderBy: { createdAt: "desc" }
        });
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ error: "Error loading users" });
    }
});
/* =====================================
CREAR USUARIO
===================================== */
router.post("/", async (req, res) => {
    try {
        const { rut, name, password, role, companyId } = req.body;
        const user = await db_1.default.user.create({
            data: {
                rut,
                name,
                password,
                role,
                companyId
            }
        });
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ error: "Error creating user" });
    }
});
/* =====================================
ACTUALIZAR USUARIO
===================================== */
router.put("/:id", async (req, res) => {
    try {
        const { name, rut, role, password, companyId } = req.body;
        const user = await db_1.default.user.update({
            where: { id: req.params.id },
            data: {
                name,
                rut,
                role,
                password,
                companyId
            }
        });
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ error: "Error updating user" });
    }
});
/* =====================================
ELIMINAR USUARIO
===================================== */
router.delete("/:id", async (req, res) => {
    try {
        const user = await db_1.default.user.findUnique({
            where: { id: req.params.id }
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        /* evitar borrar el ultimo superadmin */
        if (user.role === "SUPERADMIN") {
            const admins = await db_1.default.user.count({
                where: { role: "SUPERADMIN" }
            });
            if (admins <= 1) {
                return res.status(400).json({
                    error: "No se puede eliminar el último SUPERADMIN"
                });
            }
        }
        await db_1.default.user.delete({
            where: { id: req.params.id }
        });
        res.json({ ok: true });
    }
    catch (error) {
        res.status(500).json({ error: "Error deleting user" });
    }
});
/* =====================================
LOGIN AS (VER COMO USUARIO)
===================================== */
router.post("/loginAs/:id", async (req, res) => {
    try {
        const user = await db_1.default.user.findUnique({
            where: { id: req.params.id }
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const token = (0, jwt_1.signAccessToken)({
            sub: user.id,
            rut: user.rut,
            role: user.role,
            companyId: user.companyId
        });
        res.json({ token, user });
    }
    catch (error) {
        res.status(500).json({ error: "LoginAs error" });
    }
});
exports.default = router;
