import { useEffect, useState } from "react"
import { apiFetch } from "../api"

export default function Users(){

  const [users,setUsers] = useState<any[]>([])
  const [companies,setCompanies] = useState<any[]>([])

  const [name,setName] = useState("")
  const [rut,setRut] = useState("")
  const [password,setPassword] = useState("")
  const [role,setRole] = useState("COMPANY_ADMIN")
  const [companyId,setCompanyId] = useState("")

  useEffect(()=>{

    load()
    loadCompanies()

  },[])

  /* ======================================
  CARGAR USUARIOS
  ====================================== */

  async function load(){

    const data = await apiFetch("/api/users")

    setUsers(data || [])

  }

  /* ======================================
  CARGAR EMPRESAS
  ====================================== */

  async function loadCompanies(){

    const data = await apiFetch("/api/companies")

    setCompanies(data || [])

  }

  /* ======================================
  CREAR USUARIO
  ====================================== */

  async function createUser(){

    if(!name || !rut || !password){

      alert("Complete todos los campos")

      return

    }

    if(
      role === "COMPANY_ADMIN" &&
      !companyId
    ){

      alert("Debe seleccionar una empresa")

      return

    }

    await apiFetch("/api/users",{

      method:"POST",

      body: JSON.stringify({

        name,
        rut,
        password,
        role,

        companyId:
          role === "COMPANY_ADMIN"
            ? companyId
            : null

      })

    })

    setName("")
    setRut("")
    setPassword("")
    setCompanyId("")

    load()

  }

  /* ======================================
  ELIMINAR
  ====================================== */

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

  /* ======================================
  RESET PASSWORD
  ====================================== */

  async function resetPassword(id:string){

    const password = prompt(
      "Nueva contraseña:"
    )

    if(!password) return

    await apiFetch(
      `/api/users/${id}/reset-password`,
      {
        method:"PUT",

        body: JSON.stringify({
          password
        })
      }
    )

    alert("Contraseña actualizada")

  }

  /* ======================================
  LOGIN AS
  ====================================== */

  async function loginAs(userId:string){

    const data = await apiFetch(
      `/api/users/loginAs/${userId}`,
      {
        method:"POST"
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

      {/* ======================================
      CREAR USUARIO
      ====================================== */}

      <div style={styles.card}>

        <h3 style={styles.cardTitle}>
          Crear usuario
        </h3>

        <div style={styles.formGrid}>

          {/* NOMBRE */}

          <input
            style={styles.input}
            placeholder="Nombre"
            value={name}
            onChange={(e)=>
              setName(e.target.value)
            }
          />

          {/* RUT */}

          <input
            style={styles.input}
            placeholder="RUT"
            value={rut}
            onChange={(e)=>
              setRut(e.target.value)
            }
          />

          {/* PASSWORD */}

          <input
            style={styles.input}
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e)=>
              setPassword(e.target.value)
            }
          />

          {/* ROL */}

          <select
            style={styles.input}
            value={role}
            onChange={(e)=>{
              setRole(e.target.value)
              setCompanyId("")
            }}
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

          {/* EMPRESA */}

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

          {/* BOTÓN */}

          <button
            onClick={createUser}
            style={styles.createButton}
          >

            Crear usuario

          </button>

        </div>

      </div>

      {/* ======================================
      TABLA
      ====================================== */}

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

                  <div style={styles.actions}>

                    {/* LOGIN AS */}

                    <button
                      onClick={()=>
                        loginAs(u.id)
                      }
                      style={styles.greenButton}
                    >

                      Ver como

                    </button>

                    {/* RESET */}

                    <button
                      onClick={()=>
                        resetPassword(u.id)
                      }
                      style={styles.yellowButton}
                    >

                      Reset Pass

                    </button>

                    {/* DELETE */}

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

/* ======================================
STYLES
====================================== */

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

    background:
      "rgba(17,36,58,0.92)",

    border:
      "1px solid rgba(255,255,255,0.08)",

    borderRadius:20,

    padding:24,

    boxShadow:
      "0 8px 30px rgba(0,0,0,0.35)",

    backdropFilter:
      "blur(10px)"

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

  createButton:{

    background:
      "linear-gradient(135deg,#2563eb,#1d4ed8)",

    color:"#ffffff",

    border:"none",

    padding:"12px 18px",

    borderRadius:12,

    cursor:"pointer",

    fontWeight:600

  },

  tableCard:{

    marginTop:30,

    background:
      "rgba(17,36,58,0.92)",

    border:
      "1px solid rgba(255,255,255,0.08)",

    borderRadius:20,

    overflow:"hidden",

    boxShadow:
      "0 8px 30px rgba(0,0,0,0.35)"

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

    borderBottom:
      "1px solid rgba(255,255,255,0.05)"

  },

  td:{

    padding:16,

    color:"#e2e8f0"

  },

  actions:{

    display:"flex",

    gap:8,

    flexWrap:"wrap"

  },

  greenButton:{

    background:
      "linear-gradient(135deg,#16a34a,#22c55e)",

    color:"#ffffff",

    border:"none",

    padding:"8px 12px",

    borderRadius:10,

    cursor:"pointer",

    fontWeight:600

  },

  yellowButton:{

    background:
      "linear-gradient(135deg,#f59e0b,#fbbf24)",

    color:"#ffffff",

    border:"none",

    padding:"8px 12px",

    borderRadius:10,

    cursor:"pointer",

    fontWeight:600

  },

  redButton:{

    background:
      "linear-gradient(135deg,#dc2626,#ef4444)",

    color:"#ffffff",

    border:"none",

    padding:"8px 12px",

    borderRadius:10,

    cursor:"pointer",

    fontWeight:600

  }

}