# agrofierros-admin

Panel interno de administración de [AgroFierros](https://agrofierros.com.ar). Próximamente en `admin.agrofierros.com.ar`.

Uso interno (usuario único, sin roles): ABM de unidades, activar/desactivar y flags Oportunidad/Novedad, y gestión del carrusel de la home de la tienda.

## Stack

- Next.js 16 (App Router) + React 19 + Tailwind CSS 4, FE y BE en el mismo proyecto.
- Sequelize 6 + MySQL (la misma base que la tienda).
- `iron-session` para la sesión (cookie httpOnly).

## Requisitos

- Node >= 22 y pnpm (`corepack enable`).
- MySQL accesible con las tablas de la tienda + `carruselHome` (script en la tienda: `scriptsSQL/carrusel-home.sql`).

## Variables de entorno

Copiar `.env.example` a `.env` y completar:

| Variable | Descripción |
| --- | --- |
| `NEXT_PUBLIC_BD_HOST/PUERTO/USUARIO/PASSWORD/BASE` | Conexión MySQL (misma DB que la tienda) |
| `ADMIN_PASSWORD` | Contraseña del panel |
| `SESSION_SECRET` | Secreto de la sesión (mínimo 32 caracteres) |
| `TIENDA_URL` | URL base de la tienda (ej. `https://agrofierros.com.ar`) |
| `REVALIDATION_SECRET` | El mismo secreto que usa la tienda en `/api/revalidar` |

## Desarrollo

```bash
pnpm install
pnpm dev        # http://localhost:3098
```

## Producción

```bash
docker compose up --build -d    # puerto 3098
```

Nginx: copiar `agrofierros-admin.conf` al servidor (ver los `.conf` de la tienda como modelo) y asegurar certificado que cubra `admin.agrofierros.com.ar`.

## Cómo funciona

- Login con `ADMIN_PASSWORD` → sesión httpOnly de 8 horas.
- Cada mutación (unidad o carrusel) llama a `POST /api/revalidar` de la tienda con las tags correspondientes (`unidades`, `categorias`, `carrusel-home`) para invalidar el caché ISR.
- El borrado de unidades es lógico: se desactivan (`activa = false`).
- El panel no se indexa: `robots.ts` bloquea todo y las páginas llevan `noindex`.
