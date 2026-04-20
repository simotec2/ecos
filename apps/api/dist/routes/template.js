"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
const templatePath = path_1.default.join(process.cwd(), "apps/api/src/templates/reportTemplate.html");
/* GET TEMPLATE */
router.get("/", (req, res) => {
    const html = fs_1.default.readFileSync(templatePath, "utf-8");
    res.send(html);
});
/* SAVE TEMPLATE */
router.post("/", (req, res) => {
    const { html } = req.body;
    fs_1.default.writeFileSync(templatePath, html);
    res.json({ ok: true });
});
exports.default = router;
