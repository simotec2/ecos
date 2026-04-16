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

/* =========================
PROTECCIÓN ADMIN
========================= */
function PrivateRoute({ children }: any) {

  const token = localStorage.getItem("token")
  const forcePasswordChange = localStorage.getItem("forcePasswordChange") === "true"

  // 🔴 SIN TOKEN → LOGIN
  if (!token) {
    return <Navigate to="/login" replace />
  }

  // 🔥 BLOQUEO POR CAMBIO DE CLAVE
  if (forcePasswordChange) {
    return <Navigate to="/change-password" replace />
  }

  return children
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

        {/* 🔥 CAMBIO DE CLAVE (PUBLICO PERO CON TOKEN) */}
        <Route path="/change-password" element={<ChangePassword/>} />

        {/* PARTICIPANTE */}
        <Route path="/participant/:token" element={<ParticipantAccess/>} />
        <Route path="/participant/:token/final" element={<Finished />} />

        {/* RENDIR */}
        <Route path="/evaluation/:sessionId" element={<EvaluationSession/>} />

        {/* 🔥 PDF PUBLICO */}
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

          <Route index element={<Dashboard/>} />
          <Route path="dashboard" element={<Dashboard/>} />

          <Route path="companies" element={<Companies/>} />
          <Route path="users" element={<Users/>} />
          <Route path="participants" element={<Participants/>} />
          <Route path="assignments" element={<Assignments/>} />
          <Route path="evaluations" element={<Evaluations/>} />
          <Route path="evaluations/new" element={<EvaluationBuilder/>} />

          <Route path="evaluations/:id/view" element={<EvaluationEditor/>} />
          <Route path="evaluations/:id/edit" element={<EvaluationEditor/>} />
          <Route path="evaluations/:id/test" element={<EvaluationSession/>} />

          {/* REPORTES */}
          <Route path="reports" element={<ReportList/>} />
          <Route path="reports/:id" element={<ReportDetail/>} />
          <Route path="reports/view/:id" element={<ReportView/>} />

          <Route path="my-evaluations" element={<MyEvaluations/>} />

        </Route>

      </Routes>

    </BrowserRouter>

  )

}