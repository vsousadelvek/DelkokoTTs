# TTS Content Studio - Arquitetura do Sistema

## Diagrama de Arquitetura Geral

```
                                    +-------------+
                                    |   USUARIO   |
                                    |  (Browser)  |
                                    +------+------+
                                           |
                                           | HTTPS
                                           v
+------------------------------------------------------------------------------+
|                              VPS / SERVIDOR                                   |
|  +------------------------------------------------------------------------+  |
|  |                           NGINX (Reverse Proxy)                        |  |
|  |                              Porta 80/443                              |  |
|  +-----------------------------------+------------------------------------+  |
|                                      |                                       |
|           +--------------------------+-------------------------+             |
|           |                                                    |             |
|           v                                                    v             |
|  +--------------------+                           +--------------------+     |
|  |      FRONTEND      |                           |       BACKEND      |     |
|  |   React + Vite     |      REST API             |      FastAPI       |     |
|  |                    |<------------------------->|                    |     |
|  |  * Dashboard       |      WebSocket            |  * API Routes      |     |
|  |  * Editor          |      (Real-time)          |  * TTS Service     |     |
|  |  * Projects        |                           |  * Job Queue       |     |
|  |  * Jobs            |                           |  * File Manager    |     |
|  |                    |                           |                    |     |
|  |  Tailwind CSS      |                           |  Porta 8000        |     |
|  |  shadcn/ui         |                           |                    |     |
|  +--------------------+                           +---------+----------+     |
|         Porta 5173                                          |                |
|        (dev only)                                           |                |
|                                                             |                |
|                          +----------------------------------+----------+     |
|                          |                                  |          |     |
|                          v                                  v          v     |
|             +--------------------+         +------------+  +----------+      |
|             |    DELkokoOtimized |         |  DATABASE  |  | STORAGE  |      |
|             |     TTS ENGINE     |         |   SQLite   |  |  Files   |      |
|             |                    |         |            |  |          |      |
|             |  * ONNX Runtime    |         | * Projects |  | * Models |      |
|             |  * 82M Parameters  |         | * Jobs     |  | * Audio  |      |
|             |  * 11 Vozes        |         | * Metadata |  |          |      |
|             |  * CPU Optimized   |         |            |  |          |      |
|             +--------------------+         +------------+  +----------+      |
|                                                                              |
+------------------------------------------------------------------------------+
```

## Fluxo de Processamento TTS

```
+----------+      +----------+      +----------+      +----------+      +----------+
|  TEXTO   | ---> |   API    | ---> |   TTS    | ---> |  AUDIO   | ---> |  PLAYER  |
| ENTRADA  |      | REQUEST  |      |  ENGINE  |      |   .WAV   |      |   WEB    |
+----------+      +----------+      +----------+      +----------+      +----------+
     |                 |                 |                 |                 |
     v                 v                 v                 v                 v
+----------+      +----------+      +----------+      +----------+      +----------+
| Usuario  |      | FastAPI  |      | DELkoko  |      | Storage  |      |  React   |
| digita   |      | valida   |      | processa |      | salva    |      | reproduz |
| texto    |      | request  |      | neural   |      | arquivo  |      | audio    |
+----------+      +----------+      +----------+      +----------+      +----------+

TEMPO MEDIO DE PROCESSAMENTO:
* Textos curtos (< 500 chars): ~1-2 segundos
* Textos medios (500-2000 chars): ~3-5 segundos
* Textos longos (> 2000 chars): Processamento em chunks
```

## Stack Tecnologica

```
+-----------------------------+    +-----------------------------+
|         FRONTEND            |    |          BACKEND            |
+-----------------------------+    +-----------------------------+
|                             |    |                             |
|  React 18 + TypeScript      |    |  Python 3.11+               |
|  +-- Vite (Build Tool)      |    |  +-- FastAPI                |
|  +-- React Router           |    |  +-- SQLAlchemy             |
|  +-- Tailwind CSS           |    |  +-- Uvicorn                |
|  +-- shadcn/ui              |    |  +-- aiofiles               |
|                             |    |                             |
|  Axios (HTTP Client)        |    |  ONNX Runtime               |
|  Lucide Icons               |    |  +-- CPU Optimized          |
|                             |    |  +-- Int8 Quantization      |
+-----------------------------+    +-----------------------------+

+-----------------------------+    +-----------------------------+
|      TTS ENGINE             |    |       DEPLOYMENT            |
+-----------------------------+    +-----------------------------+
|                             |    |                             |
|  DELkokoOtimized            |    |  Docker + Docker Compose    |
|  +-- 82M Parametros         |    |  +-- Backend Container      |
|  +-- ONNX Format            |    |  +-- Frontend Container     |
|  +-- 11 Vozes Naturais      |    |  +-- Nginx Container        |
|  +-- ~80MB Model Size       |    |                             |
|                             |    |  Requisitos Minimos:        |
|  Vozes Disponiveis:         |    |  +-- 4 CPU Cores            |
|  +-- 6 American English     |    |  +-- 4GB RAM                |
|  +-- 5 British English      |    |  +-- 2GB Disk               |
+-----------------------------+    +-----------------------------+
```

## Estrutura de Diretorios

```
TTS-Content-Studio/
|-- backend/
|   |-- app/
|   |   |-- api/
|   |   |   +-- routes/
|   |   |       |-- tts.py          # Rotas TTS
|   |   |       |-- projects.py     # Rotas Projetos
|   |   |       +-- jobs.py         # Rotas Jobs
|   |   |-- core/
|   |   |   |-- config.py           # Configuracoes
|   |   |   +-- tts_engine.py       # DELkokoOtimized Engine
|   |   |-- models/                 # Modelos DB
|   |   +-- main.py                 # FastAPI App
|   |-- storage/
|   |   |-- models/                 # Modelos ONNX
|   |   +-- audio/                  # Audios gerados
|   +-- requirements.txt
|
|-- frontend/
|   |-- src/
|   |   |-- components/             # UI Components
|   |   |-- pages/
|   |   |   |-- Dashboard.tsx       # Pagina inicial
|   |   |   |-- Editor.tsx          # Editor TTS
|   |   |   |-- Projects.tsx        # Lista projetos
|   |   |   +-- Jobs.tsx            # Historico
|   |   |-- services/
|   |   |   +-- api.ts              # API Client
|   |   +-- App.tsx
|   +-- package.json
|
|-- docker-compose.yml              # Deploy config
+-- README.md
```

## API Endpoints

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /api/health | Health check do sistema |
| GET | /api/stats | Estatisticas gerais |
| GET | /api/tts/voices | Lista vozes disponiveis |
| POST | /api/tts/synthesize | Gera audio completo |
| POST | /api/tts/preview | Preview rapido (200 chars) |
| GET | /api/audio/{file} | Serve arquivo de audio |
| GET | /api/projects/ | Lista projetos |
| POST | /api/projects/ | Cria novo projeto |
| GET | /api/projects/{id} | Detalhes do projeto |
| PUT | /api/projects/{id} | Atualiza projeto |
| DELETE | /api/projects/{id} | Remove projeto |
| GET | /api/jobs/ | Lista jobs de conversao |
| POST | /api/jobs/ | Cria novo job |
| GET | /api/jobs/{id} | Status do job |

## Vozes Disponiveis

| Voice ID | Nome | Genero | Sotaque |
|----------|------|--------|---------|
| af_heart | Heart | Feminino | Americano |
| af_bella | Bella | Feminino | Americano |
| af_nicole | Nicole | Feminino | Americano |
| af_sarah | Sarah | Feminino | Americano |
| af_sky | Sky | Feminino | Americano |
| am_adam | Adam | Masculino | Americano |
| am_michael | Michael | Masculino | Americano |
| bf_emma | Emma | Feminino | Britanico |
| bf_isabella | Isabella | Feminino | Britanico |
| bm_george | George | Masculino | Britanico |
| bm_lewis | Lewis | Masculino | Britanico |

## Metricas de Performance (CPU)

| Metrica | Valor Tipico |
|---------|--------------|
| Real-Time Factor (RTF) | 15-25x |
| Latencia (textos curtos) | 100-200ms |
| Throughput | ~50 requisicoes/min |
| Tamanho do Modelo | ~80MB (Int8 ONNX) |
| Uso de RAM | ~500MB |
| Uso de CPU | ~60-80% (durante sintese) |

---

**TTS Content Studio** - Powered by DELkokoOtimized Engine
*Versao 1.0.0*
