import { useEffect, useState } from "react"
import { apiFetch } from "../api"
import { evaluationLabels } from "../utils/evaluationLabels"

export default function ReportList(){

  const [data,setData] = useState<any[]>([])
  const [loading,setLoading] = useState(true)

  const [searchInput,setSearchInput] = useState("")
  const [companyInput,setCompanyInput] = useState("")

  const [search,setSearch] = useState("")
  const [company,setCompany] = useState("")

  const [selected,setSelected] = useState<any>({})

  let session:any = {}

  try{
    session = JSON.parse(localStorage.getItem("user") || "{}")
  }catch{}

  const isSuperAdmin =
    session?.user?.role === "SUPERADMIN"

  useEffect(()=>{
    load()
  },[search,company])

  async function load(){

    setLoading(true)

    const res = await apiFetch(
      `/api/results/grouped?page=1&limit=50&search=${search}&company=${company}`
    )

    setData(res || [])

    setLoading(false)

  }

  function handleSearch(){

    setSearch(searchInput)
    setCompany(companyInput)

  }

  function toggle(id:string){

    setSelected((prev:any)=>{

      const copy = { ...prev }

      if(copy[id]) delete copy[id]
      else copy[id] = true

      return copy

    })

  }

  function isChecked(id:string){

    return !!selected[id]

  }

  function getColor(score:number){

    if(score >= 85) return "#16a34a"
    if(score >= 55) return "#eab308"

    return "#dc2626"

  }

  async function deleteSelected(){

    const ids = Object.keys(selected)

    if(ids.length === 0) return

    if(!confirm("¿Eliminar seleccionados?")) return

    for(const id of ids){

      await apiFetch(
        `/api/results/${id}`,
        {
          method:"DELETE"
        }
      )

    }

    setSelected({})

    load()

  }

  /* =====================================
  EXPORTAR EXCEL
  ===================================== */

  async function exportExcel(){

    try{

      const token =
        localStorage.getItem("token")

      const response = await fetch(

        `${import.meta.env.VITE_API_URL}/api/export/results`,

        {
          headers:{
            Authorization:`Bearer ${token}`
          }
        }

      )

      if(!response.ok){

        alert("Error exportando Excel")

        return

      }

      const blob =
        await response.blob()

      const url =
        window.URL.createObjectURL(blob)

      const a =
        document.createElement("a")

      a.href = url

      a.download =
        "resultados_ecos.xlsx"

      a.click()

      window.URL.revokeObjectURL(url)

    }catch(error){

      console.error(error)

      alert("Error descargando archivo")

    }

  }

  if(loading){

    return(
      <div style={{padding:40}}>
        Cargando...
      </div>
    )

  }

  return(

    <div style={{padding:30}}>

      {/* HEADER */}
      <div style={styles.header}>

        <h2 style={{margin:0}}>
          Gestión de Informes
        </h2>

        <button
          onClick={exportExcel}
          style={styles.exportBtn}
        >
          Descargar Excel
        </button>

      </div>

      {/* FILTROS */}
      <div style={styles.filters}>

        <input
          placeholder="Buscar participante..."
          value={searchInput}
          onChange={(e)=>setSearchInput(e.target.value)}
          style={styles.input}
        />

        <input
          placeholder="Empresa..."
          value={companyInput}
          onChange={(e)=>setCompanyInput(e.target.value)}
          style={styles.input}
        />

        <button
          onClick={handleSearch}
          style={styles.searchBtn}
        >
          Buscar
        </button>

      </div>

      {/* BARRA MASIVA */}
      {Object.keys(selected).length > 0 && (

        <div style={styles.bulkBar}>

          <span>
            {Object.keys(selected).length} seleccionados
          </span>

          {isSuperAdmin && (
            <button
              onClick={deleteSelected}
              style={styles.delete}
            >
              Eliminar
            </button>
          )}

        </div>

      )}

      {/* TABLA */}
      <table style={styles.table}>

        <thead>

          <tr>

            <th>Nombre</th>

            <th>
              {evaluationLabels.PETS}
            </th>

            <th>
              {evaluationLabels.ICOM}
            </th>

            <th>
              {evaluationLabels.SECURITY}
            </th>

            <th>Final</th>

            <th>Estado</th>

          </tr>

        </thead>

        <tbody>

          {data.map((p:any)=>{

            function getEval(type:string){

              const map:any = {
                PETS:"CONDUCTUAL",
                ICOM:"PSICOLABORAL",
                SECURITY:"SEGURIDAD"
              }

              return p.evaluations.find((e:any)=>{

                const name =
                  (e.name || "").toUpperCase()

                const t =
                  (e.type || "").toUpperCase()

                return (
                  t === type ||
                  name.includes(type) ||
                  name.includes(map[type])
                )

              })

            }

            const pets =
              getEval("PETS")

            const icom =
              getEval("ICOM")

            const seguridad =
              getEval("SECURITY")

            return(

              <tr
                key={p.participantId}
                style={styles.row}
              >

                <td>{p.name}</td>

                {/* PETS */}
                <td style={styles.center}>

                  {pets && (

                    <div style={styles.cellBox}>

                      <input
                        type="checkbox"
                        checked={isChecked(pets.id)}
                        onChange={()=>toggle(pets.id)}
                      />

                      <button
                        onClick={()=>window.open(pets.pdf)}
                      >
                        Ver
                      </button>

                    </div>

                  )}

                </td>

                {/* ICOM */}
                <td style={styles.center}>

                  {icom && (

                    <div style={styles.cellBox}>

                      <input
                        type="checkbox"
                        checked={isChecked(icom.id)}
                        onChange={()=>toggle(icom.id)}
                      />

                      <button
                        onClick={()=>window.open(icom.pdf)}
                      >
                        Ver
                      </button>

                    </div>

                  )}

                </td>

                {/* SECURITY */}
                <td style={styles.center}>

                  {seguridad && (

                    <div style={styles.cellBox}>

                      <input
                        type="checkbox"
                        checked={isChecked(seguridad.id)}
                        onChange={()=>toggle(seguridad.id)}
                      />

                      <button
                        onClick={()=>window.open(seguridad.pdf)}
                      >
                        Ver
                      </button>

                    </div>

                  )}

                </td>

                {/* FINAL */}
                <td style={styles.center}>

                  <button
                    onClick={()=>window.open(p.finalPdf)}
                  >
                    Ver Final
                  </button>

                </td>

                {/* ESTADO */}
                <td style={styles.center}>

                  <div style={{
                    width:12,
                    height:12,
                    borderRadius:"50%",
                    background:getColor(p.finalScore),
                    margin:"0 auto"
                  }}/>

                </td>

              </tr>

            )

          })}

        </tbody>

      </table>

    </div>

  )

}

const styles:any = {

  header:{
    display:"flex",
    justifyContent:"space-between",
    alignItems:"center",
    marginBottom:20
  },

  exportBtn:{
    background:"#0A7C66",
    color:"#fff",
    border:"none",
    padding:"10px 18px",
    borderRadius:8,
    cursor:"pointer",
    fontWeight:600
  },

  filters:{
    display:"flex",
    gap:10,
    marginBottom:20
  },

  input:{
    padding:10,
    border:"1px solid #ddd",
    borderRadius:8
  },

  searchBtn:{
    background:"#16a34a",
    color:"#fff",
    border:"none",
    padding:"10px 16px",
    borderRadius:8
  },

  bulkBar:{
    display:"flex",
    gap:15,
    marginBottom:20,
    padding:12,
    background:"#f1f5f9",
    borderRadius:10
  },

  table:{
    width:"100%",
    borderCollapse:"collapse"
  },

  row:{
    borderBottom:"1px solid #eee"
  },

  center:{
    textAlign:"center"
  },

  cellBox:{
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
    gap:8
  },

  delete:{
    background:"#dc2626",
    color:"#fff",
    border:"none",
    padding:"8px 12px",
    borderRadius:8
  }

}