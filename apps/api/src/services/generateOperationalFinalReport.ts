import prisma from "../db"

export async function generateOperationalFinalReport(
  participantId: string
) {

  const participant =
    await prisma.participant.findUnique({

      where:{
        id:participantId
      },

      include:{
        company:true
      }

    })

  if(!participant){

    throw new Error(
      "Participante no encontrado"
    )

  }

  const results =
    await prisma.evaluationResult.findMany({

      where:{
        participantId
      },

      include:{
        evaluation:true
      }

    })

  const competencies:any[] = []

  results.forEach((result:any)=>{

    const json =
      result.resultJson || {}

    const list =
      json.competencies ||
      json.competenciasDetalle ||
      []

    list.forEach((c:any)=>{

      competencies.push({

        name:c.name,
        score:c.score

      })

    })

  })

  const score =
    results.length
      ? Math.round(
          results.reduce(
            (acc:any,r:any)=>acc+r.score,
            0
          ) / results.length
        )
      : 0

  let traffic = {
    color:"ROJO",
    result:"NO RECOMENDABLE"
  }

  if(score >= 85){

    traffic = {
      color:"VERDE",
      result:"RECOMENDABLE"
    }

  }else if(score >= 55){

    traffic = {
      color:"AMARILLO",
      result:"RECOMENDABLE CON OBSERVACIONES"
    }

  }

  return {

    participant,

    date:new Date()
      .toLocaleDateString("es-CL"),

    score,

    traffic,

    competencies,

    strengths:
      "Adecuada orientación preventiva, cumplimiento operacional y disposición hacia el trabajo seguro.",

    gaps:
      "Se recomienda reforzar aspectos específicos asociados a percepción de riesgo y control operacional.",

    evaluationsCards:"",

    radar:"",

    riskArrowClass:
      traffic.color === "VERDE"
        ? "green"
        : traffic.color === "AMARILLO"
        ? "orange"
        : "red"

  }

}