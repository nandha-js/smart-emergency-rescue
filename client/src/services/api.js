import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

export const triggerSOS = (data) => api.post('/sos', data)

export const getUsers = () => api.get('/users')

export const getAlerts = () => api.get('/alerts')

export const getAlertById = (id) => api.get(`/alerts/${id}`)

export const updateAlert = (id, data) => api.patch(`/alerts/${id}`, data)

export const createUser = (data) => api.post('/users', data)

export default api
