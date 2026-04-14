import { Link, useLocation } from "react-router-dom"

export default function Sidebar(){

  const location = useLocation()

  const menu = [
    {label:"Dashboard",path:"/app"},
    {label:"Empresas",path:"/app/companies"},
    {label:"Usuarios",path:"/app/users"},
    {label:"Participantes",path:"/app/participants"},
    {label:"Asignaciones",path:"/app/assignments"},
    {label:"Evaluaciones",path:"/app/evaluations"},
    {label:"Informes",path:"/app/reports"}
  ]

  return(

    <div style={styles.sidebar}>

      <div style={styles.logoArea}>
        <img
          src="/ecos-logo.png"
          style={{width:90}}
        />
      </div>

      <div style={styles.menu}>

        {menu.map(item=>{

          const active = location.pathname === item.path

          return(

            <Link
              key={item.path}
              to={item.path}
              style={{
                ...styles.menuItem,
                ...(active?styles.menuActive:{})
              }}
            >
              {item.label}
            </Link>

          )

        })}

      </div>

    </div>

  )

}

const styles:any={

sidebar:{
  width:220,
  background:"#0f1c2e",
  color:"#8bdc65",
  height:"100vh",
  display:"flex",
  flexDirection:"column",
  paddingTop:20
},

logoArea:{
  padding:"10px 20px",
  marginBottom:20
},

menu:{
  display:"flex",
  flexDirection:"column"
},

menuItem:{
  padding:"12px 22px",
  color:"#8bdc65",
  textDecoration:"none",
  fontSize:15,
  transition:"all 0.2s"
},

menuActive:{
  background:"#1c2d48",
  borderLeft:"4px solid #8bdc65"
}

}