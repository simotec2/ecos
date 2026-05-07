import { useEffect, useState } from "react"
import { apiFetch } from "../api"
import PageContainer from "../components/PageContainer"
import Card from "../components/Card"
import FormGrid from "../components/FormGrid"
import SearchBox from "../components/SearchBox"

export default function Participants(){

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

  const [editing,setEditing] = useState<any>(null)

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  )

  const isSuperAdmin =
    user?.role === "SUPERADMIN"

  useEffect(()=>{
    loadParticipants()
    loadCompanies()
    loadEvaluations()
  },[])

  async function loadParticipants(){

    try{

      const data = await apiFetch("/api/participants")

      setParticipants(data || [])

    }catch{

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

    }catch{

      alert("Error cargando empresas")

    }

  }

  async function loadEvaluations(){

    try{

      const data = await apiFetch("/api/evaluations")

      setEvaluations(data || [])

    }catch{

      alert("Error cargando evaluaciones")

    }

  }

  function toggleEvaluation(id:string){

    if(selectedEvaluations.includes(id)){

      setSelectedEvaluations(
        selectedEvaluations.filter(e=>e!==id)
      )

    }else{

      setSelectedEvaluations([
        ...selectedEvaluations,
        id
      ])

    }

  }

  async function createParticipant(){

    if(!nombre || !apellido || !rut){

      alert("Completa nombre, apellido y rut")

      return

    }

    if(!perfil){

      alert("Selecciona un perfil")

      return

    }

    try{

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

      alert("Participante creado")

    }catch{

      alert("Error creando participante")

    }

  }

  async function updateParticipant(){

    try{

      await apiFetch(`/api/participants/${editing.id}`,{
        method:"PUT",
        body:{
          nombre:editing.nombre,
          apellido:editing.apellido,
          rut:editing.rut,
          perfil:editing.perfil,
          email:editing.email,
          companyId:editing.companyId
        }
      })

      setEditing(null)

      await loadParticipants()

      alert("Actualizado correctamente")

    }catch{

      alert("Error actualizando")

    }

  }

  async function resendInvitation(id:string){

    if(!confirm("¿Reenviar invitación?")){
      return
    }

    try{

      await apiFetch(`/api/participants/${id}/resend`,{
        method:"POST"
      })

      alert("Invitación reenviada")

    }catch{

      alert("Error reenviando")

    }

  }

  async function deleteParticipant(id:string){

    if(!isSuperAdmin){
      return
    }

    const confirmDelete = confirm(
      "¿Seguro que deseas eliminar este participante? Esta acción no se puede deshacer."
    )

    if(!confirmDelete){
      return
    }

    try{

      await apiFetch(`/api/participants/${id}`,{
        method:"DELETE"
      })

      await loadParticipants()

      alert("Participante eliminado")

    }catch{

      alert("Error eliminando participante")

    }

  }

  const filtered = participants.filter((p:any)=>

    `${p.nombre} ${p.apellido} ${p.rut}`
      .toLowerCase()
      .includes(search.toLowerCase())

  )

  return(

    <PageContainer title="Participantes">

      {/* ======================================
      NUEVO PARTICIPANTE
      ====================================== */}

      <Card title="Nuevo participante">

        <div style={styles.companySelector}>

          <select
            value={companyId}
            onChange={(e)=>setCompanyId(e.target.value)}
          >

            {companies.map((c:any)=>(

              <option key={c.id} value={c.id}>
                {c.name}
              </option>

            ))}

          </select>

        </div>

        <FormGrid>

          <input
            placeholder="Nombre"
            value={nombre}
            onChange={e=>setNombre(e.target.value)}
          />

          <input
            placeholder="Apellido"
            value={apellido}
            onChange={e=>setApellido(e.target.value)}
          />

          <input
            placeholder="RUT"
            value={rut}
            onChange={e=>setRut(e.target.value)}
          />

          <select
            value={perfil}
            onChange={e=>setPerfil(e.target.value)}
          >

            <option value="">
              Seleccionar perfil
            </option>

            <option value="Operador">
              Operador
            </option>

            <option value="Supervisor">
              Supervisor
            </option>

          </select>

          <input
            placeholder="Email"
            value={email}
            onChange={e=>setEmail(e.target.value)}
          />

        </FormGrid>

        <button
          style={styles.button}
          onClick={createParticipant}
        >
          Crear participante
        </button>

      </Card>

      {/* ======================================
      LISTADO
      ====================================== */}

      <Card title="Listado de participantes">

        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="Buscar..."
        />

        <table style={styles.table}>

          <thead>

            <tr>

              <th style={styles.th}>Nombre</th>
              <th style={styles.th}>Perfil</th>
              <th style={styles.th}>RUT</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Empresa</th>
              <th style={styles.th}>Acciones</th>

            </tr>

          </thead>

          <tbody>

            {filtered.map((p:any)=>(

              <tr key={p.id}>

                <td style={styles.td}>
                  {p.nombre} {p.apellido}
                </td>

                <td style={styles.td}>
                  {p.perfil || "-"}
                </td>

                <td style={styles.td}>
                  {p.rut}
                </td>

                <td style={styles.td}>
                  {p.email || "-"}
                </td>

                <td style={styles.td}>
                  {p.company?.name || "-"}
                </td>

                <td style={styles.td}>

                  <div style={styles.actions}>

                    <button
                      style={styles.iconBtnBlue}
                      onClick={()=>setEditing(p)}
                      title="Editar participante"
                    >
                      ✏️
                    </button>

                    <button
                      style={styles.resendBtn}
                      onClick={()=>resendInvitation(p.id)}
                    >
                      Reenviar
                    </button>

                    {isSuperAdmin && (

                      <button
                        style={styles.deleteBtn}
                        onClick={()=>deleteParticipant(p.id)}
                        title="Eliminar participante"
                      >
                        🗑️
                      </button>

                    )}

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </Card>

      {/* ======================================
      MODAL EDICIÓN
      ====================================== */}

      {editing && (

        <div style={styles.modal}>

          <div style={styles.modalBox}>

            <h3>Editar participante</h3>

            <input
              value={editing.nombre}
              onChange={e=>setEditing({
                ...editing,
                nombre:e.target.value
              })}
            />

            <input
              value={editing.apellido}
              onChange={e=>setEditing({
                ...editing,
                apellido:e.target.value
              })}
            />

            <input
              value={editing.rut}
              onChange={e=>setEditing({
                ...editing,
                rut:e.target.value
              })}
            />

            <select
              value={editing.perfil || ""}
              onChange={e=>setEditing({
                ...editing,
                perfil:e.target.value
              })}
            >

              <option value="">
                Seleccionar perfil
              </option>

              <option value="Operador">
                Operador
              </option>

              <option value="Supervisor">
                Supervisor
              </option>

            </select>

            <input
              value={editing.email || ""}
              onChange={e=>setEditing({
                ...editing,
                email:e.target.value
              })}
            />

            <div style={{
              display:"flex",
              gap:10,
              marginTop:10
            }}>

              <button onClick={updateParticipant}>
                Guardar
              </button>

              <button onClick={()=>setEditing(null)}>
                Cancelar
              </button>

            </div>

          </div>

        </div>

      )}

    </PageContainer>

  )

}

const styles:any = {

  companySelector:{
    marginBottom:16
  },

  button:{
    marginTop:15,
    padding:"10px 18px",
    background:"#2563eb",
    color:"#fff",
    border:"none",
    borderRadius:6,
    cursor:"pointer"
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
  },

  actions:{
    display:"flex",
    alignItems:"center",
    gap:6,
    flexWrap:"nowrap"
  },

  iconBtnBlue:{
    width:30,
    height:30,
    background:"#7f9cda",
    color:"#fff",
    border:"none",
    borderRadius:6,
    cursor:"pointer",
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
    padding:0,
    fontSize:14,
    lineHeight:1
  },

  resendBtn:{
    padding:"6px 10px",
    background:"#0fbd4e",
    color:"#fff",
    border:"none",
    borderRadius:4,
    cursor:"pointer",
    whiteSpace:"nowrap"
  },

  deleteBtn:{
    width:30,
    height:30,
    background:"#b1a2a2",
    color:"#fff",
    border:"none",
    borderRadius:6,
    cursor:"pointer",
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
    fontSize:14,
    padding:0,
    lineHeight:1
  },

  modal:{
    position:"fixed",
    top:0,
    left:0,
    right:0,
    bottom:0,
    background:"rgba(0,0,0,0.4)",
    display:"flex",
    alignItems:"center",
    justifyContent:"center"
  },

  modalBox:{
    background:"#fff",
    padding:20,
    borderRadius:8,
    width:320,
    display:"flex",
    flexDirection:"column",
    gap:10
  }

}