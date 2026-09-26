const API_BASE = '/api'

export interface HealthResponse {
  status: string
  tts_engine: boolean
  voices_available: number
}

export interface StatsResponse {
  projects: { total: number }
  jobs: { total: number; by_status: Record<string, number> }
  tts: { engine: string; voices: number; initialized: boolean }
}

export interface Voice {
  id: string
  name: string
  gender: string
  accent: string
}

export interface SynthesizeRequest {
  text: string
  voice?: string
  speed?: number
}

export interface SynthesizeResponse {
  audio_url: string
  duration: number
  filename: string
}

export interface Project {
  id: number
  name: string
  text_content: string
  voice: string
  speed: number
  word_count: number
  created_at: string
  updated_at?: string
}

export interface ProjectInput {
  name: string
  text_content: string
  voice?: string
  speed?: number
}

export interface Job {
  id: number
  text: string
  voice: string
  speed: number
  status: string
  progress: number
  audio_url?: string
  duration?: number
  created_at: string
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
    const response = await fetch(`${API_BASE}/tts/voices`)
    const data = await handleResponse<{ voices: Voice[]; count: number }>(response)
    return data.voices
  },

  // Synthesis — returns JSON with audio_url pointing at the generated WAV
  synthesize: async (data: SynthesizeRequest): Promise<SynthesizeResponse> => {
    const response = await fetch(`${API_BASE}/tts/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse<SynthesizeResponse>(response)
  },

  preview: async (data: SynthesizeRequest): Promise<SynthesizeResponse> => {
    const response = await fetch(`${API_BASE}/tts/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse<SynthesizeResponse>(response)
  },

  // Projects
  getProjects: async (): Promise<Project[]> => {
    const response = await fetch(`${API_BASE}/projects/`)
    return handleResponse<Project[]>(response)
  },

  getProject: async (id: number | string): Promise<Project> => {
    const response = await fetch(`${API_BASE}/projects/${id}`)
    return handleResponse<Project>(response)
  },

  createProject: async (data: ProjectInput): Promise<Project> => {
    const response = await fetch(`${API_BASE}/projects/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse<Project>(response)
  },

  updateProject: async (id: number | string, data: Partial<ProjectInput>): Promise<Project> => {
    const response = await fetch(`${API_BASE}/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse<Project>(response)
  },

  deleteProject: async (id: number | string): Promise<void> => {
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
    const response = await fetch(`${API_BASE}/jobs/`)
    return handleResponse<Job[]>(response)
  },

  createJob: async (data: SynthesizeRequest): Promise<Job> => {
    const response = await fetch(`${API_BASE}/jobs/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse<Job>(response)
  },
}
