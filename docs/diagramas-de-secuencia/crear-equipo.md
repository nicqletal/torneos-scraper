# UC-25 — Crear Equipo

El formulario carga las opciones de sus tres desplegables antes de permitir que el Usuario envíe el alta. `ZonaRepository` representa la consulta de la lista cerrada de Zonas; `OpcionesEquipo` provee las listas fijas de modalidades y niveles. Son responsabilidades conceptuales: no implican que existan clases TypeScript con esos nombres.

```mermaid
sequenceDiagram
    actor Usuario
    participant FormularioCrearEquipo
    participant ZonaRepository
    participant OpcionesEquipo
    participant EquipoService
    participant Validador
    participant EquipoRepository

    Usuario->>FormularioCrearEquipo: abrirCrearEquipo()

    FormularioCrearEquipo->>ZonaRepository: listarZonas()
    ZonaRepository-->>FormularioCrearEquipo: Zonas disponibles
    FormularioCrearEquipo->>OpcionesEquipo: listarModalidades()
    OpcionesEquipo-->>FormularioCrearEquipo: modalidades disponibles
    FormularioCrearEquipo->>OpcionesEquipo: listarNiveles()
    OpcionesEquipo-->>FormularioCrearEquipo: niveles disponibles
    FormularioCrearEquipo-->>Usuario: mostrar formulario con los tres desplegables

    Usuario->>FormularioCrearEquipo: completar datos y seleccionar opciones
    Usuario->>FormularioCrearEquipo: confirmar creación
    FormularioCrearEquipo->>EquipoService: crearEquipo(nombre, zonaId, modalidad, nivel, escudo?)
    EquipoService->>Validador: validarDatos(nombre, zonaId, modalidad, nivel)
    Validador-->>EquipoService: datos válidos o errores

    opt Se adjuntó un escudo
        EquipoService->>Validador: validarEscudo(escudo)
        Validador-->>EquipoService: escudo válido o error
    end

    alt Hay errores de validación
        EquipoService-->>FormularioCrearEquipo: errores
        FormularioCrearEquipo-->>Usuario: mostrar errores
    else Datos válidos
        EquipoService->>EquipoRepository: crearEquipo(datos, usuario)
        EquipoRepository->>EquipoRepository: comprobar WhatsApp y límite de Equipos
        EquipoRepository->>EquipoRepository: guardar Equipo y Capitán en una transacción
        Note over EquipoRepository: La base comprueba que zonaId exista
        EquipoRepository-->>EquipoService: id del Equipo o rechazo

        alt Alta rechazada
            EquipoService-->>FormularioCrearEquipo: motivo de rechazo
            FormularioCrearEquipo-->>Usuario: mostrar error
        else Equipo creado
            opt Se adjuntó un escudo
                EquipoService->>EquipoRepository: guardarEscudo(id, escudo)
                EquipoRepository-->>EquipoService: resultado
            end
            EquipoService-->>FormularioCrearEquipo: id del Equipo
            FormularioCrearEquipo-->>Usuario: abrir ficha del Equipo
        end
    end
```

La pantalla envía los **valores elegidos** (`zonaId`, `modalidad`, `nivel`), no las listas completas. La validación se repite al guardar. En el código actual, las Zonas provienen de `zones` mediante `getZoneGroups()`, mientras que modalidad y nivel provienen de `SPORT_MODALITIES` y `TEAM_LEVELS`. El alta se realiza mediante la función de Postgres `create_team`.

Ver también [guia-diagramas.txt](guia-diagramas.txt) para aplicar el mismo criterio a otros formularios.
