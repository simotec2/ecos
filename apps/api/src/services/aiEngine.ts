function getLevel(score:number){

  if(score >= 80) return "ALTO"

  if(score >= 60) return "ADECUADO"

  if(score >= 40) return "EN DESARROLLO"

  return "CRITICO"

}

function getTraffic(score:number){

  if(score >= 85){

    return {
      color:"VERDE",
      result:"RECOMENDABLE"
    }

  }

  if(score >= 55){

    return {
      color:"AMARILLO",
      result:"RECOMENDABLE CON OBSERVACIONES"
    }

  }

  return {
    color:"ROJO",
    result:"NO RECOMENDABLE"
  }

}

export async function evaluateCompetencyAI(
  question:string,
  answer:string,
  keywords:string[]
){

  if(!answer || answer.trim().length === 0){

    return {
      competent:false,
      score:20
    }

  }

  const text = answer.toLowerCase()

  let matches = 0

  for(const k of (keywords || [])){

    if(
      text.includes(
        String(k).toLowerCase()
      )
    ){

      matches++

    }

  }

  let keywordScore = 50

  if(keywords?.length){

    keywordScore = Math.max(

      Math.round(
        (matches / keywords.length) * 100
      ),

      20

    )

  }

  const length = answer.length

  let depthScore = 40

  if(length > 200) depthScore = 100
  else if(length > 120) depthScore = 80
  else if(length > 60) depthScore = 60
  else if(length > 30) depthScore = 40
  else depthScore = 20

  const finalScore = Math.round(

    (keywordScore * 0.6) +
    (depthScore * 0.4)

  )

  return {

    competent: finalScore >= 60,

    score: finalScore || 30

  }

}

export async function generateAIReport(
  input:any
){

  return `

El participante presenta un desempeño ${
    input.score >= 85
      ? "sólido"
      : input.score >= 55
      ? "adecuado con observaciones"
      : "con brechas relevantes"
  } en las competencias evaluadas.

Los resultados evidencian fortalezas y oportunidades de mejora asociadas al desempeño preventivo y operacional del participante.

Se recomienda reforzar acompañamiento preventivo y seguimiento operacional de acuerdo con las áreas detectadas.

  `.trim()

}

export function generateRecommendations(
  competencies:any[]
){

  return (competencies || []).map(c=>({

    name:c.name,

    text:
      c.score >= 80
        ? "Mantener como fortaleza operacional."
        : c.score >= 60
        ? "Reforzar consistencia en terreno."
        : c.score >= 40
        ? "Desarrollar mediante capacitación."
        : "Requiere intervención prioritaria."

  }))

}

export function calculateRisk(
  score:number
){

  if(score >= 85){

    return {
      level:"BAJO",
      text:"Riesgo operacional bajo."
    }

  }

  if(score >= 55){

    return {
      level:"MEDIO",
      text:"Riesgo operacional moderado."
    }

  }

  return {
    level:"ALTO",
    text:"Riesgo operacional alto."
  }

}

export function enrichCompetencies(
  competencies:any[]
){

  return (competencies || []).map(c=>({

    ...c,

    levelLabel:getLevel(c.score),

    traffic:getTraffic(c.score)

  }))

}