import { ReactNode } from "react"
import { Navigate } from "react-router-dom"

type Props = {
children: ReactNode
roles?: string[]
}

export default function RequireAuth({ children, roles }: Props) {

const token = localStorage.getItem("token")
const role = localStorage.getItem("role")

if (!token) {

return <Navigate to="/login" />

}

if (roles && role && !roles.includes(role)) {

return <Navigate to="/no-access" />

}

return <>{children}</>

}