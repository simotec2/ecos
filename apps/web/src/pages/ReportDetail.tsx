import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { apiFetch } from "../api"
import { evaluationLabels } from "../utils/evaluationLabels"

/* =========================
PARSE IA
========================= */
function parseSections(text:string){
  if(!text) return {}
  const sections:any = {}
  const parts = text.split("\n\n")
  let current = "general"

  parts.forEach(p=>{
    const u = p.toUpperCase()
    if(u.includes("ANÁLISIS GENERAL")) current = "general"
    else if(u.includes("COMPETENCIAS")) current = "competencias"
    else if(u.includes("BRECHAS")) current = "brechas"
    else if(u.includes("CONDUCTUAL")) current = "conductual"
    else if(u.includes("RECOMENDACIONES")) current = "recomendaciones"
    else if(u.includes("CONCLUSIÓN")) current = "conclusion"

    if(!sections[current]) sections[current] = ""
    sections[current] += p + "\n\n"
  })

  return sections
}

/* =========================
CARD BASE
========================= */
function Card({ title, children }:{ title:string, children:any }){
  return(
    <div style={{
      background:"#fff",
      borderRadius:14,
      padding:22,
      boxShadow:"0 6px 18px rgba(0,0,0,0.06)",
      marginBottom:20
    }}>
      <div style={{ fontSize:16, fontWeight:600, marginBottom:12 }}>
        {title}
      </div>
      <div style={{ fontSize:14, lineHeight:1.6, whiteSpace:"pre-wrap" }}>
        {children}
      </div>
    </div>
  )
}

/* =========================
KPI CARD
========================= */
function KPI({ title, value, color }:{ title:string, value:any, color?:string }){
  return(
    <div style={{
      background:"#fff",
      borderRadius:14,
      padding:18,
      boxShadow:"0 4px 10px rgba(0,0,0,0.05)",
      textAlign:"center"
    }}>
      <div style={{ fontSize:12, color:"#64748b" }}>{title}</div>
      <div style={{ fontSize:22, fontWeight:600, color: color || "#111" }}>
        {value}
      </div>
    </div>
  )
}

/* =========================
TOP / BOTTOM CHART SIMPLE
========================= */
function TopBottom({ data }:{ data:any[] }){

  if(!data || !data.length) return null

  const sorted = [...data].sort((a,b)=>b.score-a.score)

  const top = sorted.slice(0,3)
  const bottom = sorted.slice(-3)

  function Row({ item, color }:{ item:any, color:string }){
    return(
      <div style={{ marginBottom:10 }}>
        <div style={{ fontSize:13 }}>{item.name}</div>
        <div style={{
          height:8,
          background:"#e5e7eb",
          borderRadius:6
        }}>
          <div style={{
            width:`${item.score}%`,
            height:8,
            background:color,
            borderRadius:6
          }}/>
        </div>
      </div>
    )
  }

  return(
    <div style={{
      background:"#fff",
      padding:20,
      borderRadius:14,
      boxShadow:"0 4px 12px rgba(0,0,0,0.05)"
    }}>

      <div style={{ fontWeight:600, marginBottom:10 }}>
        Fortalezas (Top 3)
      </div>

      {top.map((c,i)=>(
        <Row key={i} item={c} color="#16a34a"/>
      ))}

      <div style={{ fontWeight:600, marginTop:20, marginBottom:10 }}>
        Brechas (Bottom 3)
      </div>

      {bottom.map((c,i)=>(
        <Row key={i} item={c} color="#dc2626"/>
      ))}

    </div>
  )
}

/* =========================
MAIN
========================= */
export default function ReportDetail(){

  const { id } = useParams()

  const [report,setReport] = useState<any>(null)
  const [data,setData] = useState<any>(null)

  useEffect(()=>{ load() },[])

  async function load(){
    const res = await apiFetch(`/api/results/${id}`)
    setReport(res)
    setData(JSON.parse(res.resultJson || "{}"))
  }

  if(!report || !data){
    return <div style={{padding:40}}>Cargando...</div>
  }

  const sections = parseSections(data.aiText || "")

  function getColor(color:string){
    if(color === "VERDE") return "#16a34a"
    if(color === "AMARILLO") return "#f59e0b"
    return "#dc2626"
  }

  return(

    <div id="report-container" style={{
      maxWidth:1200,
      margin:"auto",
      padding:30,
      background:"#f3f4f6",
      fontFamily:"Arial"
    }}>

      {/* HEADER */}
      <div style={{
        background:"#fff",
        padding:25,
        borderRadius:14,
        display:"flex",
        justifyContent:"space-between",
        marginBottom:20
      }}>
        <div>
          <img src="/ecos-logo.png" style={{height:60}}/>
          <div style={{fontSize:20}}>Informe ECOS</div>
          <div>
            {evaluationLabels[report.evaluation?.type] || report.evaluation?.name}
          </div>
          <div><b>{report.participant?.nombre}</b></div>
          <div>{report.participant?.company?.name}</div>
        </div>

        <div style={{
          background:getColor(data.traffic?.color),
          color:"#fff",
          padding:"20px 30px",
          borderRadius:12,
          fontSize:22,
          fontWeight:"bold"
        }}>
          {data.score}%
        </div>
      </div>

      {/* KPI */}
      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(3,1fr)",
        gap:15,
        marginBottom:20
      }}>
        <KPI title="Resultado" value={data.traffic?.result} color={getColor(data.traffic?.color)} />
        <KPI title="Riesgo" value={data.risk?.level} />
        <KPI title="Competencias" value={data.competencies?.length} />
      </div>

      {/* TOP/BOTTOM */}
      <TopBottom data={data.competencies} />

      {/* SECCIONES */}
      <Card title="Análisis General">{sections.general}</Card>
      <Card title="Competencias">{sections.competencias}</Card>
      <Card title="Brechas">{sections.brechas}</Card>
      <Card title="Recomendaciones">{sections.recomendaciones}</Card>
      <Card title="Conclusión">{sections.conclusion}</Card>

    </div>
  )
}