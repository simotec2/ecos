import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";

export default function Login() {

  const navigate = useNavigate();

  const [rut,setRut] = useState("");
  const [password,setPassword] = useState("");
  const [error,setError] = useState("");

  async function onSubmit(e:any){

    e.preventDefault();
    setError("");

    try{

      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: { rut, password }
      })

      if(!data?.token){
        setError(data?.error || "Error de autenticación");
        return;
      }

      const token = data.token;
      const user = data.user || {};

      /* ===============================
      GUARDAR TOKEN
      =============================== */

      localStorage.setItem("token",token);
      localStorage.setItem("jwt",token);
      localStorage.setItem("accessToken",token);
      localStorage.setItem("access_token",token);

      /* ===============================
      GUARDAR DATOS USUARIO
      =============================== */

      localStorage.setItem("user", JSON.stringify(user));

      if(user.name) localStorage.setItem("userName",user.name);
      if(user.role) localStorage.setItem("role",user.role);
      if(user.rut) localStorage.setItem("rut",user.rut);

      /* ===============================
      🔥 FORZAR CAMBIO DE CLAVE
      =============================== */

      if(data.forcePasswordChange){
        navigate("/change-password");
        return;
      }

      /* ===============================
      REDIRECCIÓN NORMAL
      =============================== */

      if(user.role === "PARTICIPANT"){
        navigate("/app/my-evaluations")
      } else {
        navigate("/app")
      }

    }catch(error:any){
      console.error(error);
      setError(error.message || "Error de conexión con el servidor");
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

        {/* LOGO */}
        <div style={{ textAlign:"center", marginBottom:"20px" }}>
          <img src="/ecos-logo.png" style={{ width:"90px" }} />
          <h2 style={{ margin:"10px 0 5px" }}>ECOS</h2>
          <p style={{ fontSize:"13px", color:"#666" }}>
            Plataforma de evaluación de competencias en seguridad
          </p>
        </div>

        <form onSubmit={onSubmit}>

          <input
            placeholder="RUT"
            value={rut}
            onChange={e=>setRut(e.target.value)}
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
            placeholder="Clave"
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
            style={{
              width:"100%",
              padding:"12px",
              background:"#1f2937",
              color:"#fff",
              border:"none",
              borderRadius:"6px",
              cursor:"pointer"
            }}
          >
            Ingresar
          </button>

        </form>

      </div>

    </div>

  );

}