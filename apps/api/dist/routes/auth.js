"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const jwt_1 = require("../utils/jwt");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
/* =====================================
NORMALIZAR RUT
===================================== */
function normalizeRut(rut) {
    if (!rut)
        return "";
    let clean = rut.replace(/\./g, "").replace(/\s/g, "");
    if (clean.includes("-")) {
        const [num, dv] = clean.split("-");
        return `${num}-${dv.toLowerCase()}`;
    }
    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);
    return `${body}-${dv.toLowerCase()}`;
}
/*
=====================================
LOGIN
=====================================
*/
router.post("/login", async (req, res) => {
    try {
        const { rut, password } = req.body;
        if (!rut || !password) {
            return res.status(400).json({
                error: "RUT y contraseña requeridos"
            });
        }
        const rutNormalized = normalizeRut(rut);
        const rutNoDash = rutNormalized.replace("-", "");
        const user = await db_1.default.user.findFirst({
            where: {
                OR: [
                    { rut: rutNormalized },
                    { rut: rutNoDash }
                ]
            }
        });
        if (!user) {
            return res.status(404).json({
                error: "Usuario no encontrado"
            });
        }
        if (user.password !== password) {
            return res.status(401).json({
                error: "Credenciales inválidas"
            });
        }
        const token = (0, jwt_1.signToken)(user);
        return res.json({
            ok: true,
            token,
            forcePasswordChange: user.forcePasswordChange,
            user: {
                id: user.id,
                name: user.name,
                rut: user.rut,
                role: user.role
            }
        });
    }
    catch (error) {
        console.error("LOGIN ERROR DETALLE:", error);
        return res.status(500).json({
            error: "Error en login",
            detalle: error?.message || error
        });
    }
});
/*
=====================================
CAMBIO DE CONTRASEÑA
=====================================
*/
router.post("/change-password", async (req, res) => {
    try {
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({
                error: "Contraseña requerida"
            });
        }
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                error: "No autorizado"
            });
        }
        const token = authHeader.split(" ")[1];
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        await db_1.default.user.update({
            where: { id: userId },
            data: {
                password,
                forcePasswordChange: false
            }
        });
        return res.json({
            ok: true
        });
    }
    catch (error) {
        console.error("CHANGE PASSWORD ERROR:", error);
        return res.status(500).json({
            error: "Error al cambiar contraseña"
        });
    }
});
exports.default = router;
