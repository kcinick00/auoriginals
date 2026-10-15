# AU Originals · by Ale Urdaneta

Catálogo web de perfumes originales con bolsa de compra y pedidos por WhatsApp.
Sitio estático (HTML, CSS y JS, sin dependencias), listo para GitHub Pages e instalable como app (PWA).

## Estructura

```
index.html        Página: hero, colecciones, catálogo, guía, la casa, cómo pedir
config.js         ← WhatsApp, tasa euro BCV (respaldo), Instagram, saludo
catalogo.js       ← Los 96 perfumes: marca, nombre, presentación, tamaño, género, stock, precio, imagen
css/styles.css    Diseño "Medianoche" (cielo estrellado, vitrina con foco y reflejo)
js/frascos.js     Dibuja un frasco ilustrado para cada perfume que no tenga foto
js/app.js         Filtros, búsqueda, ficha, bolsa y mensaje de WhatsApp
admin.html        ← PANEL PRIVADO para editar precios, existencias y fotos desde el teléfono
js/admin.js       Lógica del panel (guarda en GitHub)
css/admin.css     Estilos del panel
admin.webmanifest Permite instalar el panel como app aparte ("AU Admin")
sw.js             Service worker (modo sin conexión)
manifest.json     Datos de la app instalable
images/           og-image.jpg y carpeta perfumes/ para fotos reales
```

## Panel de administración (editar desde el teléfono)

`admin.html` es una página aparte, **sin ningún enlace desde la tienda**, con `noindex` para que
Google no la muestre. Los clientes ven `https://tu-sitio/` y tú entras a `https://tu-sitio/admin.html`.

Con el panel puedes, desde el celular:
- cambiar **precios** y **existencias** directo en la lista (toca el precio, o usa − / +);
- **tomar o elegir una foto** de cada perfume (se reduce sola y puede quitar el fondo blanco);
- **subir muchas fotos de una vez**: botón de fotos en la barra superior; cada archivo se asigna al perfume cuyo nombre coincide (`lattafa-asad.jpg`);
- corregir nombre, marca, presentación o colección, y **agregar perfumes nuevos**;
- ver **sin foto**, **agotados** y **con cambios** con un toque en los filtros.

Los cambios quedan guardados en el teléfono hasta que tocas **Publicar**. Al publicar, el panel guarda
`catalogo.js` y las fotos en el repositorio y GitHub Pages actualiza la tienda en 1 o 2 minutos.

### Configuración (una sola vez)

1. Sube este repositorio a GitHub y activa **Settings → Pages** (ver más abajo).
2. En GitHub crea un token: **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
   - *Repository access*: **Only select repositories** → solo el repositorio de AU Originals.
   - *Permissions → Repository permissions → Contents*: **Read and write**.
3. Abre `https://tu-sitio/admin.html` en el teléfono, toca el engranaje, escribe `usuario/repositorio`, pega el token y toca **Probar y guardar**.
4. Para tenerlo como app: en el navegador del teléfono, **Agregar a pantalla de inicio**. Aparece como **AU Admin**, con su propio ícono.

### Seguridad

- Sin el token, el panel solo permite mirar: nadie puede publicar cambios aunque encuentre la página.
- El token se guarda solo en el navegador de tu teléfono. No lo pegues en un teléfono que no sea tuyo y no lo compartas.
- El token solo tiene acceso a este repositorio. Si pierdes el teléfono, revócalo en GitHub y crea otro.
- Si publicas desde dos teléfonos a la vez, el panel vuelve a leer el catálogo antes de guardar, así que no se pisan los cambios de otros perfumes.

## Tareas habituales

**WhatsApp e Instagram** — ya configurados en `config.js` (`584124721159` y `@auoriginals`).
Si cambian, edita `config.js` y también el texto del anuncio superior en `index.html`.

**Tasa euro BCV (automática)** — la página consulta la tasa oficial del euro del BCV en
[DolarApi Venezuela](https://ve.dolarapi.com/v1/euros/oficial) al abrirse y cada 30 minutos,
y recalcula todos los precios en Bs. Si no hay conexión, usa la última tasa obtenida;
si nunca pudo obtenerla, usa `tasaBs` de `config.js`.
Para fijar una tasa a mano, pon `tasaAutomatica: false` y escribe el valor en `tasaBs`.

**Cambiar precio o existencias a mano** — lo normal es usar el panel; si prefieres, en `catalogo.js` busca el perfume y cambia `precio` o `stock`.
Con `stock: 0` aparece como *Agotado*; con `1`, como *Última unidad*.

**Agregar un perfume** — copia una línea de `catalogo.js` y cambia los datos (el `id` debe ser único).

**Poner fotos reales** — sube la foto a `images/perfumes/` y escribe la ruta en `imagen`:
```js
"imagen": "images/perfumes/lattafa-asad.jpg"
```
Fotos con fondo transparente (PNG) o claro y en vertical se ven mejor.

**Después de cada cambio** sube el número de `CACHE_NAME` en `sw.js` (por ejemplo `v1.0` → `v1.1`) para que los clientes vean la versión nueva.

## Publicar en GitHub Pages

```bash
git remote add origin https://github.com/<usuario>/au-originals.git
git push -u origin main
```
Luego en GitHub: **Settings → Pages → Branch: main / root**.
Para un dominio propio, crea un archivo `CNAME` con el dominio (por ejemplo `auoriginals.com`).

## Créditos

Basado en la estructura de [ricodelico](https://github.com/kcinick00/ricodelico) (PWA estática con pedidos por WhatsApp), rediseñado para perfumería.
Tipografías: Bodoni Moda y Jost (Google Fonts).

## Apariencia (modelo, colores y letras)

Desde `admin.html` toca el botón de la **paleta de colores** (arriba). Allí puedes, con vista previa al instante:
- elegir el **modelo de página**: Sello (logo grande a la derecha), Centrado o Compacto;
- elegir la **combinación de colores** (Violeta, Medianoche, Rosa y oro, Esmeralda, Negro y oro, Marfil) o crear una **personalizada** con 4 colores;
- elegir la **letra** de los títulos y del texto (Roboto por defecto, y otras 11 de Google Fonts);
- mostrar u ocultar el carrusel, la cinta de marcas y los números, y cambiar la frase de la portada.

Al tocar **Publicar apariencia** el panel guarda `ajustes.js` en el repositorio. También puedes editarlo a mano
(las opciones están explicadas en el encabezado del archivo). `js/tema.js` es quien aplica esos ajustes en la tienda.
Para probar sin publicar: `index.html?vista={"paleta":"rosa","modelo":"centrado"}`.

## Logo y estilo

El logo se elige en **admin → Apariencia → Logo** (emblema, círculo, monograma o frasco), o a mano con `"logo"` en `ajustes.js`. Los archivos están en `images/logos/`.

- El logo es `images/logo.svg`: un frasco con las letras AU, de **un solo color** (toma el color de acento de la paleta elegida).
  Para cambiarlo, reemplaza ese archivo por otro SVG de una sola forma/color (cualquier color, solo se usa su silueta).
- Los íconos de la app (`icon-*.png`) y `images/og-image.jpg` se generaron con ese mismo logo.
- Las fotos reales de cada perfume se muestran sobre un pedestal del color suave de la paleta; el fondo blanco de la foto se funde solo.
