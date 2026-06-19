export const ALL_PERMISSIONS = [

  "DASHBOARD_VIEW",

  "COMPANIES_VIEW",
  "COMPANIES_CREATE",
  "COMPANIES_EDIT",
  "COMPANIES_DELETE",

  "USERS_VIEW",
  "USERS_CREATE",
  "USERS_EDIT",
  "USERS_DELETE",
  "USERS_PERMISSIONS",

  "PARTICIPANTS_VIEW",
  "PARTICIPANTS_CREATE",
  "PARTICIPANTS_EDIT",
  "PARTICIPANTS_DELETE",
  "PARTICIPANTS_INVITE",

  "ASSIGNMENTS_VIEW",
  "ASSIGNMENTS_CREATE",
  "ASSIGNMENTS_DELETE",

  "EVALUATIONS_VIEW",
  "EVALUATIONS_CREATE",
  "EVALUATIONS_EDIT",
  "EVALUATIONS_DELETE",
  "EVALUATIONS_TEST",

  "RESULTS_VIEW",
  "RESULTS_DELETE",

  "REPORTS_VIEW",
  "REPORTS_FINAL_VIEW"

]

export function normalizePermissions(input:any){

  if(!Array.isArray(input)){
    return []
  }

  return input.filter((p:any)=>
    typeof p === "string" &&
    ALL_PERMISSIONS.includes(p)
  )

}

export function parsePermissionsJson(json:any){

  try{

    if(json === undefined || json === null || json === ""){
      return null
    }

    const parsed =
      typeof json === "string"
        ? JSON.parse(json)
        : json

    return normalizePermissions(parsed)

  }catch{

    return null

  }

}

export function getDefaultPermissions(role:string){

  if(role === "SUPERADMIN"){
    return ALL_PERMISSIONS
  }

  if(role === "PSYCHOLOGIST"){

    return [

      "DASHBOARD_VIEW",

      "PARTICIPANTS_VIEW",
      "PARTICIPANTS_CREATE",
      "PARTICIPANTS_EDIT",
      "PARTICIPANTS_INVITE",

      "ASSIGNMENTS_VIEW",
      "ASSIGNMENTS_CREATE",
      "ASSIGNMENTS_DELETE",

      "EVALUATIONS_VIEW",
      "EVALUATIONS_CREATE",
      "EVALUATIONS_EDIT",
      "EVALUATIONS_DELETE",
      "EVALUATIONS_TEST",

      "RESULTS_VIEW",

      "REPORTS_VIEW",
      "REPORTS_FINAL_VIEW"

    ]

  }

  if(role === "COMPANY_ADMIN"){

    return [

      "DASHBOARD_VIEW",

      "PARTICIPANTS_VIEW",
      "PARTICIPANTS_CREATE",
      "PARTICIPANTS_EDIT",
      "PARTICIPANTS_INVITE",

      "ASSIGNMENTS_VIEW",
      "ASSIGNMENTS_CREATE",
      "ASSIGNMENTS_DELETE",

      "REPORTS_VIEW",
      "REPORTS_FINAL_VIEW"

    ]

  }

  return []

}

export function getUserPermissions(user:any){

  if(!user){
    return []
  }

  if(user.role === "SUPERADMIN"){
    return ALL_PERMISSIONS
  }

  const custom =
    parsePermissionsJson(user.permissionsJson)

  if(custom !== null){
    return custom
  }

  return getDefaultPermissions(user.role)

}

export function hasPermission(user:any, permission:string){

  if(!user){
    return false
  }

  if(user.role === "SUPERADMIN"){
    return true
  }

  const permissions =
    Array.isArray(user.permissions)
      ? user.permissions
      : getUserPermissions(user)

  return permissions.includes(permission)

}

export function hasAnyPermission(user:any, permissions:string[]){

  if(!user){
    return false
  }

  if(user.role === "SUPERADMIN"){
    return true
  }

  return permissions.some(permission =>
    hasPermission(user, permission)
  )

}

export function requirePermission(permission:string){

  return function(req:any, res:any, next:any){

    const user = req.user

    if(!hasPermission(user, permission)){

      return res.status(403).json({
        error:`Sin permiso: ${permission}`
      })

    }

    next()

  }

}

export function requireAnyPermission(permissions:string[]){

  return function(req:any, res:any, next:any){

    const user = req.user

    if(!hasAnyPermission(user, permissions)){

      return res.status(403).json({
        error:`Sin permisos requeridos: ${permissions.join(", ")}`
      })

    }

    next()

  }

}