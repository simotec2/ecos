"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const router = (0, express_1.Router)();
router.get("/create-admin", async (req, res) => {
    try {
        const password = await bcrypt_1.default.hash("123456", 10);
        const user = await db_1.default.user.create({
            data: {
                name: "Administrador",
                rut: "11111111-1", // ⚠️ debe ser único
                password,
                role: "SUPERADMIN",
                companyId: null // 🔥 IMPORTANTE en tu modelo
            }
        });
        res.json({
            message: "Admin creado",
            rut: "11111111-1",
            password: "123456"
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error creando admin" });
    }
});
exports.default = router;
