# LifeOS

Organizador personal: tareas, calendario, proyectos, objetivos y progreso. Se instala en el iPhone como app, funciona sin internet y usa tu Google Calendar para los avisos.

**Abrir la app:** https://christianvargas000123-afk.github.io/LIFEOS/

## Cómo funciona

- **La app** (`index.html`) vive en GitHub Pages. Es un solo archivo HTML, CSS y JavaScript, sin dependencias.
- **Tus datos** se guardan en tu dispositivo y se sincronizan a través de **tu propio script de Google** (`apps-script/Code.gs`). Ese script guarda tus datos en su almacenamiento privado y crea los avisos en tu Google Calendar.
- En este repositorio **no hay datos personales ni claves**. La clave de tu script se genera en tu dispositivo y solo vive ahí y dentro de tu script.

## Conectar Google (una sola vez, unos 5 minutos)

1. En LifeOS abre **Ajustes → Conectar con Google** y toca **Copiar código del script**.
2. Abre https://script.google.com, crea un proyecto nuevo, borra lo que trae, pega el código y guarda.
3. **Implementar → Nueva implementación → Aplicación web**.
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
4. Autoriza con tu cuenta. Si Google avisa que la app no está verificada: **Configuración avanzada → Ir a LifeOS**. Es tu propio script.
5. Copia la **URL de la aplicación web** (termina en `/exec`) y pégala en LifeOS → **Conectar**.

**Otro dispositivo:** en uno ya conectado ve a **Ajustes → Conectar otro dispositivo → Copiar código de conexión**, y pégalo en el campo de conexión del nuevo dispositivo.

**Si cambias el script:** usa **Implementar → Gestionar implementaciones → editar → Nueva versión** para conservar la misma URL.

## Instalar en el iPhone

Abre la página en Safari → **Compartir** → **Agregar a pantalla de inicio**. La app instalada guarda sus datos aparte de Safari: conéctala con el **código de conexión**.

## Archivos

| Archivo | Para qué |
|---|---|
| `index.html` | La app completa |
| `apps-script/Code.gs` | Script de Google: calendario y almacenamiento |
| `sw.js` | Funcionamiento sin conexión |
| `manifest.webmanifest`, `icon-*.png`, `apple-touch-icon.png` | Instalación como app |
