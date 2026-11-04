# S02 · UC-E02 — Ver mis torneos (Panel de organizador)

Caso de uso: [UC-E02](../02-casos-de-uso.md#uc-e02--ver-mis-torneos-panel-de-organizador) · Pantallas: [P1](../03-pantallas.md#p1--mis-torneos) y [P3](../03-pantallas.md#p3--gestión-del-torneo) · Requerimientos: RF-E12 a RF-E15

Es una consulta: no hay formulario ni desplegables.

```mermaid
sequenceDiagram
    actor Organizador
    participant PanelTorneos
    participant GestionTorneo
    participant TorneoRepository

    Note over Organizador,PanelTorneos: Sin sesión, la pantalla redirige al login y conserva /mis-torneos como destino
    Organizador->>PanelTorneos: abrirMisTorneos()
    PanelTorneos->>TorneoRepository: listarTorneosPropios(usuario)
    Note over TorneoRepository: Estado, cupos e inscriptos se calculan al leer
    TorneoRepository-->>PanelTorneos: torneos del organizador, o error

    alt Sin torneos
        PanelTorneos-->>Organizador: «Todavía no publicaste torneos» y «Publicar mi primer torneo»
    else Tiene torneos
        PanelTorneos->>PanelTorneos: calcular la antigüedad de verificación y ordenar el panel
        Note over PanelTorneos: Primero 30 días o más sin verificar (del más viejo al más nuevo), luego el resto, y al final los Finalizados
        PanelTorneos-->>Organizador: mostrar una fila por torneo con «Sigue vigente» y «Gestionar»
    end

    Organizador->>PanelTorneos: tocar «Gestionar»
    PanelTorneos->>GestionTorneo: abrirGestion(torneoId, pestaña)
    GestionTorneo->>TorneoRepository: obtenerTorneoPropio(torneoId, usuario)

    alt El torneo no existe o no es del organizador
        TorneoRepository-->>GestionTorneo: sin resultado
        GestionTorneo-->>Organizador: mostrar la página no encontrada (404)
    else Es su torneo
        TorneoRepository-->>GestionTorneo: datos del torneo, Estado, cupos y última verificación
        GestionTorneo-->>Organizador: mostrar la cabecera (números clave, «Sigue vigente» y «Ver ficha pública»), las pestañas Datos e Inscripciones y «Dar de baja»
    end
```

## Cómo se lee

- **Una fila por torneo** con nombre, Zona, modalidad, cupo, Estado y antigüedad, y solo dos acciones: «Sigue vigente» y «Gestionar». Editar, inscripciones y baja viven **solo en la pantalla de gestión**.
- **El orden pone primero lo que pide atención:** los torneos con 30 días o más sin verificar, del más viejo al más nuevo. Los **Finalizados** van al final, sin antigüedad ni botón de verificar.
- **Un torneo ajeno da 404, igual que uno inexistente:** no se confirma que exista un torneo con ese id que no es tuyo. Un id que no es un uuid hace fallar la consulta y cae en el mismo 404.
- **Tres niveles:** la lista, la gestión y la ficha pública (que, para el dueño, agrega la barra «Este torneo es tuyo · Gestionar»).
- La pestaña vive en `?tab=` (Datos o Inscripciones): cada una tiene su URL, y cualquier valor desconocido abre Datos.

## Correspondencia en el código

`MisTorneosPage` (`src/app/mis-torneos/page.tsx`) lee los torneos del usuario y usa `sortForPanel`; `GestionTorneoPage` (`src/app/mis-torneos/[id]/page.tsx`) filtra por `id` y `user_id` y llama a `notFound()` si no hay resultado.
