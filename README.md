# Gestor de Finanzas para Equipos Amateur

Aplicacion web mobile-first para gestionar las finanzas de equipos amateur. Reemplaza el uso de Excel y WhatsApp para llevar cuentas. Funciona como una cuenta corriente por jugador dentro de cada grupo.

[Ver demo](https://gestor-finanzas-equipos.vercel.app) &nbsp;·&nbsp; [Repositorio](https://github.com/mjfernandez-dev/gestor-finanzas-equipos)

## Funcionalidades

**Para el administrador**
- Crear y editar grupos (nombre y alias/CBU de cobro)
- Registrar gastos: distribucion general, por asistencia o manual por jugador
- Ver saldos de todos los miembros ordenados por deuda
- Aprobar o rechazar pagos reportados por los jugadores
- Invitar miembros via link unico
- Crear jugadores virtuales (sin cuenta en la app)

**Para el jugador**
- Ver su saldo actual (positivo o negativo)
- Ver historial de movimientos
- Reportar un pago realizado (transferencia o efectivo)
- Ver el alias/CBU del grupo para saber a donde pagar

## Stack tecnologico

| Categoria | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript |
| UI | React 19 + Tailwind CSS v4 |
| Base de datos | Supabase (PostgreSQL) |
| Autenticacion | Supabase Auth — Google OAuth |
| Hosting | Vercel |

## Arquitectura y conceptos aplicados

- **Server Components + Client Components** — las paginas cargan datos en el servidor, los componentes interactivos son `'use client'`
- **SSR-safe Supabase client** — cliente separado para server (`@supabase/ssr`) y browser
- **Sistema de roles** (admin / member) con dashboards diferenciados por rol
- **Invitaciones via token** — cada grupo tiene un `invite_token` UUID unico; el link `/invite/[token]` maneja el flujo completo de auth + registro
- **Jugadores virtuales** — miembros sin `user_id`, gestionados manualmente por el admin
- **Modelo de cuenta corriente** — el saldo se calcula como `sum(creditos) - sum(debitos)` sobre transacciones aprobadas
- **Flujo de conciliacion** — los pagos quedan en estado `pending` hasta que el admin los aprueba o rechaza
- **Multi-grupo** — un usuario puede pertenecer a multiples grupos y cambiar entre ellos desde el dashboard

## Modelo de datos

```
profiles       → usuarios (id, email, name, avatar_url)
groups         → grupos (name, payment_alias, invite_token, created_by)
group_members  → membresia (group_id, user_id, display_name, role, is_virtual)
transactions   → movimientos (group_id, member_id, type, amount, status, payment_method)
```

## Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Correr localmente

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).
