export async function apiFetch(url: string, options: any = {}) {

  const token = localStorage.getItem("token")

  

  const isBodyObject = options.body && typeof options.body === "object"

  const res = await fetch(`http://localhost:3001${url}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    body: isBodyObject ? JSON.stringify(options.body) : options.body
  })

  const text = await res.text()

  let data: any = {}

  try{
    data = text ? JSON.parse(text) : {}
  }catch{
    data = { raw:text }
  }

  if (!res.ok) {
    console.error("API ERROR:", data)
    throw new Error(data?.error || text || "Error en API")
  }

  return data
}