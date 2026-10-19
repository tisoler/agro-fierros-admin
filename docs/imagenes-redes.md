# Imágenes para redes

Generación desde el admin (sección "Imágenes para redes" en nueva/edición de
unidad, componente `componentes/ImagenesRedes.tsx`). Sale idéntica siempre
porque la dibuja el mismo código.

## Fuentes de datos

- Foto: la destacada = primera de la galería (`orden = 0`). Respeta su foco de escritorio.
- Título, marca, modelo, flags (nuevo/vendida/oportunidad/novedad), precio + moneda: se leen del formulario al generar.
- Isologo: `public/logos/agrofierros-horizontal.png` (exacto, en pastilla blanca).
- Las fotos del CDN se proxyean por `app/api/foto` (el Space no envía CORS).

## Formatos

| Pieza | Medida | Uso |
| --- | --- | --- |
| Post | 1080×1080 jpg q85 | Feed (sirve para ambas redes) |
| Historia | 1080×1920 jpg q85 | Historia / estado |

## Layout (ambos)

- Foto real a sangre completa arriba (sin filtros, solo recorte cover).
- Divisor naranja `#EA580C` de 10/12 px.
- Panel `#1E293B` con: pastilla blanca + isologo, badge (`Nuevo`/`Usado`, `Vendida` rojo `#DC2626`).
- Título en 2 líneas balanceadas (blanca + naranja), meta `Marca · Modelo X · Nuevo/Usado`, precio (`$`/`USD` según moneda) o dominio si no hay precio (en el post el dominio se omite cuando hay precio para no solaparse).
- Tipografía: `Helvetica, Arial, sans-serif` (bold títulos).

## Archivos de descarga

`agrofierros-{slug}-post.jpg` y `agrofierros-{slug}-historia.jpg`.

Referencia visual validada: `agrofierros-logos-final-v4/redes/` (fuera de los repos).
