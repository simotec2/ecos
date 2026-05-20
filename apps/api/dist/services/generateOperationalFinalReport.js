"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOperationalFinalReport = generateOperationalFinalReport;
const db_1 = __importDefault(require("../db"));
const finalOperationalAI_1 = require("./finalOperationalAI");
const competencyActions = {
    "Comunicación preventiva": {
        risks: [
            "Posibles desviaciones en transmisión de información crítica.",
            "Riesgo de descoordinación operacional en tareas grupales."
        ],
        followUp: [
            "Retroalimentación semanal en reuniones preturno.",
            "Observación directa en interacción con cuadrillas."
        ],
        courses: [
            "Comunicación efectiva en operaciones mineras.",
            "Coordinación operacional segura."
        ],
        supervisor: "Verificar comprensión de instrucciones críticas y fomentar comunicación activa durante actividades operacionales."
    },
    "Trabajo en equipo": {
        risks: [
            "Dificultades de coordinación en tareas colaborativas.",
            "Posibles desviaciones durante actividades grupales."
        ],
        followUp: [
            "Seguimiento en integración operacional.",
            "Observación de interacción con equipos de trabajo."
        ],
        courses: [
            "Trabajo colaborativo en minería.",
            "Coordinación segura de tareas críticas."
        ],
        supervisor: "Favorecer integración progresiva en equipos de trabajo y reforzar comunicación entre pares."
    },
    "Identificación de riesgos": {
        risks: [
            "Riesgo de exposición frente a condiciones inseguras.",
            "Posibles dificultades en reconocimiento preventivo de riesgos."
        ],
        followUp: [
            "Refuerzo preventivo en terreno.",
            "Acompañamiento en identificación de riesgos críticos."
        ],
        courses: [
            "Identificación de peligros y evaluación de riesgos.",
            "Control preventivo operacional."
        ],
        supervisor: "Reforzar observación preventiva y validación de riesgos antes de iniciar tareas."
    },
    "Conducta preventiva": {
        risks: [
            "Variabilidad conductual frente a exigencias operacionales.",
            "Posibles desviaciones en adherencia preventiva."
        ],
        followUp: [
            "Observación conductual en terreno.",
            "Seguimiento preventivo inicial."
        ],
        courses: [
            "Conductas seguras en minería.",
            "Cultura preventiva operacional."
        ],
        supervisor: "Mantener seguimiento cercano sobre adherencia a procedimientos y conductas preventivas."
    },
    "Análisis operacional": {
        risks: [
            "Posibles desviaciones asociadas a interpretación de procedimientos.",
            "Riesgo operacional frente a escenarios dinámicos."
        ],
        followUp: [
            "Validación periódica de procedimientos.",
            "Acompañamiento en planificación de tareas."
        ],
        courses: [
            "Análisis seguro de tareas.",
            "Procedimientos críticos y control operacional."
        ],
        supervisor: "Validar comprensión procedimental y reforzar planificación preventiva."
    },
    "Liderazgo preventivo": {
        risks: [
            "Dificultades en intervención preventiva oportuna.",
            "Posible baja consistencia en control operacional."
        ],
        followUp: [
            "Coaching preventivo en liderazgo operacional.",
            "Refuerzo en toma de decisiones preventivas."
        ],
        courses: [
            "Liderazgo preventivo en minería.",
            "Gestión de equipos y seguridad operacional."
        ],
        supervisor: "Potenciar autonomía preventiva y reforzar liderazgo en escenarios críticos."
    }
};
async function generateOperationalFinalReport(participantId) {
    const participant = await db_1.default.participant.findUnique({
        where: {
            id: participantId
        },
        include: {
            company: true
        }
    });
    if (!participant) {
        throw new Error("Participante no encontrado");
    }
    const results = await db_1.default.evaluationResult.findMany({
        where: {
            participantId
        },
        include: {
            evaluation: true
        },
        orderBy: {
            createdAt: "desc"
        }
    });
    /* ======================================
    COMPETENCIAS
    ====================================== */
    const competencies = [];
    results.forEach((result) => {
        let json = {};
        try {
            json =
                typeof result.resultJson === "string"
                    ? JSON.parse(result.resultJson)
                    : result.resultJson || {};
        }
        catch {
            json = {};
        }
        const list = json.competencies ||
            json.competenciasDetalle ||
            [];
        list.forEach((c) => {
            if (c &&
                c.name &&
                typeof c.score === "number") {
                competencies.push({
                    name: c.name,
                    score: c.score
                });
            }
        });
    });
    /* ======================================
    SCORE
    ====================================== */
    const score = results.length
        ? Math.round(results.reduce((acc, r) => acc + (r.score || 0), 0) / results.length)
        : 0;
    /* ======================================
    TRAFFIC
    ====================================== */
    let traffic = {
        color: "ROJO",
        result: "NO RECOMENDABLE"
    };
    if (score >= 85) {
        traffic = {
            color: "VERDE",
            result: "RECOMENDABLE"
        };
    }
    else if (score >= 55) {
        traffic = {
            color: "AMARILLO",
            result: "RECOMENDABLE CON OBSERVACIONES"
        };
    }
    /* ======================================
    TOPS
    ====================================== */
    const topStrengths = [...competencies]
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
    const topGaps = [...competencies]
        .sort((a, b) => a.score - b.score)
        .slice(0, 3);
    /* ======================================
    HTML
    ====================================== */
    const strengthsHTML = topStrengths.map((c) => `

      • ${c.name} (${c.score}%)

    `).join("<br/>");
    const gapsHTML = topGaps.map((c) => `

      • ${c.name} (${c.score}%)

    `).join("<br/>");
    /* ======================================
    PROFILE
    ====================================== */
    const profile = participant.perfil ||
        "Operador";
    /* ======================================
    IA FINAL
    ====================================== */
    const aiInsights = await (0, finalOperationalAI_1.generateFinalOperationalAI)({
        profile,
        score,
        traffic,
        competencies,
        evaluations: results.map((r) => ({
            type: r.evaluation?.name,
            score: r.score
        }))
    });
    /* ======================================
    REGLAS OPERACIONALES
    ====================================== */
    const dynamicRisks = [];
    const dynamicFollowUp = [];
    const dynamicCourses = [];
    const dynamicSupervisor = [];
    topGaps.forEach((gap) => {
        const config = competencyActions[gap.name];
        if (!config)
            return;
        dynamicRisks.push(...config.risks);
        dynamicFollowUp.push(...config.followUp);
        dynamicCourses.push(...config.courses);
        dynamicSupervisor.push(config.supervisor);
    });
    /* ======================================
    IA + REGLAS
    ====================================== */
    const executiveSummary = aiInsights.executiveSummary || "";
    const operationalImpact = aiInsights.operationalImpact || "";
    const risks = [
        ...(aiInsights.exposureFactors || []),
        ...dynamicRisks
    ];
    const followUp = [
        ...(aiInsights.developmentPlan || []),
        ...dynamicFollowUp
    ];
    const recommendedCourses = [
        ...(aiInsights.recommendedCourses || []),
        ...dynamicCourses
    ];
    const supervisorAdvice = `

${aiInsights.supervisorAdvice || ""}

${dynamicSupervisor.join(" ")}

`;
    const finalConclusion = aiInsights.finalConclusion || "";
    /* ======================================
    CARDS
    ====================================== */
    const evaluationsCards = results.map((r) => {
        const score = Math.round(r.score || 0);
        let color = "#dc2626";
        let label = "NO RECOMENDABLE";
        if (score >= 85) {
            color = "#16a34a";
            label =
                "RECOMENDABLE";
        }
        else if (score >= 55) {
            color = "#d97706";
            label =
                "RECOMENDABLE CON OBSERVACIONES";
        }
        return `

        <div class="kpi">

          <div class="kpi-title">
            ${r.evaluation?.name || ""}
          </div>

          <div
            class="kpi-score"
            style="color:${color}"
          >
            ${score}%
          </div>

          <div
            class="kpi-result"
            style="color:${color}"
          >
            ${label}
          </div>

        </div>

      `;
    }).join("");
    /* ======================================
    COURSES
    ====================================== */
    const uniqueCourses = [...new Set(recommendedCourses)];
    const coursesHTML = uniqueCourses.length
        ? uniqueCourses.map((course) => `

          <li>${course}</li>

        `).join("")
        : `
          <li>
            Seguridad minera operacional
          </li>
        `;
    /* ======================================
    FOLLOW UP
    ====================================== */
    const uniqueFollowUp = [...new Set(followUp)];
    /* ======================================
    DEVELOPMENT PLAN
    ====================================== */
    const developmentPlan = `

    <div class="summary-grid">

      <div class="good-box">

        <div class="summary-title">
          Seguimiento recomendado
        </div>

        <div class="text">

          <ul>

            ${uniqueFollowUp
        .map((item) => `
                <li>${item}</li>
              `)
        .join("")}

          </ul>

        </div>

      </div>

      <div class="good-box">

        <div class="summary-title">
          Capacitación sugerida
        </div>

        <div class="text">

          <ul>

            ${coursesHTML}

          </ul>

        </div>

      </div>

    </div>

  `;
    /* ======================================
    SUMMARY
    ====================================== */
    const supervisorSummary = `

    <div class="executive-box">

      <div class="summary-title">
        Síntesis ejecutiva
      </div>

      <div class="text">
        ${executiveSummary}
      </div>

    </div>

    <div class="alert-box">

      <div class="alert-title">
        Impacto operacional observado
      </div>

      <div class="text">
        ${operationalImpact}
      </div>

    </div>

    <div class="good-box">

      <div class="summary-title">
        Orientación para supervisión
      </div>

      <div class="text">
        ${supervisorAdvice}
      </div>

    </div>

  `;
    /* ======================================
    EMPLOYER SUPPORT
    ====================================== */
    const employerSupport = `

    <div class="legal-grid">

      <div class="legal-card">

        <div class="legal-title">
          Continuidad operacional
        </div>

        <div class="legal-text">
          Favorece procesos preventivos
          y reducción de exposición operacional.
        </div>

      </div>

      <div class="legal-card">

        <div class="legal-title">
          Respaldo preventivo
        </div>

        <div class="legal-text">
          Evidencia objetiva para procesos
          de incorporación y seguimiento.
        </div>

      </div>

      <div class="legal-card">

        <div class="legal-title">
          Gestión de riesgo
        </div>

        <div class="legal-text">
          Permite detectar oportunidades
          de mejora preventiva.
        </div>

      </div>

      <div class="legal-card">

        <div class="legal-title">
          Seguridad operacional
        </div>

        <div class="legal-text">
          Compatible con estándares
          preventivos mineros.
        </div>

      </div>

    </div>

  `;
    /* ======================================
    RISK ARROW
    ====================================== */
    const riskArrowClass = traffic.color === "VERDE"
        ? "green"
        : traffic.color === "AMARILLO"
            ? "orange"
            : "red";
    /* ======================================
    RETURN
    ====================================== */
    return {
        participant,
        date: new Date()
            .toLocaleDateString("es-CL"),
        score,
        traffic,
        competencies,
        strengths: strengthsHTML,
        gaps: gapsHTML,
        evaluationsCards,
        radar: "",
        riskArrowClass,
        developmentPlan,
        supervisorSummary,
        employerSupport,
        operationalExposureAnalysis: `

      <div class="alert-box">

        <div class="alert-title">
          Factores de exposición operacional
        </div>

        <div class="text">

          <ul>

            ${risks.length
            ? [...new Set(risks)]
                .map((r) => `
                      <li>${r}</li>
                    `).join("")
            : `
                    <li>
                      No se observan factores críticos
                      de exposición operacional inmediata.
                    </li>
                  `}

          </ul>

          <br/>

          <strong>
            Conclusión operacional:
          </strong>

          <br/><br/>

          ${finalConclusion}

        </div>

      </div>

    `
    };
}
