# Guía: Ejecutar LM Studio en Ubuntu

Esta guía detalla los pasos para instalar y ejecutar LM Studio en un servidor Ubuntu, permitiendo que la aplicación se conecte a modelos locales.

## 1. Requisitos Previos

Asegúrate de tener instaladas las dependencias necesarias para ejecutar AppImages y el entorno gráfico virtual (si estás en un servidor sin monitor).

```bash
sudo apt update
sudo apt install -y libfuse2 libatk1.0-0 libatk-bridge2.0-0 libcairo2 libgdk-pixbuf2.0-0 libgtk-3-0 libx11-6 libnss3 libasound2 libcups2 xauth xvfb
```

## 2. Descargar LM Studio

Descarga la última versión de la AppImage desde el sitio oficial.

```bash
wget https://lmstudio.ai/downloads/linux -O LM-Studio.AppImage
chmod +x LM-Studio.AppImage
```

## 3. Instalación de la CLI (`lms`)

LM Studio ofrece una herramienta de línea de comandos para gestionar el servidor y los modelos.

```bash
npx lmstudio install-cli
```

Después de instalarlo, puede que necesites reiniciar tu terminal o ejecutar `source ~/.bashrc`.

## 4. Iniciar el Servidor API

Si estás en un entorno con interfaz gráfica, simplemente abre LM Studio y pulsa "Start Server" en la pestaña de "Local Server".

Para un entorno **Headless (Servidor sin GUI)**:

```bash
# Iniciar el servidor
lms server start

# Verificar el estado
lms status
```

El servidor por defecto corre en el puerto `1234`.

## 5. Descargar y Cargar Modelos

Para que la API responda, debes tener un modelo cargado.

```bash
# Buscar un modelo
lms get llama-3.2-3b

# Cargar el modelo en el servidor
lms load llama-3.2-3b
```

## 6. Configuración en la App

En tu archivo `.env.local`, asegúrate de tener:

```env
LLM_API_BASE_URL="http://localhost:1234/v1"
LLM_API_KEY="lm-studio"
LLM_MODEL_NAME="llama-3.2-3b" # El nombre exacto que aparece en 'lms ps'
LLM_EMBEDDING_MODEL="text-embedding-nomic-embed-text-v1.5"
```

> [!TIP]
> Si LM Studio está en una máquina diferente a la de la aplicación, cambia `localhost` por la IP local del servidor y asegúrate de que el firewall permita el tráfico en el puerto `1234`.
