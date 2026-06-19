import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import AppLayout from "./layouts/AppLayout"

import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Companies from "./pages/Companies"
import Users from "./pages/Users"
import Participants from "./pages/Participants"
import Assignments from "./pages/Assignments"
import Evaluations from "./pages/Evaluations"
import EvaluationSession from "./pages/EvaluationSession"
import EvaluationEditor from "./pages/EvaluationEditor"
import EvaluationBuilder from "./pages/EvaluationBuilder"

import ReportList from "./pages/ReportList"
import ReportDetail from "./pages/ReportDetail"
import ReportView from "./pages/ReportView"

import ParticipantAccess from "./pages/ParticipantAccess"
import MyEvaluations from "./pages/MyEvaluations"
import Finished from "./pages/Finished"

import NoAccess from "./pages/NoAccess"
import ChangePassword from "./pages/ChangePassword"

function getStoredPermissions(){

  try{

    const raw =
      localStorage.getItem("permissions")

    if(!raw){
      return []
    }

    const parsed =
      JSON.parse(raw)

    return Array.isArray(parsed)
      ? parsed
      : []

  }catch{

    return []

  }

}

function hasPermission(permission:string){

  const role =
    localStorage.getItem("role") || ""

  if(role === "SUPERADMIN"){
    return true
  }

  const permissions =
    getStoredPermissions()

  return permissions.includes(permission)

}

function hasAnyPermission(permissions:string[]){

  const role =
    localStorage.getItem("role") || ""

  if(role === "SUPERADMIN"){
    return true
  }

  return permissions.some(permission =>
    hasPermission(permission)
  )

}

/* =========================
PROTECCIÓN LOGIN
========================= */
function PrivateRoute({ children }: any) {

  const token =
    localStorage.getItem("token")

  const forcePasswordChange =
    localStorage.getItem("forcePasswordChange") === "true"

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (forcePasswordChange) {
    return <Navigate to="/change-password" replace />
  }

  return children

}

/* =========================
PROTECCIÓN PERMISOS
========================= */
function PermissionRoute({
  children,
  permission,
  anyOf
}:any){

  const token =
    localStorage.getItem("token")

  if(!token){
    return <Navigate to="/login" replace />
  }

  let allowed = true

  if(permission){
    allowed = hasPermission(permission)
  }

  if(anyOf && Array.isArray(anyOf)){
    allowed = hasAnyPermission(anyOf)
  }

  if(!allowed){
    return <Navigate to="/no-access" replace />
  }

  return children

}

/* =========================
REDIRECCIÓN INTELIGENTE /APP
========================= */
function DefaultAppRedirect(){

  const role =
    localStorage.getItem("role") || ""

  if(role === "PARTICIPANT"){
    return <Navigate to="/app/my-evaluations" replace />
  }

  const routes = [

    {
      path:"/app/dashboard",
      permission:"DASHBOARD_VIEW"
    },

    {
      path:"/app/companies",
      permission:"COMPANIES_VIEW"
    },

    {
      path:"/app/users",
      permission:"USERS_VIEW"
    },

    {
      path:"/app/participants",
      permission:"PARTICIPANTS_VIEW"
    },

    {
      path:"/app/assignments",
      permission:"ASSIGNMENTS_VIEW"
    },

    {
      path:"/app/evaluations",
      permission:"EVALUATIONS_VIEW"
    },

    {
      path:"/app/reports",
      permission:"REPORTS_VIEW"
    }

  ]

  const firstAllowed =
    routes.find(route =>
      hasPermission(route.permission)
    )

  if(firstAllowed){
    return <Navigate to={firstAllowed.path} replace />
  }

  return <Navigate to="/no-access" replace />

}

/* =========================
APP
========================= */
export default function App(){

  return(

    <BrowserRouter>

      <Routes>

        {/* =========================
        PUBLICO
        ========================= */}

        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login/>} />

        <Route path="/change-password" element={<ChangePassword/>} />

        <Route path="/participant/:token" element={<ParticipantAccess/>} />

        <Route path="/access/:token" element={<ParticipantAccess/>} />

        <Route path="/participant/:token/final" element={<Finished />} />

        <Route path="/access/:token/final" element={<Finished />} />

        <Route path="/evaluation/:sessionId" element={<EvaluationSession/>} />

        <Route path="/report-public/:id" element={<ReportView/>} />

        <Route path="/no-access" element={<NoAccess/>} />

        {/* =========================
        ADMIN
        ========================= */}

        <Route
          path="/app"
          element={
            <PrivateRoute>
              <AppLayout/>
            </PrivateRoute>
          }
        >

          <Route
            index
            element={<DefaultAppRedirect/>}
          />

          <Route
            path="dashboard"
            element={
              <PermissionRoute permission="DASHBOARD_VIEW">
                <Dashboard/>
              </PermissionRoute>
            }
          />

          <Route
            path="companies"
            element={
              <PermissionRoute permission="COMPANIES_VIEW">
                <Companies/>
              </PermissionRoute>
            }
          />

          <Route
            path="users"
            element={
              <PermissionRoute permission="USERS_VIEW">
                <Users/>
              </PermissionRoute>
            }
          />

          <Route
            path="participants"
            element={
              <PermissionRoute permission="PARTICIPANTS_VIEW">
                <Participants/>
              </PermissionRoute>
            }
          />

          <Route
            path="assignments"
            element={
              <PermissionRoute permission="ASSIGNMENTS_VIEW">
                <Assignments/>
              </PermissionRoute>
            }
          />

          <Route
            path="evaluations"
            element={
              <PermissionRoute permission="EVALUATIONS_VIEW">
                <Evaluations/>
              </PermissionRoute>
            }
          />

          <Route
            path="evaluations/new"
            element={
              <PermissionRoute permission="EVALUATIONS_CREATE">
                <EvaluationBuilder/>
              </PermissionRoute>
            }
          />

          <Route
            path="evaluations/:id/view"
            element={
              <PermissionRoute
                anyOf={[
                  "EVALUATIONS_VIEW",
                  "EVALUATIONS_EDIT",
                  "EVALUATIONS_TEST"
                ]}
              >
                <EvaluationEditor/>
              </PermissionRoute>
            }
          />

          <Route
            path="evaluations/:id/edit"
            element={
              <PermissionRoute permission="EVALUATIONS_EDIT">
                <EvaluationEditor/>
              </PermissionRoute>
            }
          />

          <Route
            path="evaluations/:id/test"
            element={
              <PermissionRoute permission="EVALUATIONS_TEST">
                <EvaluationSession/>
              </PermissionRoute>
            }
          />

          <Route
            path="reports"
            element={
              <PermissionRoute permission="REPORTS_VIEW">
                <ReportList/>
              </PermissionRoute>
            }
          />

          <Route
            path="reports/:id"
            element={
              <PermissionRoute permission="REPORTS_VIEW">
                <ReportDetail/>
              </PermissionRoute>
            }
          />

          <Route
            path="reports/view/:id"
            element={
              <PermissionRoute permission="REPORTS_VIEW">
                <ReportView/>
              </PermissionRoute>
            }
          />

          <Route
            path="my-evaluations"
            element={<MyEvaluations/>}
          />

        </Route>

      </Routes>

    </BrowserRouter>

  )

}