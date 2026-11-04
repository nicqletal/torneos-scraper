# S02 · UC-F02 — Consultar el tablero

Caso de uso: [UC-F02](../02-casos-de-uso.md#uc-f02--consultar-el-tablero) · Pantallas: [P2](../03-pantallas.md#p2--resumen-de-la-plataforma), [P3](../03-pantallas.md#p3--seguridad-y-acceso) y [P4](../03-pantallas.md#p4--sidebar-de-administración) · Requerimientos: RF-F08 a RF-F11

Es una consulta: no hay formulario ni desplegables.

```mermaid
sequenceDiagram
    actor Administrador
    participant PanelAdmin
    participant RolRepository
    participant EstadisticasRepository

    Administrador->>PanelAdmin: abrirResumen()
    PanelAdmin->>RolRepository: esAdministrador()
    RolRepository-->>PanelAdmin: sí, no, o error

    alt No es Administrador, no hay sesión o falló la verificación
        PanelAdmin-->>Administrador: redirigir al acceso de administrador
    else Es Administrador
        par Torneos
            PanelAdmin->>EstadisticasRepository: contarTorneos()
        and Equipos
            PanelAdmin->>EstadisticasRepository: contarEquipos()
        and Usuarios
            PanelAdmin->>EstadisticasRepository: contarUsuarios()
        end
        EstadisticasRepository-->>PanelAdmin: cantidad, o error, de cada uno

        alt Alguno falló o vino sin conteo
            PanelAdmin-->>Administrador: mostrar «No disponible» en ese contador y el aviso «No pudimos cargar todos los contadores»
        else Todos respondieron
            PanelAdmin-->>Administrador: mostrar el resumen con los tres contadores
        end

        PanelAdmin-->>Administrador: mostrar la sidebar (Resumen y Seguridad y acceso disponibles, el resto pendiente)
    end

    opt Abre «Seguridad y acceso»
        Administrador->>PanelAdmin: abrirSeguridadYAcceso()
        PanelAdmin->>RolRepository: esAdministrador()
        RolRepository-->>PanelAdmin: sí
        PanelAdmin-->>Administrador: mostrar la cuenta, el rol verificado y los controles de la etapa
    end
```

## Cómo se lee

- **El rol se verifica en cada pantalla**, no solo al entrar: el resumen y «Seguridad y acceso» llaman a `esAdministrador()` antes de mostrar nada. Si falla, se vuelve al acceso.
- **Los contadores son reales y se piden en paralelo.** Una consulta fallida muestra **«No disponible»**, **nunca un cero inventado**, y el aviso lo dice. Los contadores salen de las tablas públicas `tournaments`, `teams` y `profiles`; «Usuarios» es la cantidad de perfiles.
- **No hay datos simulados.** Las secciones Usuarios, Torneos y equipos, Reportes, Registro de actividad, Soporte, Avisos y Configuración figuran en la sidebar como pendientes, **sin enlaces**. Se retiró un placeholder «Sin reportes pendientes» porque el módulo de reportes no existe.
- «Volver al sitio» y «Cerrar sesión» (solo este dispositivo) están en la sidebar; son navegación, no casos aparte.

## Correspondencia en el código

`AdminPage` (`src/app/admin/(backoffice)/page.tsx`) llama a `requireAdmin()` y hace tres `select('id', { count: 'exact', head: true })` con `Promise.all`; `AdminSidebar` (`src/components/AdminSidebar.tsx`) define las secciones.
