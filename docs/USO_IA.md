# Uso de Inteligencia Artificial

## Herramientas utilizadas

| Herramienta | Uso |
|---|---|
| Claude Code (Anthropic) | Análisis de la prueba, planificación, generación y revisión de código |

## Registro de prompts relevantes

Formato de cada entrada: qué se pidió, qué generó la IA, cómo se validó y qué se corrigió.

### 1. Análisis y planificación
- **Prompt:** "Léeme el PDF, analízamelo y créame una planificación paso a paso para responder cada uno de estos puntos."
- **Resultado:** análisis por ejercicio, stack propuesto y plan por pasos con tiempos estimados.
- **Ajuste propio:** se definió Angular + NgRx para el frontend (decisión propia, no de la IA).

### 2. Preparación del repositorio (Paso 0)
- **Prompt:** "Comienza con el paso 0" (con Docker).
- **Resultado:** estructura del monorepo, `docker-compose.yml` con MongoDB, `.gitignore`, `.env.example`, README base.
- **Validación:** se levantó MongoDB con `docker compose up -d` y se verificó el healthcheck.
- **Decisiones revisadas:** puerto de Mongo expuesto solo en `127.0.0.1`; `.env` excluido del repositorio.

## Correcciones y validaciones destacadas

_(Se completa durante el desarrollo: errores detectados en el código generado y cómo se corrigieron.)_
