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
  body: JSON.stringify({ rut, password })
})

// 🔥 GUARDAR USUARIO
localStorage.setItem("user", JSON.stringify(data))

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

      if(user.name){
        localStorage.setItem("userName",user.name);
      }

      if(user.role){
        localStorage.setItem("role",user.role);
      }

      if(user.rut){
        localStorage.setItem("rut",user.rut);
      }

      /* ===============================
      REDIRECCIÓN SEGÚN ROL
      =============================== */

      if(user.role === "SUPERADMIN"){
  navigate("/app")
}

if(user.role === "COMPANY_ADMIN"){
  navigate("/app")
}

if(user.role === "PSYCHOLOGIST"){
  navigate("/app")
}

if(user.role === "PARTICIPANT"){
  navigate("/app/my-evaluations")
}

    }catch(error){

      console.error(error);

      setError("Error de conexión con el servidor");

    }

  }

  return(

    <div style={{
      display:"flex",
      justifyContent:"center",
      alignItems:"center",
      height:"100vh"
    }}>

      <form
        onSubmit={onSubmit}
        style={{
          width:320,
          padding:30,
          border:"1px solid #ddd",
          borderRadius:10
        }}
      >

        <h2 style={{marginBottom:20}}>Ingreso</h2>

        <input
          placeholder="RUT"
          value={rut}
          onChange={e=>setRut(e.target.value)}
          style={{
            width:"100%",
            padding:10,
            marginBottom:10
          }}
        />

        <input
          type="password"
          placeholder="Clave"
          value={password}
          onChange={e=>setPassword(e.target.value)}
          style={{
            width:"100%",
            padding:10,
            marginBottom:10
          }}
        />

        {error && (
          <div style={{
            color:"red",
            marginBottom:10
          }}>
            {error}
          </div>
        )}

        <button
          style={{
            width:"100%",
            padding:10,
            background:"#2563eb",
            color:"white",
            border:"none",
            borderRadius:6
          }}
        >
          Ingresar
        </button>

      </form>

    </div>

  );

}