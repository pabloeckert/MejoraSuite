# Configuración de Google Calendar en MejoraCRM

Para habilitar la sincronización de interacciones con Google Calendar, debés seguir estos pasos en la [Google Cloud Console](https://console.cloud.google.com/).

## 1. Crear un Proyecto
1. Ingresá a la Google Cloud Console.
2. Creá un nuevo proyecto llamado `MejoraCRM`.

## 2. Habilitar la API de Google Calendar
1. En el menú lateral, andá a **APIs y servicios** > **Biblioteca**.
2. Buscá `Google Calendar API` y hacé clic en **Habilitar**.

## 3. Configurar la Pantalla de Consentimiento OAuth
1. Andá a **APIs y servicios** > **Pantalla de consentimiento de OAuth**.
2. Seleccioná **External** (Externo) y completá los datos básicos (Nombre de la app, email de soporte).
3. En **Permisos (Scopes)**, agregá: `https://www.googleapis.com/auth/calendar.events`.
4. Agregá tu email como **Usuario de prueba** (mientras la app esté en modo Testing).

## 4. Crear Credenciales
1. Andá a **APIs y servicios** > **Credenciales**.
2. Hacé clic en **Crear credenciales** > **ID de cliente de OAuth**.
3. Tipo de aplicación: **Aplicación web**.
4. **Orígenes de JavaScript autorizados**:
   - `http://localhost:5173` (Desarrollo)
   - `https://tu-dominio.vercel.app` (Producción)
5. **URIs de redireccionamiento autorizados**:
   - `http://localhost:5173`
   - `https://tu-dominio.vercel.app`
6. Copiá el **ID de cliente** generado.

## 5. Configurar Variables de Entorno
En tu archivo `.env` (o en la configuración de Vercel), agregá:

```env
VITE_GOOGLE_CLIENT_ID=tu-id-de-cliente.apps.googleusercontent.com
```

## 6. Uso en la Aplicación
1. Reiniciá el servidor de desarrollo.
2. Andá a **Configuración** en MejoraCRM.
3. Hacé clic en **Conectar** en la sección de Google Calendar.
4. Una vez conectado, verás el ícono de calendario en el historial de clientes y una opción para sincronizar al registrar nuevas interacciones.
