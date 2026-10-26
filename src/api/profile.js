import http from './http'

export async function getMyProfile() {
  const response = await http.get('/api/auth/me')
  return response.data
}

export async function updateMyProfile(profile, avatarFile) {
  const formData = new FormData()
  formData.append('firstName', profile.firstName)
  formData.append('lastName', profile.lastName)
  formData.append('phone', profile.phone)
  formData.append('address', profile.address)
  if (avatarFile) formData.append('avatar', avatarFile)

  const response = await http.put('/api/users/profile', formData)
  return response.data
}

export async function updateMyPassword(currentPassword, newPassword) {
  const response = await http.put('/api/users/change-password', { currentPassword, newPassword })
  return response.data
}