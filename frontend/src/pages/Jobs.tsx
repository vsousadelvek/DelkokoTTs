import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { api, type Job } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { formatDate, formatDuration, formatFileSize } from '@/lib/utils'
import { Download, RefreshCw } from 'lucide-react'

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    try {
      const data = await api.getJobs()
      setJobs(data)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao carregar jobs',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500'
      case 'failed':
        return 'bg-red-500'
      case 'processing':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluído'
      case 'failed':
        return 'Falhou'
      case 'processing':
        return 'Processando'
      case 'pending':
        return 'Pendente'
      default:
        return status
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground">
            Histórico de processamento de áudios
          </p>
        </div>
        <Button onClick={loadJobs} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Carregando...</p>
          </CardContent>
        </Card>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Nenhum job encontrado
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Todos os Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex h-3 w-3 rounded-full ${getStatusColor(
                          job.status
                        )}`}
                      />
                      <span className="font-medium">
                        {getStatusLabel(job.status)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ID: {job.id.slice(0, 8)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground md:grid-cols-4">
                      <div>
                        <p className="font-medium text-foreground">Voz</p>
                        <p>{job.voice_id}</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Tamanho do Texto</p>
                        <p>{job.text_length} caracteres</p>
                      </div>
                      {job.duration_seconds && (
                        <div>
                          <p className="font-medium text-foreground">Duração</p>
                          <p>{formatDuration(job.duration_seconds)}</p>
                        </div>
                      )}
                      {job.file_size_bytes && (
                        <div>
                          <p className="font-medium text-foreground">Tamanho</p>
                          <p>{formatFileSize(job.file_size_bytes)}</p>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Criado em {formatDate(job.created_at)}
                      {job.completed_at &&
                        ` • Concluído em ${formatDate(job.completed_at)}`}
                    </div>

                    {job.error_message && (
                      <div className="text-sm text-red-500">
                        Erro: {job.error_message}
                      </div>
                    )}
                  </div>

                  {job.audio_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={api.getAudioUrl(job.audio_url)} download>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
