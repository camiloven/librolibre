# 📚 LibroLibre - Plataforma Editorial y Librería Digital

**LibroLibre** es una plataforma moderna de publicación directa para autores y librería digital orientada al mercado chileno e hispanohablante. Permite a los autores publicar sus obras, gestionar ventas, recibir transferencias directas (BancoEstado CuentaRUT, Mercado Pago) y entregar descargas protegidas de libros en formatos PDF, EPUB y MOBI.

---

## ✨ Características Principales

- **📖 Catálogo y Tienda Digital**: Exploración por categorías, búsqueda en tiempo real, vista previa de capítulos y sinopsis.
- **⚡ Descarga Real de Libros**: Sistema de entrega y descarga de archivos de libros originales (PDF, EPUB, MOBI) directo al navegador con headers HTTP `attachment`.
- **✍️ Estudio del Autor (Author Studio)**:
  - Publicación y edición de libros en vivo.
  - Subida directa de archivos digitales (PDF/EPUB) asociados a cada publicación.
  - Métricas de ventas, lectores y regalías.
- **💳 Pasarela de Pagos Localizada**:
  - Soporte para **BancoEstado CuentaRUT** (instrucciones de transferencia bancaria directa y comprobante).
  - Integración simulada de **Mercado Pago** y tarjetas de débito/crédito.
- **📱 PWA & Lector Integrado**: Experiencia instalable como Progressive Web App y visor de lectura en pantalla.
- **🔥 Firebase Firestore**: Persistencia en la nube de catálogo, autores y compras.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Node.js, Express.js (gestión de descargas, carga de archivos y API REST).
- **Base de Datos**: Google Cloud Firestore & Firebase Auth.
- **Empaquetador**: Vite.

---

## 🚀 Instalación y Puesta en Marcha Local

### Prerrequisitos
- Node.js 18+ instalado
- npm o bun

### 1. Clonar el repositorio
```bash
git clone https://github.com/<TU_USUARIO>/<TU_REPO>.git
cd <TU_REPO>
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Variables de entorno (Opcional)
Copia el archivo de ejemplo si necesitas configurar variables personalizadas:
```bash
cp .env.example .env
```

### 4. Iniciar en modo desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:3000`.

---

## 📤 Cómo Subir a tu Cuenta de GitHub

Si deseas subir este proyecto a un nuevo repositorio en tu GitHub:

1. Crea un nuevo repositorio en [GitHub](https://github.com/new) (por ejemplo: `librolibre`). **No** lo inicialices con README ni .gitignore (ya están incluidos aquí).
2. En la terminal de este proyecto, ejecuta:

```bash
# 1. Vincular tu repositorio remoto de GitHub
git remote add origin https://github.com/<TU_USUARIO>/librolibre.git

# 2. Renombrar la rama a main (si no lo está ya)
git branch -M main

# 3. Subir todos los archivos
git push -u origin main
```

*(Si utilizas autenticación con Personal Access Token o SSH, reemplaza la URL por `git@github.com:<TU_USUARIO>/librolibre.git`)*

---

## 🌐 Ver la Aplicación en la Web

### 1. Enlace Directo en Vivo (Cloud Run / AI Studio)
Puedes acceder y probar la aplicación directamente en cualquier navegador o dispositivo móvil:
- **Enlace de Producción Compartido**: [Ver App en la Web](https://ais-pre-y743rpc6d6675xqcq42iot-289584158697.us-east5.run.app)
- **Enlace de Desarrollo en Vivo**: [Ver App Dev](https://ais-dev-y743rpc6d6675xqcq42iot-289584158697.us-east5.run.app)

---

## ☁️ Publicar en la Web Gratis desde GitHub (Hosting Propio)

Como la aplicación cuenta con un servidor backend Express para la gestión de descargas y carga de archivos, puedes desplegarla gratis en 1 clic:

### Opción A: Render (Recomendada)
1. Entra a [render.com](https://render.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **New +** > **Web Service**.
3. Selecciona tu repositorio `camiloven/librolibre`.
4. El archivo `render.yaml` ya configurado se encargará del build (`npm install && npm run build`) y el start (`npm start`).
5. ¡Listo! Render te dará una URL pública tipo `https://librolibre.onrender.com`.

### Opción B: Railway o Koyeb
1. Conecta tu repositorio de GitHub `camiloven/librolibre`.
2. Detectará automáticamente Node.js y ejecutará `npm start`.

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
