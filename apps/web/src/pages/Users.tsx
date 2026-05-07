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

    /* ======================================
    COMPANY ADMIN DEBE TENER EMPRESA
    ====================================== */

    if(
      role === "COMPANY_ADMIN" &&
      !companyId
    ){

      alert(
        "Debe seleccionar una empresa"
      )

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

    /* ======================================
    REDIRECCIÓN
    ====================================== */

    if(data.user.role === "PARTICIPANT"){

      window.location.href =
        "/app/my-evaluations"

    }else{

      window.location.href =
        "/app"

    }

  }

  return(

    <div style={{padding:40}}>

      <h2>Usuarios</h2>

      {/* ======================================
      CREAR USUARIO
      ====================================== */}

      <div style={{
        background:"#fff",
        padding:20,
        borderRadius:10,
        marginTop:20
      }}>

        <h3>Crear usuario</h3>

        <div style={{
          display:"flex",
          gap:10,
          marginTop:10,
          flexWrap:"wrap"
        }}>

          {/* NOMBRE */}

          <input
            placeholder="Nombre"
            value={name}
            onChange={(e)=>
              setName(e.target.value)
            }
          />

          {/* RUT */}

          <input
            placeholder="RUT"
            value={rut}
            onChange={(e)=>
              setRut(e.target.value)
            }
          />

          {/* PASSWORD */}

          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e)=>
              setPassword(e.target.value)
            }
          />

          {/* ROL */}

          <select
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

          {/* EMPRESA SOLO COMPANY ADMIN */}

          {role === "COMPANY_ADMIN" && (

            <select
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
            style={{
              background:"#2563eb",
              color:"#fff",
              border:"none",
              padding:"8px 14px",
              borderRadius:6,
              cursor:"pointer"
            }}
          >

            Crear

          </button>

        </div>

      </div>

      {/* ======================================
      TABLA
      ====================================== */}

      <table style={{
        width:"100%",
        marginTop:30,
        background:"#fff",
        borderRadius:10
      }}>

        <thead>

          <tr>

            <th style={{
              padding:10,
              textAlign:"left"
            }}>
              Nombre
            </th>

            <th style={{
              padding:10,
              textAlign:"left"
            }}>
              RUT
            </th>

            <th style={{
              padding:10,
              textAlign:"left"
            }}>
              Rol
            </th>

            <th style={{
              padding:10,
              textAlign:"left"
            }}>
              Empresa
            </th>

            <th style={{
              padding:10
            }}>
              Acciones
            </th>

          </tr>

        </thead>

        <tbody>

          {users.map((u:any)=>(

            <tr key={u.id}>

              <td style={{padding:10}}>
                {u.name}
              </td>

              <td style={{padding:10}}>
                {u.rut}
              </td>

              <td style={{padding:10}}>
                {u.role}
              </td>

              <td style={{padding:10}}>
                {u.company?.name || "-"}
              </td>

              <td style={{padding:10}}>

                {/* LOGIN AS */}

                <button
                  onClick={()=>
                    loginAs(u.id)
                  }
                  style={{
                    background:"#16a34a",
                    color:"#fff",
                    border:"none",
                    padding:"6px 10px",
                    borderRadius:6,
                    marginRight:6,
                    cursor:"pointer"
                  }}
                >

                  Ver como

                </button>

                {/* ELIMINAR */}

                <button
                  onClick={()=>
                    deleteUser(u.id)
                  }
                  style={{
                    background:"#dc2626",
                    color:"#fff",
                    border:"none",
                    padding:"6px 10px",
                    borderRadius:6,
                    cursor:"pointer"
                  }}
                >

                  Eliminar

                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  )

}