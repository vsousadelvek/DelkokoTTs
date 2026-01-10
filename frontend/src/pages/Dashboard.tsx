import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { api, type StatsResponse, type Project, type Job } from '@/services/api'
import { formatDuration, formatFileSize, formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { FileAudio, FolderOpen, Clock, HardDrive, CheckCircle2, XCircle } from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [recentProjects, setRecentProjects] = useState<Project[]>([])
  const [recentJobs, setRecentJobs] = useState<Job[]>([])
  const [healthStatus, setHealthStatus] = useState<string>('checking')
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [healthRes, statsRes, projectsRes, jobsRes] = await Promise.all([
        api.checkHealth(),
        api.getStats(),
        api.getProjects(),
        api.getJobs(),
      ])

      setHealthStatus(healthRes.status)
      setStats(statsRes)
      setRecentProjects(projectsRes.slice(0, 5))
      setRecentJobs(jobsRes.slice(0, 5))
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao carregar dados',
      })
      setHealthStatus('error')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do TTS Content Studio
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Projetos
            </CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_projects || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Jobs
            </CardTitle>
            <FileAudio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_jobs || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Duração Total
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(stats?.total_duration_seconds || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Armazenamento
            </CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatFileSize(stats?.storage_used_bytes || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {healthStatus === 'ok' ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">Sistema Operacional</span>
              </>
            ) : healthStatus === 'error' ? (
              <>
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-sm font-medium">Sistema com Problemas</span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">Verificando...</span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Projetos Recentes</CardTitle>
            <CardDescription>Últimos 5 projetos criados</CardDescription>
          </CardHeader>
          <CardContent>
            {recentProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum projeto ainda</p>
            ) : (
              <div className="space-y-3">
                {recentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{project.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(project.created_at)}
                      </p>
                    </div>
                    <Link to={`/editor/${project.id}`}>
                      <Button variant="ghost" size="sm">
                        Abrir
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Jobs */}
        <Card>
          <CardHeader>
            <CardTitle>Jobs Recentes</CardTitle>
            <CardDescription>Últimos 5 jobs processados</CardDescription>
          </CardHeader>
          <CardContent>
            {recentJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum job ainda</p>
            ) : (
              <div className="space-y-3">
                {recentJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex h-2 w-2 rounded-full ${
                            job.status === 'completed'
                              ? 'bg-green-500'
                              : job.status === 'failed'
                              ? 'bg-red-500'
                              : 'bg-yellow-500'
                          }`}
                        />
                        <p className="text-sm font-medium">{job.status}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(job.created_at)}
                      </p>
                    </div>
                    {job.audio_url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={api.getAudioUrl(job.audio_url)} download>
                          Download
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center">
        <Link to="/editor">
          <Button size="lg">
            Criar Novo Áudio
          </Button>
        </Link>
      </div>
    </div>
  )
}
