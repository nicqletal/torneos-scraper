# S06 · UC-B06 — Reportar un torneo

Caso de uso: [UC-B06](../02-casos-de-uso.md#uc-b06--reportar-un-torneo) · Pantalla: [P2](../03-pantallas.md#p2--ficha-del-torneo) (botón «Reportar», todavía no existe) · Requerimientos: RF-B24

> **Diseño objetivo, pendiente de implementación.** Hoy no hay tabla, función ni botón de reportes de torneos. El diagrama dibuja lo que dicen las reglas vigentes; `OpcionesReporte`, `ReporteService`, `Validador` y `ReporteRepository` no existen todavía y sus nombres son provisorios.

El caso empieza con una elección entre tres motivos. Siguiendo la guía de formularios, la pantalla obtiene la lista de motivos **antes** de que la persona elija. Los motivos son una **lista fija del código**, así que los provee un proveedor de opciones y no un repositorio.

```mermaid
sequenceDiagram
    actor Usuario
    participant FichaTorneo
    participant OpcionesReporte
    participant ReporteService
    participant Validador
    participant ReporteRepository

    Usuario->>FichaTorneo: tocar «Reportar»
    FichaTorneo->>OpcionesReporte: listarMotivos()
    OpcionesReporte-->>FichaTorneo: motivos disponibles
    FichaTorneo-->>Usuario: mostrar los motivos para elegir

    Usuario->>FichaTorneo: elegir un motivo y enviar
    FichaTorneo->>ReporteService: reportarTorneo(torneoId, motivo)
    ReporteService->>Validador: validarMotivo(motivo)
    Validador-->>ReporteService: motivo válido o error

    alt Motivo inválido
        ReporteService-->>FichaTorneo: error
        FichaTorneo-->>Usuario: mostrar error
    else Motivo válido
        ReporteService->>ReporteRepository: crearReporte(torneoId, motivo, usuario)
        ReporteRepository->>ReporteRepository: verificar la sesión y que no haya reportado antes ese torneo
        Note over ReporteRepository: Una sola vez por usuario y torneo: la base rechaza el segundo reporte
        ReporteRepository-->>ReporteService: reporte pendiente o rechazo

        alt Ya lo había reportado, o sin sesión
            ReporteService-->>FichaTorneo: motivo de rechazo
            FichaTorneo-->>Usuario: mostrar error
        else Reporte guardado
            ReporteService-->>FichaTorneo: ok
            FichaTorneo-->>Usuario: confirmar que el reporte se envió
        end
    end
```

## Cómo se lee

- **Motivos** (lista fija): «Ya no existe», «Datos incorrectos» y «No es un torneo».
- **Una sola vez por usuario y torneo.** No alcanza con ocultar el botón: la base lo hace cumplir al guardar, porque la pantalla pudo quedar desactualizada o el pedido pudo armarse a mano.
- **Privacidad:** cada usuario ve solo sus reportes; el administrador ve todos.
- **Destino:** el reporte queda pendiente en el panel de administración, donde el administrador elige entre descartarlo, marcar el torneo como **Observado** o darlo de baja (UC-F03).
