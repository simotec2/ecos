import { useEffect, useState } from "react"
import { apiFetch } from "../api"

export default function Users(){

  const [users,setUsers] = useState<any[]>([])

  const [name,setName] = useState("")
  const [rut,setRut] = useState("")
  const [password,setPassword] = useState("")
  const [role,setRole] = useState("COMPANY_ADMIN")

  useEffect(()=>{
    load()
  },[])

  async function load(){

    const data = await apiFetch("/api/users")

    setUsers(data || [])

  }

  async function createUser(){

    if(!name || !rut || !password){

      alert("Complete todos los campos")

      return

    }

    await apiFetch("/api/users",{
      method:"POST",
      body: JSON.stringify({
        name,
        rut,
        password,
        role
      })
    })

    setName("")
    setRut("")
    setPassword("")

    load()

  }

  async function deleteUser(id:string){

    const ok = confirm("¿Eliminar usuario?")

    if(!ok) return

    await apiFetch(`/api/users/${id}`,{
      method:"DELETE"
    })

    load()

  }

  async function loginAs(userId:string){

    const data = await apiFetch(`/api/users/loginAs/${userId}`,{
      method:"POST"
    })

    localStorage.setItem("token",data.token)
    localStorage.setItem("userName",data.user.name)
    localStorage.setItem("role",data.user.role)

    /* redirección según rol */

    if(data.user.role === "PARTICIPANT"){

      window.location.href="/app/my-evaluations"

    }else{

      window.location.href="/app"

    }

  }

  return(

    <div style={{padding:40}}>

      <h2>Usuarios</h2>

      <div style={{
        background:"#fff",
        padding:20,
        borderRadius:10,
        marginTop:20
      }}>

        <h3>Crear usuario</h3>

        <div style={{display:"flex",gap:10,marginTop:10}}>

          <input
          placeholder="Nombre"
          value={name}
          onChange={(e)=>setName(e.target.value)}
          />

          <input
          placeholder="RUT"
          value={rut}
          onChange={(e)=>setRut(e.target.value)}
          />

          <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          />

          <select
          value={role}
          onChange={(e)=>setRole(e.target.value)}
          >

            <option value="SUPERADMIN">SUPERADMIN</option>
            <option value="COMPANY_ADMIN">COMPANY_ADMIN</option>
            <option value="PSYCHOLOGIST">PSYCHOLOGIST</option>
            <option value="PARTICIPANT">PARTICIPANT</option>

          </select>

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

      <table style={{
        width:"100%",
        marginTop:30,
        background:"#fff",
        borderRadius:10
      }}>

        <thead>

          <tr>

            <th style={{padding:10,textAlign:"left"}}>Nombre</th>
            <th style={{padding:10,textAlign:"left"}}>RUT</th>
            <th style={{padding:10,textAlign:"left"}}>Rol</th>
            <th style={{padding:10}}>Acciones</th>

          </tr>

        </thead>

        <tbody>

          {users.map((u:any)=>(

            <tr key={u.id}>

              <td style={{padding:10}}>{u.name}</td>

              <td style={{padding:10}}>{u.rut}</td>

              <td style={{padding:10}}>{u.role}</td>

              <td style={{padding:10}}>

                <button
                onClick={()=>loginAs(u.id)}
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

                <button
                onClick={()=>deleteUser(u.id)}
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