import axios from 'axios'

const api = axios.create({
  baseURL: '/api'
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('session_token')
  if (token) {
    config.headers['x-session-token'] = token
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't automatically redirect in interceptor, let useAuth handle state
      // But we can emit an event or just let the error propagate
    }
    return Promise.reject(error)
  }
)

export default api
