import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { api, type Voice, type Project } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { Play, Wand2, Download, Save } from 'lucide-react'

export default function Editor() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [projectName, setProjectName] = useState('')
  const [text, setText] = useState('')
  const [voices, setVoices] = useState<Voice[]>([])
  const [selectedVoice, setSelectedVoice] = useState('')
  const [speed, setSpeed] = useState(1.0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    loadVoices()
    if (projectId) {
      loadProject(projectId)
    }
  }, [projectId])

  const loadVoices = async () => {
    try {
      const voicesData = await api.getVoices()
      setVoices(voicesData)
      if (voicesData.length > 0 && !selectedVoice) {
        setSelectedVoice(voicesData[0].id)
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao carregar vozes',
      })
    }
  }

  const loadProject = async (id: string) => {
    try {
      const project = await api.getProject(id)
      setProjectName(project.name)
      setText(project.text)
      setSelectedVoice(project.voice_id)
      setSpeed(project.speed)
      if (project.audio_url) {
        setAudioUrl(api.getAudioUrl(project.audio_url))
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao carregar projeto',
      })
    }
  }

  const handlePreview = async () => {
    if (!text || !selectedVoice) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Preencha o texto e selecione uma voz',
      })
      return
    }

    try {
      const blob = await api.preview({
        text: text.substring(0, 500),
        voice_id: selectedVoice,
        speed,
      })

      const url = URL.createObjectURL(blob)
      setAudioUrl(url)

      toast({
        title: 'Preview gerado',
        description: 'Ouça o preview do áudio',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao gerar preview',
      })
    }
  }

  const handleGenerate = async () => {
    if (!text || !selectedVoice) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Preencha o texto e selecione uma voz',
      })
      return
    }

    setIsGenerating(true)
    setProgress(0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 500)

    try {
      const result = await api.synthesize({
        text,
        voice_id: selectedVoice,
        speed,
        output_format: 'mp3',
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (result.audio_url) {
        setAudioUrl(api.getAudioUrl(result.audio_url))
      }

      toast({
        title: 'Áudio gerado',
        description: 'Áudio gerado com sucesso!',
      })
    } catch (error) {
      clearInterval(progressInterval)
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao gerar áudio',
      })
    } finally {
      setIsGenerating(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  const handleSave = async () => {
    if (!projectName || !text) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Preencha o nome e o texto do projeto',
      })
      return
    }

    try {
      const projectData: Partial<Project> = {
        name: projectName,
        text,
        voice_id: selectedVoice,
        speed,
        output_format: 'mp3',
      }

      if (projectId) {
        await api.updateProject(projectId, projectData)
        toast({
          title: 'Projeto atualizado',
          description: 'Projeto salvo com sucesso',
        })
      } else {
        const newProject = await api.createProject(projectData)
        toast({
          title: 'Projeto criado',
          description: 'Projeto salvo com sucesso',
        })
        navigate(`/editor/${newProject.id}`)
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao salvar projeto',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Editor de Áudio</h1>
        <p className="text-muted-foreground">
          Crie e edite seus áudios com IA
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Input */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome do Projeto</label>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Meu projeto de áudio"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Texto</label>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Digite o texto que será convertido em áudio..."
                  className="min-h-[200px]"
                />
                <p className="text-xs text-muted-foreground">
                  {text.length} caracteres
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Voz</label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma voz" />
                  </SelectTrigger>
                  <SelectContent>
                    {voices.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        {voice.name} ({voice.language})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Velocidade: {speed.toFixed(1)}x
                </label>
                <Slider
                  value={[speed]}
                  onValueChange={([value]) => setSpeed(value)}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button
              onClick={handlePreview}
              variant="outline"
              className="flex-1"
            >
              <Play className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-1"
            >
              <Wand2 className="mr-2 h-4 w-4" />
              {isGenerating ? 'Gerando...' : 'Gerar'}
            </Button>
          </div>

          {isGenerating && (
            <Progress value={progress} className="w-full" />
          )}
        </div>

        {/* Right Column - Output */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Player de Áudio</CardTitle>
            </CardHeader>
            <CardContent>
              {audioUrl ? (
                <div className="space-y-4">
                  <audio controls className="w-full" src={audioUrl}>
                    Seu navegador não suporta o elemento de áudio.
                  </audio>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" className="flex-1">
                      <a href={audioUrl} download>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </a>
                    </Button>
                    <Button onClick={handleSave} className="flex-1">
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Projeto
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
                  <p className="text-sm text-muted-foreground">
                    Nenhum áudio gerado ainda
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dicas</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Use o Preview para testar pequenos trechos</li>
                <li>• Ajuste a velocidade para melhor compreensão</li>
                <li>• Salve o projeto para editar depois</li>
                <li>• O áudio final pode ser baixado em MP3</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
