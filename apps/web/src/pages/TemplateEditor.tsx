import { useEffect, useState } from "react"
import { apiFetch } from "../api"

export default function TemplateEditor(){

  const [html,setHtml]=useState("")

  useEffect(()=>{
    load()
  },[])

  async function load(){
    const res = await fetch("http://localhost:3001/api/template")
    const text = await res.text()
    setHtml(text)
  }

  async function save(){

    await fetch("http://localhost:3001/api/template",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body: JSON.stringify({ html })
    })

    alert("Template guardado")
  }

  return(

    <div style={{padding:20}}>

      <h2>Editor de Informe</h2>

      <textarea
        value={html}
        onChange={e=>setHtml(e.target.value)}
        style={{
          width:"100%",
          height:"500px"
        }}
      />

      <button onClick={save} style={{marginTop:10}}>
        Guardar
      </button>

    </div>

  )
}