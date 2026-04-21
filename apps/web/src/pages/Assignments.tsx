import { useEffect,useState } from "react"
import { apiFetch } from "../api"
import * as XLSX from "xlsx"

import PageContainer from "../components/PageContainer"
import Card from "../components/Card"
import SearchBox from "../components/SearchBox"

export default function Assignments(){

  const [participants,setParticipants] = useState<any[]>([])
  const [evaluations,setEvaluations] = useState<any[]>([])
  const [assignments,setAssignments] = useState<any[]>([])

  const [participantId,setParticipantId] = useState("")
  const [selected,setSelected] = useState<string[]>([])
  const [search,setSearch] = useState("")

  const [sending,setSending] = useState(false)
  const [message,setMessage] = useState("")

  useEffect(()=>{ load() },[])

  async function load(){
    const p = await apiFetch("/api/participants")
    const e = await apiFetch("/api/evaluations")
    const a = await apiFetch("/api/assignments")

    const clean = (e || []).filter((ev:any)=>
      ev.name && ev.name !== "eee" && ev.name.length > 2
    )

    setParticipants(p || [])
    setEvaluations(clean)
    setAssignments(a || [])
  }

  function toggleEvaluation(id:string){
    if(selected.includes(id)){
      setSelected(selected.filter(s=>s!==id))
    }else{
      setSelected([...selected,id])
    }
  }

  function formatName(name:string){
    if(!name) return ""
    const n = name.toLowerCase().trim()

    if(n.includes("icom")) return "Evaluación ICOM"
    if(n.includes("pets")) return "Evaluación PETS"

    if(n.includes("seguridad")){
      let label = name.replace(/seguridad/i,"").trim()
      label = label.split("_").join(" ")
      label = label.split(" ").map(w=>w.charAt(0).toUpperCase()+w.slice(1).toLowerCase()).join(" ")
      return label ? `Evaluación SEGURIDAD - ${label}` : "Evaluación SEGURIDAD"
    }

    return name
  }

  async function assign(){

    if(!participantId){
      setMessage("Selecciona un participante")
      return
    }

    for(const evaluationId of selected){
      await apiFetch("/api/assignments",{
        method:"POST",
        body:{ participantId, evaluationId }
      })
    }

    setSelected([])
    setMessage("Asignación realizada correctamente")
    load()
  }

  /* =========================
  🔥 ENVÍO PRO
  ========================= */
  async function sendInvitationsBulk(){

    try{

      if(sending) return

      const ok = confirm("¿Enviar invitaciones pendientes?")
      if(!ok) return

      setSending(true)
      setMessage("Enviando invitaciones...")

      const res = await apiFetch("/api/send-invitation",{
        method:"POST"
      })

      setMessage(`✔ Enviados: ${res.sent} | Omitidos: ${res.skipped}`)

    }catch(err){
      console.error(err)
      setMessage("Error enviando invitaciones")
    }

    setSending(false)
  }

  async function handleFile(e:any){

    const file = e.target.files[0]
    if(!file) return

    const reader = new FileReader()

    reader.onload = async (evt:any)=>{

      const base64 = evt.target.result.split(",")[1]

      setMessage("Procesando archivo...")

      await apiFetch("/api/participants/bulk",{
        method:"POST",
        body:{ file: base64 }
      })

      setMessage("✔ Carga masiva completada")
      load()
    }

    reader.readAsDataURL(file)
  }

  function downloadTemplate(){

    const headers = [
      "nombre","apellido","rut","email","empresa","perfil",
      ...evaluations.map(e => e.name)
    ]

    const example:any = {
      nombre:"Juan",
      apellido:"Perez",
      rut:"11111111-1",
      email:"juan@mail.com",
      empresa:"SIMOTEC",
      perfil:"Supervisor"
    }

    evaluations.forEach(e=>{
      example[e.name] = ""
    })

    const ws = XLSX.utils.json_to_sheet([example], { header: headers })

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla")

    XLSX.writeFile(wb, "plantilla_participantes.xlsx")
  }

  function translateStatus(status:string){
    if(status==="PENDING") return "Pendiente"
    if(status==="STARTED") return "En progreso"
    if(status==="COMPLETED") return "Completado"
    return status
  }

  function statusColor(status:string){
    if(status==="PENDING") return "#f59e0b"
    if(status==="STARTED") return "#3b82f6"
    if(status==="COMPLETED") return "#16a34a"
    return "#6b7280"
  }

  const filteredAssignments = assignments.filter((a:any)=>
    `${a.participant?.nombre} ${a.participant?.apellido}`
    .toLowerCase()
    .includes(search.toLowerCase())
  )

  return(

    <PageContainer title="Asignaciones">

      {/* 🔥 MENSAJE PRO */}
      {message && (
        <div style={styles.message}>
          {message}
        </div>
      )}

      <Card title="Gestión de asignaciones">

        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>

          <button style={styles.downloadBtn} onClick={downloadTemplate}>
            Descargar plantilla
          </button>

          <label style={styles.uploadBtn}>
            Subir Excel
            <input type="file" accept=".xlsx" onChange={handleFile} hidden />
          </label>

          <button
            style={{
              ...styles.inviteBtn,
              opacity:sending?0.6:1
            }}
            onClick={sendInvitationsBulk}
          >
            {sending ? "Enviando..." : "Enviar invitaciones"}
          </button>

        </div>

      </Card>

      <Card title="Asignar evaluaciones">

        <select
          value={participantId}
          onChange={(e)=>setParticipantId(e.target.value)}
          style={styles.select}
        >
          <option value="">Seleccione participante</option>
          {participants.map(p=>(
            <option key={p.id} value={p.id}>
              {p.nombre} {p.apellido}
            </option>
          ))}
        </select>

        <div style={styles.grid}>
          {evaluations.map(e=>{
            const isSelected = selected.includes(e.id)
            return(
              <div
                key={e.id}
                onClick={()=>toggleEvaluation(e.id)}
                style={{
                  ...styles.card,
                  background:isSelected?"#2563eb":"#f9fafb",
                  color:isSelected?"#fff":"#111"
                }}
              >
                <input type="checkbox" checked={isSelected} readOnly />
                {formatName(e.name)}
              </div>
            )
          })}
        </div>

        <button style={styles.button} onClick={assign}>
          Asignar
        </button>

      </Card>

      <Card title="Asignaciones">

        <SearchBox onSearch={setSearch}/>

        <table style={styles.table}>
          <thead>
            <tr>
              <th>Participante</th>
              <th>Estado</th>
            </tr>
          </thead>

          <tbody>
            {filteredAssignments.map(a=>(
              <tr key={a.id}>
                <td>{a.participant?.nombre} {a.participant?.apellido}</td>
                <td>
                  <span style={{
                    background:statusColor(a.status),
                    color:"#fff",
                    padding:"4px 10px",
                    borderRadius:6
                  }}>
                    {translateStatus(a.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>

        </table>

      </Card>

    </PageContainer>
  )
}

const styles:any={

  message:{
    marginBottom:15,
    padding:"10px",
    background:"#ecfeff",
    border:"1px solid #06b6d4",
    borderRadius:6
  },

  select:{ padding:10, border:"1px solid #ddd", borderRadius:6 },

  grid:{
    display:"grid",
    gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",
    gap:10,
    marginTop:10
  },

  card:{
    padding:10,
    borderRadius:8,
    cursor:"pointer",
    display:"flex",
    gap:10
  },

  button:{
    marginTop:10,
    padding:"10px",
    background:"#2563eb",
    color:"#fff",
    border:"none",
    borderRadius:6
  },

  table:{
    width:"100%",
    marginTop:10
  },

  downloadBtn:{
    background:"#2563eb",
    color:"#fff",
    padding:"10px 16px",
    borderRadius:8,
    border:"none",
    cursor:"pointer"
  },

  uploadBtn:{
    background:"#16a34a",
    color:"#fff",
    padding:"10px 16px",
    borderRadius:8,
    cursor:"pointer"
  },

  inviteBtn:{
    background:"#3826dc",
    color:"#fff",
    padding:"10px 16px",
    borderRadius:8,
    border:"none",
    cursor:"pointer"
  }

}