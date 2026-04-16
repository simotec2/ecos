import { useState } from "react"
import { apiFetch } from "../api"
import { useNavigate } from "react-router-dom"

export default function ChangePassword(){

  const [password,setPassword] = useState("")
  const [confirm,setConfirm] = useState("")
  const [error,setError] = useState("")
  const [loading,setLoading] = useState(false)

  const navigate = useNavigate()

  async function onSubmit(e:any){
    e.preventDefault()
    setError("")

    if(password.length < 4){
      setError("La contraseña debe tener al menos 4 caracteres")
      return
    }

    if(password !== confirm){
      setError("Las contraseñas no coinciden")
      return
    }

    try{

      setLoading(true)

      await apiFetch("/api/auth/change-password", {
        method:"POST",
        body:{ password }
      })

      // 🔥 limpiar bloqueo
      localStorage.setItem("forcePasswordChange","false")

      // 🔥 ir al sistema
      navigate("/app")

    }catch(e:any){
      setError(e.message || "Error al cambiar contraseña")
    }finally{
      setLoading(false)
    }
  }

  return(
    <div style={{
      height:"100vh",
      display:"flex",
      alignItems:"center",
      justifyContent:"center",
      background:"#f3f4f6"
    }}>

      <div style={{
        width:"380px",
        background:"#fff",
        padding:"30px",
        borderRadius:"12px",
        boxShadow:"0 10px 30px rgba(0,0,0,0.1)"
      }}>

        <div style={{ textAlign:"center", marginBottom:"20px" }}>
          <img src="/ecos-logo.png" style={{ width:"80px" }} />
          <h2 style={{ margin:"10px 0 5px" }}>Cambio de contraseña</h2>
          <p style={{ fontSize:"13px", color:"#666" }}>
            Por seguridad, debe actualizar su clave
          </p>
        </div>

        <form onSubmit={onSubmit}>

          <input
            type="password"
            placeholder="Nueva contraseña"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            style={{
              width:"100%",
              padding:"10px",
              marginBottom:"10px",
              borderRadius:"6px",
              border:"1px solid #ccc"
            }}
          />

          <input
            type="password"
            placeholder="Confirmar contraseña"
            value={confirm}
            onChange={e=>setConfirm(e.target.value)}
            style={{
              width:"100%",
              padding:"10px",
              marginBottom:"10px",
              borderRadius:"6px",
              border:"1px solid #ccc"
            }}
          />

          {error && (
            <div style={{
              color:"red",
              fontSize:"12px",
              marginBottom:"10px"
            }}>
              {error}
            </div>
          )}

          <button
            disabled={loading}
            style={{
              width:"100%",
              padding:"12px",
              background:"#1f2937",
              color:"#fff",
              border:"none",
              borderRadius:"6px",
              cursor:"pointer",
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Guardando..." : "Guardar nueva contraseña"}
          </button>

        </form>

      </div>

    </div>
  )
}