import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { apiFetch } from "../api"

/* =========================
RADAR
========================= */
function RadarChart({ data }:{ data:any[] }){

  const size = 320
  const center = size / 2
  const radius = 120

  if(!data || data.length === 0){
    return <div>No hay datos</div>
  }

  const angleStep = (Math.PI * 2) / data.length

  function getPoint(i:number, value:number){
    const angle = i * angleStep - Math.PI / 2
    const r = (value / 100) * radius

    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    }
  }

  const points = data.map((d,i)=>{
    const p = getPoint(i, d.score)
    return `${p.x},${p.y}`
  }).join(" ")

  return(
    <svg width={size} height={size}>

      {[20,40,60,80,100].map((lvl,i)=>(
        <circle
          key={i}
          cx={center}
          cy={center}
          r={(lvl/100)*radius}
          fill="none"
          stroke="#e5e7eb"
        />
      ))}

      {data.map((_,i)=>{
        const angle = i * angleStep - Math.PI / 2
        const x = center + radius * Math.cos(angle)
        const y = center + radius * Math.sin(angle)

        return(
          <line
            key={i}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            stroke="#e5e7eb"
          />
        )
      })}

      <polygon
        points={points}
        fill="rgba(22,163,74,0.3)"
        stroke="#16a34a"
        strokeWidth={2}
      />

    </svg>
  )
}

export default function ReportView(){

  const { id } = useParams()

  const [report,setReport] = useState<any>(null)
  const [data,setData] = useState<any>(null)

  useEffect(()=>{
    load()
  },[])

  async function load(){

    const res = await apiFetch(`/api/results/${id}`)

    setReport(res)

    const parsed = JSON.parse(res.resultJson || "{}")

    parsed.competencies = (parsed.competencies || []).filter((c:any)=>{
      const name = (c.name || "").toLowerCase()
      return !name.includes("debe sumarse")
    })

    setData(parsed)
  }

  function getColor(color:string){
    if(color === "VERDE") return "#16a34a"
    if(color === "AMARILLO") return "#f59e0b"
    return "#dc2626"
  }

  function formatText(text:string){
    if(!text) return ""

    return text
      .replace(/##/g, "\n\n")
      .replace(/\*\*/g, "")
  }

  if(!report || !data){
    return <div style={{padding:40}}>Cargando informe...</div>
  }

  const score = data.score ?? report.score ?? 0

  return(

    <div id="report-container" style={{
      padding:40,
      maxWidth:1100,
      margin:"auto",
      background:"#f3f4f6"
    }}>

      {/* HEADER */}
      <div style={{
        display:"flex",
        justifyContent:"space-between",
        alignItems:"center",
        marginBottom:25,
        background:"#fff",
        padding:25,
        borderRadius:12,
        boxShadow:"0 2px 6px rgba(0,0,0,0.08)"
      }}>
        <div>
          <img src="/ecos-logo.png" style={{height:60}} />
          <div style={{marginTop:10,fontSize:20,fontWeight:600}}>
            Informe ECOS
          </div>
          <div style={{color:"#6b7280"}}>
            {report.evaluation?.name}
          </div>
        </div>

        <div style={{
          background:getColor(data.traffic?.color),
          color:"#fff",
          padding:"20px 30px",
          borderRadius:12,
          textAlign:"center",
          minWidth:140
        }}>
          <div style={{fontSize:28,fontWeight:"bold"}}>
            {score.toFixed(1)}%
          </div>
          <div style={{fontSize:13}}>
            {data.traffic?.result}
          </div>
        </div>
      </div>

      {/* DATOS */}
      <div style={{
        background:"#fff",
        padding:20,
        borderRadius:12,
        marginBottom:25,
        lineHeight:1.6
      }}>
        <div>
          <b>Participante:</b> {report.participant?.nombre} {report.participant?.apellido}
        </div>
        <div>
          <b>Empresa:</b> {report.participant?.company?.name || "-"}
        </div>
      </div>

      {/* MAPA DE COMPETENCIAS */}
      <div style={{
        background:"#fff",
        padding:25,
        borderRadius:12,
        marginBottom:25
      }}>

        <h2 style={{marginBottom:20}}>Mapa de Competencias</h2>

        <div style={{
          display:"flex",
          justifyContent:"center",
          alignItems:"center",
          height:360
        }}>
          <RadarChart data={data.competencies}/>
        </div>

        <div style={{
          marginTop:20,
          display:"flex",
          justifyContent:"space-between",
          fontSize:14,
          color:"#6b7280"
        }}>
          <div>
            <b>Fortalezas:</b>{" "}
            {data.competencies
              .filter((c:any)=>c.score >= 75)
              .slice(0,3)
              .map((c:any)=>c.name)
              .join(", ") || "—"}
          </div>

          <div>
            <b>Áreas a reforzar:</b>{" "}
            {data.competencies
              .filter((c:any)=>c.score < 55)
              .slice(0,3)
              .map((c:any)=>c.name)
              .join(", ") || "—"}
          </div>
        </div>

      </div>

      {/* ANALISIS */}
      <div style={{
        background:"#fff",
        padding:25,
        borderRadius:12
      }}>
        <h2>Análisis Profesional</h2>

        <div style={{
          whiteSpace:"pre-wrap",
          lineHeight:1.7,
          marginTop:15,
          fontSize:14
        }}>
          {formatText(data.reportText)}
        </div>
      </div>

    </div>
  )
}