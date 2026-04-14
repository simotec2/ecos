import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { apiFetch } from "../api"

export default function AuditResultDetail(){

const { id } = useParams()

const [result,setResult] = useState<any>(null)

useEffect(()=>{
load()
},[])

async function load(){

const data = await apiFetch(`/api/results/${id}`)

setResult(data)

}

if(!result){
return <div style={{padding:40}}>Cargando...</div>
}

return(

<div style={{padding:40}}>

<h2>Resultado de evaluación</h2>

<div style={{marginTop:20}}>

<b>Participante:</b>
{result.participant?.nombre} {result.participant?.apellido}

</div>

<div>
<b>Evaluación:</b> {result.evaluation?.name}
</div>

<div>
<b>Puntaje:</b> {result.score?.toFixed(2)} %
</div>

<div style={{marginTop:30}}>

<h3>Respuestas</h3>

{result.answers?.map((a:any,i:number)=>(

<div key={a.id} style={{
background:"#fff",
padding:20,
borderRadius:8,
marginBottom:15
}}>

<div style={{fontWeight:600}}>
Pregunta {i+1}
</div>

<div>
{a.question?.text}
</div>

<div style={{marginTop:10}}>
<b>Respuesta participante:</b>
</div>

<div>
{a.answerText}
</div>

<div style={{marginTop:10}}>
<b>Análisis IA:</b>
</div>

<div>
{a.aiAnalysis}
</div>

</div>

))}

</div>

</div>

)

}