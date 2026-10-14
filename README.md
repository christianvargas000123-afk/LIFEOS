# LifeOS

Organizador personal: tareas, calendario, proyectos, objetivos y progreso, con avisos en Google Calendar.

## Cómo funciona

- **Tu LifeOS privada** se abre desde **tu propio script de Google** (`apps-script/Code.gs`), implementado con acceso **"Solo yo"**. Google exige tu sesión para abrirla: nadie más puede entrar ni llamar al script.
- El script descarga el diseño de la app desde esta página de GitHub (así recibes mejoras sin tocar el script), guarda tus datos en su almacenamiento privado y crea los avisos en tu Google Calendar.
- En este repositorio **no hay datos personales ni claves**.

## Instalación (una sola vez, unos 5 minutos)

1. Copia el contenido de `apps-script/Code.gs`. También puedes copiarlo desde https://christianvargas000123-afk.github.io/LIFEOS/ → **Ajustes → Copiar código del script**.
2. Abre https://script.google.com/home, entra a tu proyecto (o crea uno), borra todo el código, pega el nuevo y guarda.
3. **Implementar → Nueva implementación** → engrane → **Aplicación web**.
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Solo yo**
4. Autoriza con tu cuenta. Si Google avisa que la app no está verificada: **Configuración avanzada → Ir a … → Permitir**. Es tu propio script.
5. Abre la **URL de la aplicación web** (termina en `/exec`). **Esa es tu LifeOS.**

**Si cambias el script:** **Implementar → Gestionar implementaciones → lápiz → Versión: Nueva versión → Implementar**. La URL se conserva.

## En el iPhone

Abre tu URL `/exec` en Safari con tu sesión de Google iniciada → **Compartir → Agregar a pantalla de inicio**.

## Archivos

| Archivo | Para qué |
|---|---|
| `index.html` | La app completa |
| `apps-script/Code.gs` | Tu script privado: abre la app, guarda tus datos y crea avisos |
| `sw.js`, `manifest.webmanifest`, íconos | Uso de esta página como app instalable |

## Plan de carrera (importación)

- **Ajustes → Plan de carrera → Cargar plan (JSON)** con `tareas_plan_carrera.json`. El archivo **no** se sube a este repositorio ni a ningún servicio: se guarda solo en el dispositivo donde lo cargas.
- Por el límite de 450 KB del almacenamiento privado del script, LifeOS agrega a tu lista **las próximas 4 semanas y todos los hitos**; cada día que abres la app entran las semanas siguientes.
- Volver a cargar el archivo actualiza por `id` sin duplicar y no desmarca lo hecho.
- Horario: sin miércoles; lunes, martes, jueves y viernes desde las 17:30; sábado y domingo antes de las 12:00. Si ya tienes algo a esa hora, la tarea del plan se recorre a la hora libre más próxima.
- Google Calendar: avisos solo para hitos y para la semana en curso.
