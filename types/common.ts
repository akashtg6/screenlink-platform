export interface Paginated<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface ServiceResult<T> {
  data?: T
  error?: string
}

export interface Notification {
  id: string
  title: string
  body?: string
  createdAt: string
  read: boolean
  type: 'info' | 'success' | 'warning' | 'error'
}
