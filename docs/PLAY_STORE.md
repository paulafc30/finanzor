# Publicar Finanzor en Play Store (checklist)

Finanzor es una PWA. Para Play Store se empaqueta como **TWA** (Trusted Web
Activity): un APK finísimo que abre tu web instalada a pantalla completa,
sin barra de navegador. Google verifica que el APK y la web son "el mismo
dueño" mediante `assetlinks.json`.

Dominio elegido: **`finanzor.ferava.es`** (subdominio propio, en vez de
`ferava.es/finanzor`, para que `/.well-known/` no choque con el portfolio).

## 1. Configurar el dominio en Vercel

1. En el proyecto de Finanzor en Vercel → **Settings → Domains** → añade
   `finanzor.ferava.es`.
2. Vercel te da un registro CNAME (algo como `cname.vercel-dns.com`).
   Añádelo en el DNS de `ferava.es` (donde tengas el dominio registrado):
   ```
   Tipo:  CNAME
   Host:  finanzor
   Valor: cname.vercel-dns.com
   ```
3. Espera a que Vercel marque el dominio como verificado (puede tardar
   unos minutos a unas horas según el DNS).
4. Comprueba que `https://finanzor.ferava.es/manifest.webmanifest` y
   `https://finanzor.ferava.es/privacidad.html` cargan bien.

## 2. Política de privacidad — ya lista

Está en `public/privacidad.html`, se sirve en
`https://finanzor.ferava.es/privacidad.html` y hay un enlace desde
Ajustes → Política de privacidad dentro de la app. Esta URL es la que
pegarás en Play Console (Store presence → Privacy policy).

Revisa el contenido si añades nuevos servicios de terceros (analítica,
publicidad, etc.) — ahora mismo solo lista Supabase, OneSignal y
Web3Forms.

## 3. Iconos — ya listos

`icon-192.png`, `icon-192-maskable.png`, `icon-512.png` y
`icon-512-maskable.png` están en `public/` y referenciados en
`manifest.webmanifest`. Bubblewrap los reutiliza automáticamente al leer
el manifest.

## 4. Generar el proyecto Android con Bubblewrap

Con el dominio ya funcionando en producción:

```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://finanzor.ferava.es/manifest.webmanifest
```

Te preguntará varias cosas; las más importantes:

- **Application ID** (package name): usa `es.ferava.finanzor` (coincide
  con el placeholder ya puesto en `assetlinks.json`) o el que prefieras,
  pero luego tienes que actualizar `public/.well-known/assetlinks.json`
  con el mismo valor exacto.
- **Signing key**: si es tu primer APK, deja que Bubblewrap genere una
  keystore nueva. **Guarda ese archivo `.keystore` y su contraseña en un
  sitio seguro (gestor de contraseñas), no en el repo** — si lo pierdes no
  podrás volver a actualizar la app en Play Store con el mismo listing.

## 5. Obtener la huella SHA-256 y completar assetlinks.json

```bash
keytool -list -v -keystore ruta/a/tu.keystore -alias tu-alias
```

Copia el valor de `SHA256:` (formato `AA:BB:CC:...`) y sustitúyelo en
`public/.well-known/assetlinks.json`, junto con el `package_name` real si
usaste uno distinto a `es.ferava.finanzor`. Haz commit y deploy —
Vercel sirve ese archivo automáticamente desde `public/`.

Verifica que quedó accesible:
```
https://finanzor.ferava.es/.well-known/assetlinks.json
```

Y valida la vinculación con la herramienta oficial de Google:
```
https://developers.google.com/digital-asset-links/tools/generator
```

## 6. Compilar el APK/AAB

```bash
bubblewrap build
```

Genera un `.aab` (Android App Bundle), que es lo que se sube a Play
Console.

## 7. Play Console

1. Crea la app en [Play Console](https://play.google.com/console).
2. **Store listing**: nombre, descripción corta/larga, capturas de
   pantalla (puedes generarlas abriendo la app en el móvil o con
   DevTools en modo responsive), icono 512x512, feature graphic.
3. **Privacy policy**: pega `https://finanzor.ferava.es/privacidad.html`.
4. **Data safety form**: declara qué datos recoge la app (email, datos
   financieros introducidos por el usuario) y que no se comparten con
   terceros para publicidad — coherente con `privacidad.html`.
5. **App content**: clasificación de contenido, público objetivo (no
   dirigida a niños), declaración de cuentas y borrado de datos — di que
   sí, ofreces borrado de cuenta completo desde dentro de la app
   (Ajustes → Eliminar cuenta, ya implementado con la Edge Function
   `delete-account`).
6. Sube el `.aab`, completa el resto de secciones obligatorias y envía a
   revisión (primera versión suele tardar más, revisiones internas o de
   producción abierta son más rápidas).

## Pendiente / a decidir más adelante

- Términos de uso (opcional, recomendable dado que maneja datos
  financieros).
- Capturas de pantalla y feature graphic para el listing.
- Elegir pista de publicación inicial (recomendado: **Internal testing**
  primero, con tu cuenta y la de familiares, antes de abrir a producción).
