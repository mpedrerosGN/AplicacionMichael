# Impulso — nutrición y fútbol

Aplicación personal **mobile-first** (Alpine.js + Tailwind CSS + Vite + Supabase + Netlify). No necesita Laravel en la primera versión; Laravel podría añadirse como API externa en una segunda etapa, en un hosting PHP separado.

## 1. Desarrollo local (Windows / VS Code)

Instala Node.js 22+ y Git. En una terminal:

```bash
npm install
cp .env.example .env
npm run dev
```

En PowerShell usa `Copy-Item .env.example .env` en vez de `cp`. Abre la URL que muestre Vite, normalmente `http://localhost:5173`. Puedes probar la interfaz **sin Supabase**, en modo local. No abras `index.html` con doble clic: usa el servidor Vite.

## 2. Supabase (opcional para sincronización)

1. Crea un proyecto en https://supabase.com/.
2. En **SQL Editor**, ejecuta `sql/schema.sql` completo. Este paso activa RLS y evita que usuarios lean datos ajenos.
3. En **Project Settings > API**, copia la URL del proyecto y la clave **publishable/anon**. **Nunca uses `service_role` ni una clave secreta en el frontend**.
4. Completa `.env`:

```dotenv
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_CLAVE_PUBLICA
```

5. Reinicia Vite. Ve a Ajustes > Crear cuenta. Si Supabase requiere confirmación de correo, confírmala.
6. En Supabase > Authentication > URL Configuration, configura **Site URL** con tu dominio de Netlify y agrega las URLs locales/de despliegue autorizadas.

**Importante:** El modo local y el modo nube son independientes: los datos locales no se migran automáticamente. No almacenes información médica de terceros. Protege tu cuenta con contraseña robusta.

## 3. GitHub

```bash
git init
git add .
git commit -m "Primera versión Impulso"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
git push -u origin main
```

`.env` está ignorado por Git. El workflow `.github/workflows/build.yml` verifica que cada push y pull request compile. GitHub **no reemplaza** localhost: desarrolla con Vite y usa los Deploy Previews de Netlify para revisar ramas.

## 4. Netlify

1. Netlify > Add new project > Import an existing project > GitHub.
2. Selecciona el repositorio.
3. Build command: `npm run build`; publish directory: `dist` (ya están en `netlify.toml`).
4. Agrega `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Environment variables.
5. Deploy. Cada push a `main` actualiza el sitio; los pull requests pueden generar Deploy Previews.

**No se debe subir directamente `index.html` a Netlify sin compilar:** Tailwind y Alpine se empaquetan con Vite. Si deseas publicar manualmente, ejecuta `npm run build` y sube la carpeta `dist`.

## 5. Instalar en el celular

Abre el sitio publicado por HTTPS desde Chrome/Edge Android > Instalar aplicación, o Safari iPhone > Compartir > Añadir a pantalla de inicio. La PWA funciona como acceso directo instalable; no es una app nativa de Play Store/App Store. Para iconos iOS y compatibilidad PWA más amplia conviene añadir PNG de 192 y 512 px en la próxima versión.

## 6. Funciones disponibles

- Resumen diario de calorías y macronutrientes.
- Comidas con entrada manual y precarga editable del desayuno de ejemplo.
- Peso e historial.
- Registro de entrenamientos y fútbol.
- Checklist de suplementos sin dosis médicas automáticas.
- Objetivos distintos para días con/sin fútbol.
- Supabase Auth + PostgreSQL con Row Level Security.
- Modo local de demostración y exportación JSON de respaldo.
- PWA básica y diseño responsive.

## Limitaciones conocidas / siguientes iteraciones

- La estimación nutricional se ingresa manualmente; aún no hay base de datos de alimentos ni lector de códigos de barra.
- Los objetivos de macros son independientes y **no se recalculan automáticamente** al cambiar las calorías; ajustarlos según el plan.
- No hay gráficos históricos ni calendario de partidos en esta primera versión.
- El modo nube requiere conexión para guardar cambios; no hay cola offline para sincronización posterior.
- La precarga del desayuno es una estimación: confirmar cantidad de huevos, aceite y tortilla.
- El almacenamiento local del navegador no es un respaldo seguro ni privado en dispositivos compartidos. La app no reemplaza asesoría nutricional profesional.
