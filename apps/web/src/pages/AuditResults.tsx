import { useEffect, useState } from "react"
import { apiFetch } from "../api"
import { useNavigate } from "react-router-dom"

export default function AuditResults(){

const navigate = useNavigate()

const [results,setResults] = useState<any[]>([])
const [loading,setLoading] = useState(true)

useEffect(()=>{
load()
},[])

async function load(){

try{

const data = await apiFetch("/api/results")

setResults(data || [])

}catch(err){

console.error(err)

}finally{

setLoading(false)

}

}

if(loading){
return <div style={{padding:40}}>Cargando resultados...</div>
}

return(

<div style={{padding:40}}>

<h2>Auditoría de evaluaciones</h2>

<table style={{
width:"100%",
marginTop:30,
background:"#fff",
borderRadius:10
}}>

<thead>

<tr>

<th style={{padding:10,textAlign:"left"}}>Participante</th>
<th style={{padding:10,textAlign:"left"}}>Evaluación</th>
<th style={{padding:10,textAlign:"left"}}>Puntaje</th>
<th style={{padding:10}}>Acciones</th>

</tr>

</thead>

<tbody>

{results.map((r:any)=>(

<tr key={r.id}>

<td style={{padding:10}}>
{r.participant?.nombre} {r.participant?.apellido}
</td>

<td style={{padding:10}}>
{r.evaluation?.name}
</td>

<td style={{padding:10}}>
{r.score?.toFixed(2)} %
</td>

<td style={{padding:10}}>

<button
onClick={()=>navigate(`/app/audit/${r.id}`)}
style={{
background:"#2563eb",
color:"#fff",
border:"none",
padding:"6px 10px",
borderRadius:6
}}
>
Ver
</button>

</td>

</tr>

))}

</tbody>

</table>

</div>

)

}