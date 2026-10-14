# AU Originals · by Ale Urdaneta

Catálogo web de perfumes originales con bolsa de compra y pedidos por WhatsApp.
Sitio estático (HTML, CSS y JS, sin dependencias), listo para GitHub Pages e instalable como app (PWA).

## Estructura

```
index.html        Página: hero, colecciones, catálogo, guía, la casa, cómo pedir
config.js         ← WhatsApp, tasa del día (Bs/$), Instagram, saludo
catalogo.js       ← Los 96 perfumes: marca, nombre, presentación, tamaño, género, stock, precio, imagen
css/styles.css    Diseño "Medianoche" (cielo estrellado, vitrina con foco y reflejo)
js/frascos.js     Dibuja un frasco ilustrado para cada perfume que no tenga foto
js/app.js         Filtros, búsqueda, ficha, bolsa y mensaje de WhatsApp
sw.js             Service worker (modo sin conexión)
manifest.json     Datos de la app instalable
images/           og-image.jpg y carpeta perfumes/ para fotos reales
```

## Tareas habituales

**WhatsApp e Instagram** — ya configurados en `config.js` (`584247071667` y `@auoriginals`).
Si cambian, edita `config.js` y también el texto del anuncio superior en `index.html`.

**Tasa euro BCV (automática)** — la página consulta la tasa oficial del euro del BCV en
[DolarApi Venezuela](https://ve.dolarapi.com/v1/euros/oficial) al abrirse y cada 30 minutos,
y recalcula todos los precios en Bs. Si no hay conexión, usa la última tasa obtenida;
si nunca pudo obtenerla, usa `tasaBs` de `config.js`.
Para fijar una tasa a mano, pon `tasaAutomatica: false` y escribe el valor en `tasaBs`.

**Cambiar precio o existencias** — en `catalogo.js`, busca el perfume y cambia `precio` o `stock`.
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
