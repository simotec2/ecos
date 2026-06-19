import {
  Outlet,
  Link,
  useNavigate,
  useLocation
} from "react-router-dom"

import {
  useState,
  useEffect
} from "react"

import CompanySelector from "../components/CompanySelector"

export default function AppLayout(){

  const navigate = useNavigate()
  const location = useLocation()

  /* =========================
  MOBILE DETECTION
  ========================= */

  const [isMobile,setIsMobile] = useState(
    window.innerWidth < 768
  )

  const [menuOpen,setMenuOpen] = useState(false)

  useEffect(()=>{

    function handleResize(){

      setIsMobile(
        window.innerWidth < 768
      )

    }

    window.addEventListener(
      "resize",
      handleResize
    )

    handleResize()

    return ()=>{

      window.removeEventListener(
        "resize",
        handleResize
      )

    }

  },[])

  /* =========================
  USER
  ========================= */

  const userName =
    localStorage.getItem("userName") || "Usuario"

  const role =
    localStorage.getItem("role") || ""

  const originalRole =
    localStorage.getItem("originalRole")

  /* =========================
  ACTIONS
  ========================= */

  function logout(){

    localStorage.clear()

    navigate("/login",{replace:true})

  }

  function backToAdmin(){

  const originalToken =
    localStorage.getItem("originalToken")

  const originalRole =
    localStorage.getItem("originalRole")

  const originalUserName =
    localStorage.getItem("originalUserName")

  const originalPermissions =
    localStorage.getItem("originalPermissions")

  const originalCompanyId =
    localStorage.getItem("originalCompanyId")

  const originalCompanyName =
    localStorage.getItem("originalCompanyName")

  if(originalToken){
    localStorage.setItem("token", originalToken)
    localStorage.setItem("jwt", originalToken)
    localStorage.setItem("accessToken", originalToken)
    localStorage.setItem("access_token", originalToken)
  }

  if(originalRole){
    localStorage.setItem("role", originalRole)
  }else{
    localStorage.setItem("role", "SUPERADMIN")
  }

  if(originalUserName){
    localStorage.setItem("userName", originalUserName)
  }

  if(originalPermissions){
    localStorage.setItem("permissions", originalPermissions)
  }else{
    localStorage.setItem("permissions", "[]")
  }

  localStorage.setItem(
    "companyId",
    originalCompanyId || ""
  )

  localStorage.setItem(
    "companyName",
    originalCompanyName || ""
  )

  localStorage.removeItem("originalToken")
  localStorage.removeItem("originalRole")
  localStorage.removeItem("originalUserName")
  localStorage.removeItem("originalPermissions")
  localStorage.removeItem("originalCompanyId")
  localStorage.removeItem("originalCompanyName")

  navigate("/app",{replace:true})

  window.location.reload()

}

  function closeMenu(){

    if(isMobile){

      setMenuOpen(false)

    }

  }

  function menuStyle(path:string){

    const isActive =
      location.pathname === path ||
      location.pathname.startsWith(path + "/")

    if(isActive){

      return{
        ...styles.menuItem,
        ...styles.menuActive
      }

    }

    return styles.menuItem

  }

  /* =========================
  MENU
  ========================= */

  const menu:any={

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

  /* =========================
  UI
  ========================= */

  return(

    <div style={styles.container}>

      {/* =========================
      IMPERSONATION
      ========================= */}

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

      {/* =========================
      MOBILE OVERLAY
      ========================= */}

      {isMobile && menuOpen && (

        <div
          style={styles.overlay}
          onClick={()=>
            setMenuOpen(false)
          }
        />

      )}

      {/* =========================
      SIDEBAR
      ========================= */}

      <div style={{
        ...styles.sidebar,

        position:
          isMobile
          ? "fixed"
          : "relative",

        left:
          isMobile
          ? menuOpen
            ? 0
            : -260
          : 0,

        top:0,

        zIndex:9999,

        transition:"0.3s",

        height:"100vh"
      }}>

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
              onClick={closeMenu}
            >
              {item.label}
            </Link>

          ))}

        </nav>

      </div>

      {/* =========================
      MAIN
      ========================= */}

      <div style={styles.main}>

        {/* =========================
        TOPBAR
        ========================= */}

        <div style={{
          ...styles.topbar,
          height:
            isMobile
            ? 58
            : 64
        }}>

          <div style={{
            display:"flex",
            alignItems:"center",
            gap:14
          }}>

            {/* HAMBURGER */}

            {isMobile && (

              <button
                onClick={()=>
                  setMenuOpen(!menuOpen)
                }
                style={styles.hamburger}
              >
                ☰
              </button>

            )}

            <div style={{
              ...styles.topbarTitle,
              fontSize:
                isMobile
                ? 14
                : 16
            }}>
              Plataforma ECOS
            </div>

          </div>

          <div style={styles.userBox}>

            {!isMobile && (
              <CompanySelector/>
            )}

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

        {/* =========================
        CONTENT
        ========================= */}

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

/* =========================
STYLES
========================= */

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

  overlay:{

    position:"fixed",

    inset:0,

    background:"rgba(0,0,0,0.45)",

    zIndex:9998

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

    zIndex:99999

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

    alignItems:"center",

    justifyContent:"space-between",

    padding:"0 18px",

    backdropFilter:"blur(10px)"

  },

  hamburger:{

    width:42,

    height:42,

    borderRadius:10,

    border:"none",

    background:"#1e293b",

    color:"#fff",

    fontSize:22,

    cursor:"pointer",

    display:"flex",

    alignItems:"center",

    justifyContent:"center"

  },

  topbarTitle:{

    fontWeight:700,

    color:"#ffffff"

  },

  userBox:{

    display:"flex",

    alignItems:"center",

    gap:14

  },

  userInfo:{

    display:"flex",

    flexDirection:"column",

    alignItems:"flex-end"

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