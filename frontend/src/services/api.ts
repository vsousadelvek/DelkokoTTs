const API_BASE = '/api'

export interface HealthResponse {
  status: string
  timestamp: string
}

export interface StatsResponse {
  total_projects: number
  total_jobs: number
  total_audio_files: number
  total_duration_seconds: number
  storage_used_bytes: number
}

export interface Voice {
  id: string
  name: string
  language: string
  gender: string
}

export interface SynthesizeRequest {
  text: string
  voice_id: string
  speed?: number
  output_format?: string
}

export interface SynthesizeResponse {
  job_id: string
  status: string
  audio_url?: string
}

export interface PreviewRequest {
  text: string
  voice_id: string
  speed?: number
}

export interface Project {
  id: string
  name: string
  text: string
  voice_id: string
  speed: number
  output_format: string
  created_at: string
  updated_at: string
  audio_url?: string
}

export interface Job {
  id: string
  project_id?: string
  status: string
  voice_id: string
  text_length: number
  speed: number
  output_format: string
  audio_url?: string
  duration_seconds?: number
  file_size_bytes?: number
  error_message?: string
  created_at: string
  completed_at?: string
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Erro desconhecido' }))
    throw new Error(error.detail || `Erro ${response.status}`)
  }
  return response.json()
}

export const api = {
  // Health & Stats
  checkHealth: async (): Promise<HealthResponse> => {
    const response = await fetch(`${API_BASE}/health`)
    return handleResponse<HealthResponse>(response)
  },

  getStats: async (): Promise<StatsResponse> => {
    const response = await fetch(`${API_BASE}/stats`)
    return handleResponse<StatsResponse>(response)
  },

  getVoices: async (): Promise<Voice[]> => {
    const response = await fetch(`${API_BASE}/voices`)
    return handleResponse<Voice[]>(response)
  },

  // Synthesis
  synthesize: async (data: SynthesizeRequest): Promise<SynthesizeResponse> => {
    const response = await fetch(`${API_BASE}/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse<SynthesizeResponse>(response)
  },

  preview: async (data: PreviewRequest): Promise<Blob> => {
    const response = await fetch(`${API_BASE}/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Erro desconhecido' }))
      throw new Error(error.detail || `Erro ${response.status}`)
    }
    return response.blob()
  },

  getAudioUrl: (filename: string): string => {
    return `${API_BASE}/audio/${filename}`
  },

  // Projects
  getProjects: async (): Promise<Project[]> => {
    const response = await fetch(`${API_BASE}/projects`)
    return handleResponse<Project[]>(response)
  },

  getProject: async (id: string): Promise<Project> => {
    const response = await fetch(`${API_BASE}/projects/${id}`)
    return handleResponse<Project>(response)
  },

  createProject: async (data: Partial<Project>): Promise<Project> => {
    const response = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse<Project>(response)
  },

  updateProject: async (id: string, data: Partial<Project>): Promise<Project> => {
    const response = await fetch(`${API_BASE}/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse<Project>(response)
  },

  deleteProject: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/projects/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Erro desconhecido' }))
      throw new Error(error.detail || `Erro ${response.status}`)
    }
  },

  // Jobs
  getJobs: async (): Promise<Job[]> => {
    const response = await fetch(`${API_BASE}/jobs`)
    return handleResponse<Job[]>(response)
  },

  createJob: async (data: Partial<Job>): Promise<Job> => {
    const response = await fetch(`${API_BASE}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse<Job>(response)
  },
}
