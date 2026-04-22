import { generateAIReport } from "./aiEngine"

export async function generateOrganizationalInsight({
  semaforo,
  competencias,
  total
}:{
  semaforo:any
  competencias:any
  total:number
}){

  try{

    const entries = Object.entries(competencias || {})
    const sorted = entries.sort((a:any,b:any)=> b[1] - a[1])

    const top3 = sorted.slice(0,3).map(c=>({ name:c[0], score:c[1] }))
    const bottom3 = [...sorted].reverse().slice(0,3).map(c=>({ name:c[0], score:c[1] }))

    const scoreGlobal = Math.round(
      (
        semaforo.verde*100 +
        semaforo.amarillo*65 +
        semaforo.rojo*30
      ) / (total || 1)
    )

    const insight = await generateAIReport({
      type:"ORGANIZATIONAL",
      score: scoreGlobal,
      competencies: [...top3, ...bottom3],
      answers:[]
    })

    return insight

  }catch(e){

    console.error("INSIGHT IA ERROR:", e)

    /* ===== FALLBACK PROFESIONAL ===== */

    const rojoPct = Math.round((semaforo.rojo / total) * 100)

    if(rojoPct > 50){
      return "Se observa una alta concentración de riesgo operacional en la organización, con una proporción significativa de evaluados en condición crítica. Se recomienda intervención estructurada y priorización de entrenamiento en terreno."
    }

    if(rojoPct > 25){
      return "La organización presenta focos de riesgo relevantes que requieren seguimiento y reforzamiento en competencias clave asociadas a la operación."
    }

    return "La organización presenta un nivel de riesgo controlado, con oportunidades de mejora en competencias específicas."
  }
}