import { useState, useEffect } from "react"

export default function TemplateEditor(){

  const [html, setHtml] = useState("")

  /* =========================
  CARGAR TEMPLATE
  ========================= */
  async function load(){

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/template`)
    const text = await res.text()
    setHtml(text)

  }

  /* =========================
  GUARDAR TEMPLATE
  ========================= */
  async function save(){

    await fetch(`${import.meta.env.VITE_API_URL}/api/template`,{
      method: "POST",
      headers:{
        "Content-Type":"application/json"
      },
      body: JSON.stringify({ html })
    })

    alert("Template guardado")

  }

  /* =========================
  INIT
  ========================= */
  useEffect(()=>{
    load()
  },[])

  return (
    <div style={{ padding:20 }}>
      <h2>Editor de Template</h2>

      <textarea
        value={html}
        onChange={(e)=>setHtml(e.target.value)}
        style={{ width:"100%", height:400 }}
      />

      <br/><br/>

      <button onClick={save}>
        Guardar
      </button>

    </div>
  )
}