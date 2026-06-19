import { useEffect, useState } from "react"
import { apiFetch } from "../api"

const PERMISSIONS = [

  { key:"DASHBOARD_VIEW", label:"Ver dashboard" },

  { key:"COMPANIES_VIEW", label:"Ver empresas" },
  { key:"COMPANIES_CREATE", label:"Crear empresas" },
  { key:"COMPANIES_EDIT", label:"Editar empresas" },
  { key:"COMPANIES_DELETE", label:"Eliminar empresas" },

  { key:"USERS_VIEW", label:"Ver usuarios" },
  { key:"USERS_CREATE", label:"Crear usuarios" },
  { key:"USERS_EDIT", label:"Editar usuarios" },
  { key:"USERS_DELETE", label:"Eliminar usuarios" },
  { key:"USERS_PERMISSIONS", label:"Asignar privilegios" },

  { key:"PARTICIPANTS_VIEW", label:"Ver participantes" },
  { key:"PARTICIPANTS_CREATE", label:"Crear participantes" },
  { key:"PARTICIPANTS_EDIT", label:"Editar participantes" },
  { key:"PARTICIPANTS_DELETE", label:"Eliminar participantes" },
  { key:"PARTICIPANTS_INVITE", label:"Enviar invitaciones" },

  { key:"ASSIGNMENTS_VIEW", label:"Ver asignaciones" },
  { key:"ASSIGNMENTS_CREATE", label:"Crear asignaciones" },
  { key:"ASSIGNMENTS_DELETE", label:"Eliminar asignaciones" },

  { key:"EVALUATIONS_VIEW", label:"Ver evaluaciones" },
  { key:"EVALUATIONS_CREATE", label:"Crear evaluaciones" },
  { key:"EVALUATIONS_EDIT", label:"Editar evaluaciones" },
  { key:"EVALUATIONS_DELETE", label:"Eliminar evaluaciones" },
  { key:"EVALUATIONS_TEST", label:"Probar evaluaciones" },

  { key:"RESULTS_VIEW", label:"Ver resultados" },
  { key:"RESULTS_DELETE", label:"Eliminar resultados" },

  { key:"REPORTS_VIEW", label:"Ver informes" },
  { key:"REPORTS_FINAL_VIEW", label:"Ver informe final" }

]

function defaultPermissions(role:string){

  if(role === "SUPERADMIN"){
    return PERMISSIONS.map(p=>p.key)
  }

  if(role === "PSYCHOLOGIST"){

    return [
      "DASHBOARD_VIEW",
      "PARTICIPANTS_VIEW",
      "PARTICIPANTS_CREATE",
      "PARTICIPANTS_EDIT",
      "PARTICIPANTS_INVITE",
      "ASSIGNMENTS_VIEW",
      "ASSIGNMENTS_CREATE",
      "ASSIGNMENTS_DELETE",
      "EVALUATIONS_VIEW",
      "EVALUATIONS_CREATE",
      "EVALUATIONS_EDIT",
      "EVALUATIONS_DELETE",
      "EVALUATIONS_TEST",
      "RESULTS_VIEW",
      "REPORTS_VIEW",
      "REPORTS_FINAL_VIEW"
    ]

  }

  if(role === "COMPANY_ADMIN"){

    return [
      "DASHBOARD_VIEW",
      "PARTICIPANTS_VIEW",
      "PARTICIPANTS_CREATE",
      "PARTICIPANTS_EDIT",
      "PARTICIPANTS_INVITE",
      "ASSIGNMENTS_VIEW",
      "ASSIGNMENTS_CREATE",
      "ASSIGNMENTS_DELETE",
      "REPORTS_VIEW",
      "REPORTS_FINAL_VIEW"
    ]

  }

  return []

}

export default function Users(){

  const [users,setUsers] = useState<any[]>([])
  const [companies,setCompanies] = useState<any[]>([])

  const [editingId,setEditingId] = useState("")

  const [name,setName] = useState("")
  const [rut,setRut] = useState("")
  const [password,setPassword] = useState("")
  const [role,setRole] = useState("COMPANY_ADMIN")
  const [companyId,setCompanyId] = useState("")
  const [selectedPermissions,setSelectedPermissions] = useState<string[]>(
    defaultPermissions("COMPANY_ADMIN")
  )

  useEffect(()=>{

    load()
    loadCompanies()

  },[])

  async function load(){

    const data = await apiFetch("/api/users")

    setUsers(data || [])

  }

  async function loadCompanies(){

    const data = await apiFetch("/api/companies")

    setCompanies(data || [])

  }

  function resetForm(){

    setEditingId("")
    setName("")
    setRut("")
    setPassword("")
    setRole("COMPANY_ADMIN")
    setCompanyId("")
    setSelectedPermissions(
      defaultPermissions("COMPANY_ADMIN")
    )

  }

  function onRoleChange(newRole:string){

    setRole(newRole)
    setCompanyId("")
    setSelectedPermissions(
      defaultPermissions(newRole)
    )

  }

  function togglePermission(permission:string){

    if(selectedPermissions.includes(permission)){

      setSelectedPermissions(
        selectedPermissions.filter(p=>p !== permission)
      )

    }else{

      setSelectedPermissions([
        ...selectedPermissions,
        permission
      ])

    }

  }

  function startEdit(u:any){

    setEditingId(u.id)
    setName(u.name || "")
    setRut(u.rut || "")
    setPassword("")
    setRole(u.role || "COMPANY_ADMIN")
    setCompanyId(u.companyId || "")

    setSelectedPermissions(
      Array.isArray(u.permissions)
        ? u.permissions
        : defaultPermissions(u.role)
    )

    window.scrollTo({
      top:0,
      behavior:"smooth"
    })

  }

  async function saveUser(){

    if(!name || !rut){

      alert("Complete nombre y RUT")

      return

    }

    if(!editingId && !password){

      alert("Debe ingresar password")

      return

    }

    if(role === "COMPANY_ADMIN" && !companyId){

      alert("Debe seleccionar una empresa")

      return

    }

    const body:any = {
      name,
      rut,
      role,
      companyId:
        role === "COMPANY_ADMIN"
          ? companyId
          : null,
      permissions: selectedPermissions
    }

    if(password){
      body.password = password
    }

    if(editingId){

      await apiFetch(`/api/users/${editingId}`,{
        method:"PUT",
        body
      })

      alert("Usuario actualizado")

    }else{

      await apiFetch("/api/users",{
        method:"POST",
        body
      })

      alert("Usuario creado")

    }

    resetForm()
    load()

  }

  async function deleteUser(id:string){

    const ok = confirm(
      "¿Eliminar usuario?"
    )

    if(!ok) return

    await apiFetch(`/api/users/${id}`,{
      method:"DELETE"
    })

    load()

  }

  async function resetPassword(id:string){

    const password = prompt(
      "Nueva contraseña:"
    )

    if(!password) return

    await apiFetch(
      `/api/users/${id}/reset-password`,
      {
        method:"PUT",
        body:{
          password
        }
      }
    )

    alert("Contraseña actualizada")

  }

  async function loginAs(u:any){

    let selectedCompanyId = ""

    if(u.role === "COMPANY_ADMIN"){

      if(companies.length === 0){

        alert("No hay empresas registradas para seleccionar")

        return

      }

      const list = companies
        .map((c:any,index:number)=>
          `${index + 1}. ${c.name}`
        )
        .join("\n")

      const choice = prompt(
        `Seleccione la empresa que quiere ver:\n\n${list}\n\nIngrese el número de la empresa:`
      )

      if(!choice){
        return
      }

      const index = Number(choice) - 1

      if(
        isNaN(index) ||
        index < 0 ||
        index >= companies.length
      ){

        alert("Selección inválida")

        return

      }

      selectedCompanyId = companies[index].id

    }

    if(!localStorage.getItem("originalToken")){

      localStorage.setItem(
        "originalToken",
        localStorage.getItem("token") || ""
      )

      localStorage.setItem(
        "originalRole",
        localStorage.getItem("role") || ""
      )

      localStorage.setItem(
        "originalUserName",
        localStorage.getItem("userName") || ""
      )

      localStorage.setItem(
        "originalPermissions",
        localStorage.getItem("permissions") || "[]"
      )

      localStorage.setItem(
        "originalCompanyId",
        localStorage.getItem("companyId") || ""
      )

      localStorage.setItem(
        "originalCompanyName",
        localStorage.getItem("companyName") || ""
      )

    }

    const data = await apiFetch(
      `/api/users/loginAs/${u.id}`,
      {
        method:"POST",
        body:{
          companyId: selectedCompanyId || null
        }
      }
    )

    localStorage.setItem(
      "token",
      data.token
    )

    localStorage.setItem(
      "userName",
      data.user.name
    )

    localStorage.setItem(
      "role",
      data.user.role
    )

    localStorage.setItem(
      "companyId",
      data.user.companyId || ""
    )

    localStorage.setItem(
      "companyName",
      data.user.company?.name || ""
    )

    localStorage.setItem(
      "permissions",
      JSON.stringify(data.user.permissions || [])
    )

    localStorage.setItem(
      "user",
      JSON.stringify(data.user)
    )

    if(data.user.role === "PARTICIPANT"){

      window.location.href =
        "/app/my-evaluations"

    }else{

      window.location.href =
        "/app"

    }

  }

  return(

    <div style={styles.container}>

      <h1 style={styles.title}>
        Gestión de Usuarios
      </h1>

      <div style={styles.card}>

        <h3 style={styles.cardTitle}>
          {editingId ? "Editar usuario" : "Crear usuario"}
        </h3>

        <div style={styles.formGrid}>

          <input
            style={styles.input}
            placeholder="Nombre"
            value={name}
            onChange={(e)=>
              setName(e.target.value)
            }
          />

          <input
            style={styles.input}
            placeholder="RUT"
            value={rut}
            onChange={(e)=>
              setRut(e.target.value)
            }
          />

          <input
            style={styles.input}
            placeholder={
              editingId
                ? "Nueva password opcional"
                : "Password"
            }
            type="password"
            value={password}
            onChange={(e)=>
              setPassword(e.target.value)
            }
          />

          <select
            style={styles.input}
            value={role}
            onChange={(e)=>
              onRoleChange(e.target.value)
            }
          >

            <option value="SUPERADMIN">
              SUPERADMIN
            </option>

            <option value="COMPANY_ADMIN">
              COMPANY_ADMIN
            </option>

            <option value="PSYCHOLOGIST">
              PSYCHOLOGIST
            </option>

            <option value="PARTICIPANT">
              PARTICIPANT
            </option>

          </select>

          {role === "COMPANY_ADMIN" && (

            <select
              style={styles.input}
              value={companyId}
              onChange={(e)=>
                setCompanyId(e.target.value)
              }
            >

              <option value="">
                Seleccionar empresa
              </option>

              {companies.map((c:any)=>(

                <option
                  key={c.id}
                  value={c.id}
                >

                  {c.name}

                </option>

              ))}

            </select>

          )}

        </div>

        <div style={styles.permissionsBox}>

          <h4 style={styles.permissionsTitle}>
            Privilegios del usuario
          </h4>

          <div style={styles.permissionsGrid}>

            {PERMISSIONS.map((p:any)=>(

              <label
                key={p.key}
                style={styles.permissionItem}
              >

                <input
                  type="checkbox"
                  checked={
                    selectedPermissions.includes(p.key)
                  }
                  onChange={()=>
                    togglePermission(p.key)
                  }
                  disabled={
                    role === "SUPERADMIN"
                  }
                />

                <span>
                  {p.label}
                </span>

              </label>

            ))}

          </div>

          {role === "SUPERADMIN" && (

            <div style={styles.note}>
              El SUPERADMIN siempre tiene todos los privilegios.
            </div>

          )}

        </div>

        <div style={styles.formActions}>

          <button
            onClick={saveUser}
            style={styles.createButton}
          >

            {editingId ? "Actualizar usuario" : "Crear usuario"}

          </button>

          {editingId && (

            <button
              onClick={resetForm}
              style={styles.grayButton}
            >

              Cancelar edición

            </button>

          )}

        </div>

      </div>

      <div style={styles.tableCard}>

        <table style={styles.table}>

          <thead>

            <tr>

              <th style={styles.th}>
                Nombre
              </th>

              <th style={styles.th}>
                RUT
              </th>

              <th style={styles.th}>
                Rol
              </th>

              <th style={styles.th}>
                Empresa
              </th>

              <th style={styles.th}>
                Privilegios
              </th>

              <th style={styles.th}>
                Acciones
              </th>

            </tr>

          </thead>

          <tbody>

            {users.map((u:any)=>(

              <tr
                key={u.id}
                style={styles.tr}
              >

                <td style={styles.td}>
                  {u.name}
                </td>

                <td style={styles.td}>
                  {u.rut}
                </td>

                <td style={styles.td}>
                  {u.role}
                </td>

                <td style={styles.td}>
                  {u.company?.name || "-"}
                </td>

                <td style={styles.td}>
                  {u.role === "SUPERADMIN"
                    ? "Todos"
                    : `${u.permissions?.length || 0} permisos`
                  }
                </td>

                <td style={styles.td}>

                  <div style={styles.actions}>

                    <button
                      onClick={()=>
                        loginAs(u)
                      }
                      style={styles.greenButton}
                    >

                      Ver como

                    </button>

                    <button
                      onClick={()=>
                        startEdit(u)
                      }
                      style={styles.blueButton}
                    >

                      Editar

                    </button>

                    <button
                      onClick={()=>
                        resetPassword(u.id)
                      }
                      style={styles.yellowButton}
                    >

                      Reset Pass

                    </button>

                    <button
                      onClick={()=>
                        deleteUser(u.id)
                      }
                      style={styles.redButton}
                    >

                      Eliminar

                    </button>

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  )

}

const styles:any = {

  container:{
    padding:20
  },

  title:{
    color:"#ffffff",
    fontSize:32,
    fontWeight:700,
    marginBottom:24
  },

  card:{
    background:"rgba(17,36,58,0.92)",
    border:"1px solid rgba(255,255,255,0.08)",
    borderRadius:20,
    padding:24,
    boxShadow:"0 8px 30px rgba(0,0,0,0.35)",
    backdropFilter:"blur(10px)"
  },

  cardTitle:{
    color:"#ffffff",
    marginBottom:20,
    fontSize:20,
    fontWeight:600
  },

  formGrid:{
    display:"flex",
    gap:12,
    flexWrap:"wrap",
    alignItems:"center"
  },

  input:{
    background:"#0f172a",
    border:"1px solid #223548",
    color:"#ffffff",
    borderRadius:12,
    padding:"12px 14px",
    minWidth:200,
    outline:"none"
  },

  permissionsBox:{
    marginTop:22,
    padding:16,
    borderRadius:16,
    background:"rgba(15,23,42,0.75)",
    border:"1px solid rgba(255,255,255,0.08)"
  },

  permissionsTitle:{
    color:"#ffffff",
    marginTop:0,
    marginBottom:14,
    fontSize:16
  },

  permissionsGrid:{
    display:"grid",
    gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",
    gap:10
  },

  permissionItem:{
    display:"flex",
    gap:8,
    alignItems:"center",
    color:"#e2e8f0",
    fontSize:14
  },

  note:{
    color:"#93c5fd",
    marginTop:12,
    fontSize:13
  },

  formActions:{
    display:"flex",
    gap:12,
    marginTop:20,
    flexWrap:"wrap"
  },

  createButton:{
    background:"linear-gradient(135deg,#2563eb,#1d4ed8)",
    color:"#ffffff",
    border:"none",
    padding:"12px 18px",
    borderRadius:12,
    cursor:"pointer",
    fontWeight:600
  },

  grayButton:{
    background:"#334155",
    color:"#ffffff",
    border:"none",
    padding:"12px 18px",
    borderRadius:12,
    cursor:"pointer",
    fontWeight:600
  },

  tableCard:{
    marginTop:30,
    background:"rgba(17,36,58,0.92)",
    border:"1px solid rgba(255,255,255,0.08)",
    borderRadius:20,
    overflow:"auto",
    boxShadow:"0 8px 30px rgba(0,0,0,0.35)"
  },

  table:{
    width:"100%",
    borderCollapse:"collapse"
  },

  th:{
    background:"#14532d",
    color:"#ffffff",
    padding:16,
    textAlign:"left",
    fontWeight:600
  },

  tr:{
    borderBottom:"1px solid rgba(255,255,255,0.05)"
  },

  td:{
    padding:16,
    color:"#e2e8f0",
    verticalAlign:"top"
  },

  actions:{
    display:"flex",
    gap:8,
    flexWrap:"wrap"
  },

  greenButton:{
    background:"linear-gradient(135deg,#16a34a,#22c55e)",
    color:"#ffffff",
    border:"none",
    padding:"8px 12px",
    borderRadius:10,
    cursor:"pointer",
    fontWeight:600
  },

  blueButton:{
    background:"linear-gradient(135deg,#2563eb,#3b82f6)",
    color:"#ffffff",
    border:"none",
    padding:"8px 12px",
    borderRadius:10,
    cursor:"pointer",
    fontWeight:600
  },

  yellowButton:{
    background:"linear-gradient(135deg,#f59e0b,#fbbf24)",
    color:"#ffffff",
    border:"none",
    padding:"8px 12px",
    borderRadius:10,
    cursor:"pointer",
    fontWeight:600
  },

  redButton:{
    background:"linear-gradient(135deg,#dc2626,#ef4444)",
    color:"#ffffff",
    border:"none",
    padding:"8px 12px",
    borderRadius:10,
    cursor:"pointer",
    fontWeight:600
  }

}