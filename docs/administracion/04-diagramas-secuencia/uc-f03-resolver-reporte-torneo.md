# S03 · UC-F03 — Resolver un reporte de torneo

Caso de uso: [UC-F03](../02-casos-de-uso.md#uc-f03--resolver-un-reporte-de-torneo) · Pantalla: no existe todavía · Requerimientos: RF-F12, RF-F13, RF-F18

> **Diseño objetivo, pendiente de implementación.** Hoy no hay tabla de reportes, ni pantalla, ni registro de acciones. Los participantes `PanelReportes`, `OpcionesResolucion`, `AdminService`, `ReporteRepository` y `RegistroDeAcciones` no existen todavía y sus nombres son provisorios.

El caso termina con una **elección entre tres resoluciones**. Siguiendo la guía de formularios, la pantalla obtiene la lista **antes** de que el administrador elija. Son una **lista fija del código**, así que las provee un proveedor de opciones y no un repositorio. Elegir y aplicar van en el mismo diagrama.

```mermaid
sequenceDiagram
    actor Administrador
    participant PanelReportes
    participant OpcionesResolucion
    participant AdminService
    participant ReporteRepository
    participant TorneoRepository
    participant RegistroDeAcciones

    Administrador->>PanelReportes: abrirReportesPendientes()
    PanelReportes->>ReporteRepository: listarPendientes()
    Note over ReporteRepository: Solo el administrador ve todos los reportes
    ReporteRepository-->>PanelReportes: reportes de torneo pendientes
    PanelReportes-->>Administrador: mostrar la lista

    Administrador->>PanelReportes: abrir un reporte
    PanelReportes->>OpcionesResolucion: listarResolucionesDeTorneo()
    OpcionesResolucion-->>PanelReportes: descartar, marcar como Observado, dar de baja
    PanelReportes-->>Administrador: mostrar el reporte, el torneo y las tres resoluciones

    Administrador->>PanelReportes: elegir una resolución y confirmar
    PanelReportes->>AdminService: resolverReporteDeTorneo(reporteId, resolucion)
    AdminService->>AdminService: verificar que la sesión es de un Administrador
    AdminService->>ReporteRepository: obtenerReporte(reporteId)
    ReporteRepository-->>AdminService: el reporte, con su estado

    alt Resolución inválida, o el reporte ya estaba resuelto
        AdminService-->>PanelReportes: motivo de rechazo
        PanelReportes-->>Administrador: mostrar error
    else Resolución válida
        alt Descartar
            AdminService->>ReporteRepository: marcarDescartado(reporteId)
        else Marcar como Observado
            AdminService->>TorneoRepository: marcarObservado(torneoId)
            Note over TorneoRepository: La marca se ve en catálogo y ficha. Solo el administrador la saca
        else Dar de baja
            AdminService->>TorneoRepository: darDeBaja(torneoId)
            Note over TorneoRepository: Como la baja del organizador: sale del catálogo, la ficha da 404, se borra el flyer y los planteles con Inscripción vinculada reciben el Aviso
        end
        AdminService->>RegistroDeAcciones: registrar(administrador, resolucion, reporteId)
        RegistroDeAcciones-->>AdminService: registrado (quién, cuándo y qué decidió)
        AdminService-->>PanelReportes: ok
        PanelReportes-->>Administrador: mostrar el reporte resuelto
    end
```

## Cómo se lee

- **Antes de elegir:** la pantalla trae las tres resoluciones de `OpcionesResolucion`; al elegir, viaja solo el valor elegido (`resolucion`).
- **Se valida de nuevo al aplicar.** Que el reporte aparezca pendiente en la pantalla no garantiza que lo siga estando (otra pestaña pudo resolverlo) ni que la resolución sea una de las tres. Y **el rol se verifica en el servidor** en cada acción: la pantalla no autoriza.
- **Observado vs. «Sigue vigente»:** el organizador reinicia la antigüedad de verificación con «Sigue vigente», pero **no** puede sacar la marca Observado.
- **La baja por reporte es la misma que la del organizador** (UC-E05): mismas consecuencias, incluido el Aviso a los planteles vinculados. Un torneo Finalizado no se da de baja: es la trayectoria del organizador.
- **Queda registrado** quién resolvió, cuándo y qué decidió (RF-F18). Los diagramas generales llaman a este paso «Registrar resolución administrativa» (D33).
- **Sin decidir:** el detalle del registro de acciones (qué datos guarda exactamente y quién lo puede leer). Solo está definido que registra quién, cuándo y qué decidió.
