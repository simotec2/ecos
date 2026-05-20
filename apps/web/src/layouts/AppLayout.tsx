import { Outlet, Link, useNavigate, useLocation } from "react-router-dom"
import CompanySelector from "../components/CompanySelector"

export default function AppLayout(){

  const navigate = useNavigate()
  const location = useLocation()

  const isMobile = window.innerWidth < 768

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

      {/* SIDEBAR */}

      {!isMobile && (

        <div style={styles.sidebar}>

          <div style={styles.logoBox}>

            <img
              src="/ecos-logo.jpg"
              style={styles.logo}
            />

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

      )}

      {/* MAIN */}

      <div style={styles.main}>

        {/* TOPBAR */}

        <div style={{
          ...styles.topbar,
          flexDirection:
            isMobile
            ? "column"
            : "row",
          alignItems:
            isMobile
            ? "flex-start"
            : "center",
          height:
            isMobile
            ? "auto"
            : 64,
          padding:
            isMobile
            ? 16
            : "0 28px"
        }}>

          <div style={{
            ...styles.topbarTitle,
            fontSize:
              isMobile
              ? 13
              : 16
          }}>
            Plataforma ECOS
          </div>

          <div style={{
            ...styles.userBox,
            width:
              isMobile
              ? "100%"
              : "auto",
            justifyContent:
              isMobile
              ? "space-between"
              : "flex-end",
            marginTop:
              isMobile
              ? 12
              : 0
          }}>

            <CompanySelector/>

            <div style={styles.userInfo}>

              <div style={styles.userName}>
                {userName}
              </div>

              <div style={styles.userRole}>
                {role}
              </div>

            </div>

            <button
              onClick={logout}
              style={styles.logoutButton}
            >
              Salir
            </button>

          </div>

        </div>

        {/* CONTENT */}

        <div style={{
          ...styles.content,
          padding:
            isMobile
            ? 16
            : "30px 40px"
        }}>

          <div style={styles.pageContainer}>

            <Outlet/>

          </div>

        </div>

      </div>

    </div>

  )

}

const styles:any={

  container:{

    display:"flex",

    minHeight:"100vh",

    width:"100%",

    background:
      "linear-gradient(135deg,#071426 0%,#0d1b2a 45%,#071426 100%)",

    color:"#ffffff",

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

    background:
      "linear-gradient(180deg,#071426 0%,#0f172a 100%)",

    display:"flex",

    flexDirection:"column",

    borderRight:
      "1px solid rgba(255,255,255,0.08)",

    boxShadow:
      "0 0 30px rgba(0,0,0,0.35)"

  },

  logoBox:{

    display:"flex",

    justifyContent:"center",

    alignItems:"center",

    padding:20,

    borderBottom:
      "1px solid rgba(255,255,255,0.08)"

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

    gap:8

  },

  menuItem:{

    color:"#cbd5e1",

    textDecoration:"none",

    padding:"12px 14px",

    borderRadius:12,

    fontSize:14

  },

  menuActive:{

    background:
      "linear-gradient(135deg,#1d4ed8,#2563eb)",

    color:"#ffffff"

  },

  main:{

    flex:1,

    display:"flex",

    flexDirection:"column",

    overflow:"hidden"

  },

  topbar:{

    background:
      "rgba(15,23,42,0.92)",

    borderBottom:
      "1px solid rgba(255,255,255,0.08)",

    display:"flex",

    justifyContent:"space-between",

    backdropFilter:"blur(10px)"

  },

  topbarTitle:{

    fontWeight:700,

    color:"#ffffff"

  },

  userBox:{

    display:"flex",

    alignItems:"center",

    gap:16,

    flexWrap:"wrap"

  },

  userInfo:{

    display:"flex",

    flexDirection:"column"

  },

  userName:{

    fontWeight:600,

    fontSize:14

  },

  userRole:{

    fontSize:12,

    color:"#94a3b8"

  },

  logoutButton:{

    background:
      "linear-gradient(135deg,#dc2626,#ef4444)",

    color:"#fff",

    border:"none",

    padding:"10px 16px",

    borderRadius:12,

    cursor:"pointer",

    fontSize:13,

    fontWeight:600

  },

  content:{

    flex:1,

    overflow:"auto"

  },

  pageContainer:{

    width:"100%",

    maxWidth:"1600px",

    margin:"0 auto",

    color:"#ffffff"

  }

}