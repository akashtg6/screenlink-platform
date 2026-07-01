export interface Organization {
  id: string
  name: string
  slug?: string | null
  logoUrl?: string | null
  website?: string | null
  industry?: string | null
  country?: string | null
  createdAt: string
  updatedAt: string
}
