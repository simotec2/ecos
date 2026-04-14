import { Outlet, Link, useNavigate, useLocation } from "react-router-dom"
import CompanySelector from "../components/CompanySelector"

export default function AppLayout(){

  const navigate = useNavigate()
  const location = useLocation()

  const userName = localStorage.getItem("userName") || "Usuario"
  const role = localStorage.getItem("role") || ""
  const originalRole = localStorage.getItem("originalRole")

  function logout(){
    localStorage.clear()
    navigate("/login", { replace:true })
  }

  function backToAdmin(){
    localStorage.setItem("role","SUPERADMIN")
    localStorage.removeItem("originalRole")
    navigate("/app", { replace:true })
  }

  function menuStyle(path:string){

    const isActive =
      location.pathname === path ||
      location.pathname.startsWith(path + "/")

    if(isActive){
      return {
        ...styles.menuItem,
        ...styles.menuActive
      }
    }

    return styles.menuItem

  }

  /* =======================
  MENÚ SEGÚN ROL
  ======================= */

  const menu:any = {

    SUPERADMIN:[
      {path:"/app",label:"Dashboard"},
      {path:"/app/companies",label:"Empresas"},
      {path:"/app/users",label:"Usuarios"},
      {path:"/app/participants",label:"Participantes"},
      {path:"/app/assignments",label:"Asignaciones"},
      {path:"/app/evaluations",label:"Evaluaciones"},
      {path:"/app/reports",label:"Informes"}
    ],

    PSYCHOLOGIST:[
      {path:"/app",label:"Dashboard"},
      {path:"/app/participants",label:"Participantes"},
      {path:"/app/evaluations",label:"Evaluaciones"},
      {path:"/app/reports",label:"Informes"}
    ],

    /* 🔥 EMPRESA SIN ACCESO A EVALUACIONES */
    COMPANY_ADMIN:[
      {path:"/app",label:"Dashboard"},
      {path:"/app/participants",label:"Participantes"},
      {path:"/app/assignments",label:"Asignaciones"},
      {path:"/app/reports",label:"Informes"}
    ],

    PARTICIPANT:[
      {path:"/app/my-evaluations",label:"Mis evaluaciones"}
    ]

  }

  const menuItems = menu[role] || []

  return(

    <div style={styles.container}>

      {/* =======================
      IMPERSONACIÓN
      ======================= */}

      {originalRole==="SUPERADMIN" && role!=="SUPERADMIN" && (

        <div style={styles.impersonationBar}>

          <div>
            Estás viendo el sistema como {role}
          </div>

          <button
            onClick={backToAdmin}
            style={styles.backAdminButton}
          >
            Volver a superadministrador
          </button>

        </div>

      )}

      {/* =======================
      SIDEBAR
      ======================= */}

      <div style={styles.sidebar}>

        <div style={styles.logoBox}>
          <img src="/ecos-logo.jpg" style={styles.logo}/>
        </div>

        <nav style={styles.menu}>

          {menuItems.map((item:any)=>(

            <Link
              key={item.path}
              to={item.path}
              style={menuStyle(item.path)}
            >
              {item.label}
            </Link>

          ))}

        </nav>

      </div>

      {/* =======================
      MAIN
      ======================= */}

      <div style={styles.main}>

        {/* TOPBAR */}

        <div style={styles.topbar}>

          <div style={styles.topbarTitle}>
            Plataforma de Evaluación de Competencias Laborales en Seguridad
          </div>

          <div style={styles.userBox}>

            <CompanySelector/>

            <div style={styles.userInfo}>
              <div style={styles.userName}>{userName}</div>
              <div style={styles.userRole}>{role}</div>
            </div>

            <button onClick={logout} style={styles.logoutButton}>
              Cerrar sesión
            </button>

          </div>

        </div>

        {/* CONTENIDO */}

        <div style={styles.content}>

          <div style={styles.pageContainer}>

            <Outlet/>

          </div>

        </div>

      </div>

    </div>

  )

}

/* =======================
ESTILOS
======================= */

const styles:any={

  container:{
    display:"flex",
    height:"100vh",
    width:"100%",
    background:"#f3f4f6",
    fontFamily:"Inter, Arial"
  },

  impersonationBar:{
    position:"fixed",
    top:0,
    left:0,
    right:0,
    background:"#dc2626",
    color:"#fff",
    padding:"8px 20px",
    display:"flex",
    justifyContent:"space-between",
    alignItems:"center",
    zIndex:9999
  },

  backAdminButton:{
    background:"#fff",
    color:"#dc2626",
    border:"none",
    padding:"6px 12px",
    borderRadius:6,
    cursor:"pointer"
  },

  sidebar:{
    width:240,
    background:"#162338",
    color:"#86efac",
    display:"flex",
    flexDirection:"column",
    borderRight:"1px solid #1e293b"
  },

  logoBox:{
    display:"flex",
    justifyContent:"center",
    alignItems:"center",
    padding:20,
    borderBottom:"1px solid #1e293b",
    background:"#ffffff"
  },

  logo:{
    height:70,
    borderRadius:10,
    objectFit:"contain"
  },

  menu:{
    display:"flex",
    flexDirection:"column",
    padding:14,
    gap:6
  },

  menuItem:{
    color:"#86efac",
    textDecoration:"none",
    padding:"10px 12px",
    borderRadius:6,
    fontSize:14
  },

  menuActive:{
    background:"#1e2f4d"
  },

  main:{
    flex:1,
    display:"flex",
    flexDirection:"column",
    overflow:"hidden"
  },

  topbar:{
    height:64,
    background:"#ffffff",
    borderBottom:"1px solid #e5e7eb",
    display:"flex",
    alignItems:"center",
    justifyContent:"space-between",
    padding:"0 28px"
  },

  topbarTitle:{
    fontWeight:600,
    fontSize:16,
    color:"#111827"
  },

  userBox:{
    display:"flex",
    alignItems:"center",
    gap:20
  },

  userInfo:{
    display:"flex",
    flexDirection:"column",
    alignItems:"flex-end"
  },

  userName:{
    fontWeight:600,
    fontSize:14,
    color:"#111827"
  },

  userRole:{
    fontSize:12,
    color:"#6b7280"
  },

  logoutButton:{
    background:"#ef4444",
    color:"#fff",
    border:"none",
    padding:"8px 14px",
    borderRadius:6,
    cursor:"pointer",
    fontSize:13
  },

  content:{
    flex:1,
    overflow:"auto",
    padding:"30px 40px"
  },

  pageContainer:{
    width:"100%",
    maxWidth:"1600px",
    margin:"0 auto"
  }

}