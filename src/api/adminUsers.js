import http from './http'

function normalizeUserList(body) {
  const items = Array.isArray(body) ? body : body?.data ?? body?.users ?? body?.items ?? []
  const meta = body?.pagination ?? body ?? {}
  const page = Number(meta.page ?? meta.currentPage) || 1
  const limit = Number(meta.limit) || items.length || 1
  const total = Number(meta.total ?? meta.totalItems ?? items.length) || 0
  const totalPages = Number(meta.totalPages) || Math.max(1, Math.ceil(total / limit))
  return { items, pagination: { page, limit, total, totalPages } }
}

export async function getAdminUsers(params = {}) {
  const response = await http.get('/api/users/admin', { params })
  return normalizeUserList(response.data)
}

export async function setUserRoleByEmail(email, role) {
  const response = await http.patch('/api/users/admin/set-role', { email, role })
  return response.data
}
