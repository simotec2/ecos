import { useEffect, useState } from "react"
import { apiFetch } from "../api"
import { useNavigate } from "react-router-dom"

import PageContainer from "../components/PageContainer"
import Card from "../components/Card"
import FormGrid from "../components/FormGrid"
import SearchBox from "../components/SearchBox"

export default function Participants(){

  const navigate = useNavigate()

  const [participants,setParticipants] = useState<any[]>([])
  const [companies,setCompanies] = useState<any[]>([])
  const [evaluations,setEvaluations] = useState<any[]>([])

  const [search,setSearch] = useState("")
  const [companyId,setCompanyId] = useState("")
  const [selectedEvaluations,setSelectedEvaluations] = useState<string[]>([])

  const [nombre,setNombre] = useState("")
  const [apellido,setApellido] = useState("")
  const [rut,setRut] = useState("")
  const [perfil,setPerfil] = useState("")
  const [email,setEmail] = useState("")

  useEffect(()=>{
    loadParticipants()
    loadCompanies()
    loadEvaluations()
  },[])

  async function loadParticipants(){
    try{
      const data = await apiFetch("/api/participants")
      setParticipants(data || [])
    }catch(err){
      console.error(err)
      alert("Error cargando participantes")
    }
  }

  async function loadCompanies(){
    try{
      const data = await apiFetch("/api/companies")
      setCompanies(data || [])
      if(data?.length){
        setCompanyId(data[0].id)
      }
    }catch(err){
      console.error(err)
      alert("Error cargando empresas")
    }
  }

  async function loadEvaluations(){
    try{
      const data = await apiFetch("/api/evaluations")

      const clean = (data || []).filter((e:any)=>
        e.name &&
        e.name.trim() !== "" &&
        e.name.length > 2
      )

      setEvaluations(clean)

    }catch(err){
      console.error(err)
      alert("Error cargando evaluaciones")
    }
  }

  function toggleEvaluation(id:string){
    if(selectedEvaluations.includes(id)){
      setSelectedEvaluations(selectedEvaluations.filter(e=>e!==id))
    }else{
      setSelectedEvaluations([...selectedEvaluations,id])
    }
  }

  function getDisplayName(e:any){
    if(e.type === "PETS") return "Evaluacion Conductual"
    if(e.type === "ICOM") return "Evaluacion Psicolaboral"
    return e.name
  }

  async function createParticipant(){

    try{

      if(!nombre || !apellido || !rut){
        alert("Completa nombre, apellido y rut")
        return
      }

      const participant = await apiFetch("/api/participants",{
        method:"POST",
        body:{
          nombre,
          apellido,
          rut,
          perfil,
          email,
          companyId
        }
      })

      for(const evaluationId of selectedEvaluations){
        await apiFetch("/api/assignments",{
          method:"POST",
          body:{
            participantId:participant.id,
            evaluationId
          }
        })
      }

      setNombre("")
      setApellido("")
      setRut("")
      setPerfil("")
      setEmail("")
      setSelectedEvaluations([])

      await loadParticipants()

      alert("Participante creado correctamente")

    }catch(err){
      console.error(err)
      alert("Error creando participante")
    }
  }

  /* ======================================
  🔥 ENVÍO MASIVO POR EMPRESA
  ====================================== */
  async function sendInvitationsBulk(){

    try{

      if(!companyId){
        alert("Selecciona empresa")
        return
      }

      if(!confirm("¿Enviar invitaciones SOLO a pendientes de esta empresa?")){
        return
      }

      const res = await apiFetch("/api/send-invitation",{
        method:"POST",
        body:{ companyId }
      })

      alert(`Enviados: ${res.sent} | Omitidos: ${res.skipped}`)

    }catch(err){
      console.error(err)
      alert("Error envío masivo")
    }

  }

  const filteredParticipants=participants.filter((p:any)=>
    `${p.nombre} ${p.apellido} ${p.rut} ${p.perfil || ""}`
    .toLowerCase()
    .includes(search.toLowerCase())
  )

  return(

    <PageContainer title="Participantes">

      {/* BOTONES SUPERIORES */}
      

      {/* NUEVO PARTICIPANTE */}
      <Card title="Nuevo participante">

        <select value={companyId} onChange={(e)=>setCompanyId(e.target.value)}>
          {companies.map((c:any)=>(
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <FormGrid>
          <input placeholder="Nombre" value={nombre} onChange={(e)=>setNombre(e.target.value)}/>
          <input placeholder="Apellido" value={apellido} onChange={(e)=>setApellido(e.target.value)}/>
          <input placeholder="RUT" value={rut} onChange={(e)=>setRut(e.target.value)}/>
          <input placeholder="Perfil" value={perfil} onChange={(e)=>setPerfil(e.target.value)}/>
          <input placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)}/>
        </FormGrid>

        <h4>Evaluaciones</h4>

        <div style={styles.grid}>
          {evaluations.map((e:any)=>{

            const selected = selectedEvaluations.includes(e.id)

            return(
              <div
                key={e.id}
                onClick={()=>toggleEvaluation(e.id)}
                style={{
                  ...styles.card,
                  background:selected ? "#2563eb" : "#f8fafc",
                  color:selected ? "#fff" : "#111",
                  border:selected ? "1px solid #2563eb" : "1px solid #e5e7eb"
                }}
              >
                <input type="checkbox" checked={selected} readOnly />
                <span style={styles.cardText}>
                  {getDisplayName(e)}
                </span>
              </div>
            )
          })}
        </div>

        <button style={styles.button} onClick={createParticipant}>
          Crear participante
        </button>

      </Card>

      {/* LISTADO */}
      <Card title="Listado de participantes">

        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre, rut o perfil"
        />

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Nombre</th>
              <th style={styles.th}>RUT</th>
              <th style={styles.th}>Perfil</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Empresa</th>
            </tr>
          </thead>

          <tbody>
            {filteredParticipants.map((p:any)=>(
              <tr key={p.id}>
                <td style={styles.td}>{p.nombre} {p.apellido}</td>
                <td style={styles.td}>{p.rut}</td>
                <td style={styles.td}>{p.perfil || "-"}</td>
                <td style={styles.td}>{p.email || "-"}</td>
                <td style={styles.td}>{p.company?.name || "-"}</td>
              </tr>
            ))}
          </tbody>

        </table>

      </Card>

    </PageContainer>
  )
}

const styles:any={

  button:{
    marginTop:20,
    padding:"10px 18px",
    background:"#2563eb",
    color:"#fff",
    border:"none",
    borderRadius:6,
    cursor:"pointer"
  },

  grid:{
    display:"grid",
    gridTemplateColumns:"repeat(2, 1fr)",
    gap:12,
    marginTop:10
  },

  card:{
    display:"flex",
    alignItems:"center",
    gap:10,
    padding:"12px",
    borderRadius:8,
    cursor:"pointer"
  },

  cardText:{
    flex:1,
    fontWeight:500
  },

  table:{
    width:"100%",
    borderCollapse:"collapse",
    marginTop:10
  },

  th:{
    textAlign:"left",
    padding:"10px",
    borderBottom:"1px solid #e5e7eb"
  },

  td:{
    padding:"10px",
    borderBottom:"1px solid #f1f5f9"
  }

}