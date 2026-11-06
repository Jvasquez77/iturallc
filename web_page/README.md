# iTura studio — Landing page

Sitio estático de **iTura studio**, estudio de arquitectura e interiorismo.
HTML, CSS y JavaScript sin framework ni paso de build. Tipografía Jost (Google Fonts, pesos 300, 400 y 500).
No tiene dependencias.

## Ver en local

```bash
cd "/Users/jvasquez/Desktop/Landings Page/itura.studio/web_page"
python3 -m http.server 8000
```

Después abre <http://localhost:8000>. También se puede abrir `index.html` directamente, pero con el servidor
el manifest y las rutas se comportan igual que en producción.

## Estructura

```
web_page/
├── index.html
├── manifest.webmanifest · robots.txt · sitemap.xml
├── components/          nav · hero · portfolio · about · values · process · contact · footer (.css)
└── assets/
    ├── css/             variables.css (tokens de marca) · styles.css (base, temas, botones, animaciones)
    ├── js/main.js       navegación, sección activa, animaciones, formulario y CONFIG
    └── images/
        ├── brand/       logos/ · favicon/ · iconos/ · patrones/ · og-image-1200x630.png
        └── portfolio/   fotos reales en WebP + JPG, dos anchos cada una
```

Todas las rutas son relativas a `web_page/`. Los archivos de marca se copiaron desde `brand-web/` del kit;
el sitio no apunta a ninguna carpeta exterior.

## Formulario (Formspree)

**Estado (6 nov 2026):** activo con el endpoint `https://formspree.io/f/xqppoavv`
(`CONFIG.formspreeId: 'xqppoavv'` en `assets/js/main.js`). Faltan los pasos 4 y 5.

Si `CONFIG.formspreeId` vuelve a `null`, el formulario sigue validando los datos y, al enviar, muestra un aviso
con un enlace `mailto:info@itura.studio` que ya lleva el asunto y el mensaje escritos. El envío nunca falla en silencio.

Pasos de activación:

1. ✔ En Formspree, crear un formulario nuevo llamado **"iTura studio · Contacto"** con destino **info@itura.studio**.
2. Confirmar el correo de verificación que llega a esa bandeja (si no se hizo al crear el formulario).
3. ✔ Pegar el ID en `CONFIG.formspreeId`. El ID es la parte final del endpoint `https://formspree.io/f/<ID>`.
4. Hacer un envío de prueba y comprobar que llega a info@itura.studio con el asunto
   "Nuevo contacto web · iTura studio".
5. Desactivar el formulario viejo **'mrevpogj'**, que envía al correo anterior.

Qué recibe Formspree en cada envío: `name`, `email`, `areaCode`, `phone`, `subject`, `message`, `captchaSlider`,
`_subject` ("Nuevo contacto web · iTura studio"), `_replyto` (el email de quien escribe) y `_gotcha`
(campo trampa oculto: si llega relleno, Formspree descarta el mensaje).

Lógica que se conserva del sitio anterior: validación de cada campo al salir de él, captcha deslizante hasta 100,
espera máxima de 10 s por intento con 1 reintento ante errores de red o 5xx, y mensajes de envío correcto o con error.
`CONFIG` mantiene también las alternativas EmailJS y API propia, vacías. El SDK de EmailJS no se carga:
si algún día se usa, hay que añadir su `<script>` antes de `main.js`.

## Dominio (pendiente de confirmar)

El sitio usa `https://itura.studio/` en cinco lugares: `canonical`, `og:url` y `og:image` en `index.html`,
`robots.txt` y `sitemap.xml`. El manual de marca v4 escribe `iturastudio.com`.
Si el dominio final es otro, cambia esos cinco valores:

```bash
grep -rn "https://itura.studio" index.html robots.txt sitemap.xml
```

## Imágenes

- Solo fotos reales del sitio anterior. Nada de bancos de imágenes.
- Cada foto se sirve con `<picture>`: WebP y JPG de respaldo, `srcset` con dos anchos, `width` y `height`
  declarados y carga diferida salvo en el hero.
- Recortes aplicados:
  - **Hero**: mitad "Después" de `proyecto-01`, sin la etiqueta grabada en la foto.
  - **Proyectos**: 6 px por lado para quitar las esquinas redondeadas que traían grabadas (la marca no usa esquinas redondeadas).
  - **Retrato** de la fundadora: formato 4:5.
- Las fotos originales miden unos 720 px de ancho. El manual pide hasta 2400 px: conviene sustituirlas por
  versiones en alta resolución con el mismo nombre.

### Añadir un proyecto (03, 04, conceptos)

1. Copia la foto en `assets/images/portfolio/` y genera las variantes (en macOS, `cwebp` vía Homebrew):
   ```bash
   cwebp -q 80 -m 6 -metadata none proyecto-XX.jpg -o proyecto-XX.webp
   cwebp -q 80 -m 6 -metadata none -resize 400 0 proyecto-XX.jpg -o proyecto-XX-400.webp
   sips --resampleWidth 400 proyecto-XX.jpg --out proyecto-XX-400.jpg
   ```
2. En `index.html`, duplica un bloque `<article class="project-card">` dentro de `.portfolio__grid`,
   cambia las rutas, `width`/`height` (medidas reales de la foto), el número, el nombre, la ciudad,
   la tipología, el año y el texto alternativo.
3. Si hay más de dos tarjetas, revisa el escalonado de `.project-card:nth-child(2)` en `components/portfolio.css`.

No enlaces fotos que todavía no existen.

## Marca aplicada

- Nombre siempre **iTura studio**. Nunca va en mayúsculas por CSS: el copyright no usa `text-transform`.
- Logos: solo los SVG maestros. Horizontal carbón en la cabecera y wordmark marfil-latón en el pie.
  La cabecera mide lo justo para respetar el área de protección (altura de la "x"), con 122 px de dibujo
  en móvil y 134 px en escritorio (mínimo: 120 px).
- Color: `assets/css/variables.css` empieza con `brand-web/tokens/tokens.css` sin cambios.
  El latón solo es texto sobre carbón (6,6 : 1); sobre claro solo aparece como detalle (cuadrado, filete).
  Sin degradados ni sombras.
- Tipografía: display 44–72 px Light, H2 32/40 Light, texto 17/28 Light, etiquetas 12 px Medium en mayúsculas con 0,3 em.
- Retícula de 12 columnas, contenedor de 1200 px y separación de 24 px. Sin esquinas redondeadas
  (también el tirador del captcha, que es un cuadrado de latón).
- Patrón de pórticos: solo en la franja del pie (`portico-franja_laton.svg`).

## Animaciones

Todas respetan `prefers-reduced-motion`: con movimiento reducido, el contenido aparece directamente.

- Entrada del hero: la foto sube como una cortina y se asienta, el título sube línea a línea y el resto aparece en cascada.
- Aparición al hacer scroll (`reveal`, `reveal-up`, `reveal-left`, `reveal-right`, las del sitio anterior),
  además de `reveal-media` (cortina en fotos) y `reveal-wipe` (barrido de la franja de pórticos).
- Filetes de latón en los valores y conectores del proceso que se dibujan al aparecer.
- Botones con relleno que sube desde la base, subrayado de latón en la navegación y sección activa marcada al hacer scroll.
- Menú móvil: panel lateral con velo carbón al 50 % y enlaces escalonados.

Si no hay JavaScript, nada queda oculto: las animaciones de aparición solo actúan cuando `<html>` tiene la clase `js`.

## Publicación

Al subirlo a un hosting conviene activar compresión (gzip o brotli) y cabeceras de caché para `assets/`.
Lighthouse no puede medirlas con el servidor local.

## Pendientes

- **Formspree**: envío de prueba con el formulario nuevo (`xqppoavv`) y desactivar el viejo `'mrevpogj'` (ver "Formulario").
- **Dominio** `itura.studio` sin confirmar; el manual usa `iturastudio.com`.
- **Usuario de Instagram** `@itura.studio` sin confirmar (enlace en contacto y en el menú móvil).
- **Proyectos**: nombre, ciudad, tipología y año de 01 y 02 (en `index.html` están marcados con `data-pendiente`).
  Los textos alternativos describen lo que se ve en la foto; falta añadirles nombre, ciudad y año.
- **Más fotos**: proyectos 03, 04 y conceptos, y versiones en alta resolución de las actuales.
- **Textos del proceso**: las frases de cada paso son ejemplos de tono del manual (pág. 11); falta confirmarlas.
