# S01 · UC-C01 — Crear equipo

Caso de uso: [UC-C01](../02-casos-de-uso.md#uc-c01--crear-equipo) · Pantalla: [P1](../03-pantallas.md#p1--crear-equipo) · Requerimientos: RF-C01 a RF-C06

El formulario carga las opciones de sus tres desplegables **antes** de permitir que el Usuario envíe el alta. `ZonaRepository` representa la consulta de la lista cerrada de Zonas; `OpcionesEquipo` provee las listas fijas de modalidades y niveles. Son responsabilidades conceptuales, no clases con esos nombres (ver [participantes](README.md#participantes-responsabilidad-y-correspondencia-en-el-repo)).

```mermaid
sequenceDiagram
    actor Usuario
    participant FormularioCrearEquipo
    participant ZonaRepository
    participant OpcionesEquipo
    participant EquipoService
    participant Validador
    participant EquipoRepository

    Note over Usuario,FormularioCrearEquipo: Sin sesión, la pantalla redirige al login y conserva /crear-equipo como destino
    Usuario->>FormularioCrearEquipo: abrirCrearEquipo()
    FormularioCrearEquipo->>EquipoRepository: consultarRequisitos(usuario)
    EquipoRepository-->>FormularioCrearEquipo: WhatsApp cargado y capitanías activas
    FormularioCrearEquipo->>ZonaRepository: listarZonas()
    ZonaRepository-->>FormularioCrearEquipo: Zonas disponibles
    FormularioCrearEquipo->>OpcionesEquipo: listarModalidades()
    OpcionesEquipo-->>FormularioCrearEquipo: modalidades disponibles
    FormularioCrearEquipo->>OpcionesEquipo: listarNiveles()
    OpcionesEquipo-->>FormularioCrearEquipo: niveles disponibles
    FormularioCrearEquipo-->>Usuario: mostrar formulario con los tres desplegables (o el aviso si falta el WhatsApp o se alcanzó el límite)

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
        EquipoRepository->>EquipoRepository: comprobar WhatsApp y límite de 3 capitanías
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
            EquipoService-->>FormularioCrearEquipo: id del Equipo y resultado del escudo
            FormularioCrearEquipo-->>Usuario: abrir ficha del Equipo (o Editar equipo con aviso si falló el escudo)
        end
    end
```

## Cómo se lee

- **Antes de elegir:** la pantalla obtiene las Zonas de `ZonaRepository` y las modalidades y los niveles de `OpcionesEquipo`, y recién entonces muestra el formulario. `consultarRequisitos` es lo que le permite mostrar de entrada el aviso de WhatsApp o de límite de capitanías; es un adelanto, no una garantía.
- **Al enviar:** `crearEquipo(...)` recibe solo los **valores elegidos** (`zonaId`, `modalidad`, `nivel`), no las listas.
- **Se valida de nuevo al guardar.** `Validador` revisa nombre, Zona, modalidad y nivel aunque la pantalla solo ofrezca opciones válidas. Después, la base vuelve a comprobar WhatsApp y límite, y que `zonaId` exista (clave foránea): una Zona que desapareció entre la carga del formulario y el envío hace fallar el alta.
- **El Equipo y su Capitán se guardan juntos**, en una transacción (`create_team`): nunca queda un Equipo sin Capitán.
- **El escudo se guarda después del alta**, no dentro de ella. Si falla, el Equipo ya existe y la persona llega a «Editar equipo» con el aviso «El equipo se creó. …» para reintentar (UC-C01 A7).

## Correspondencia en el código

`createTeam` (`src/app/crear-equipo/actions.ts`) hace: `parseTeamForm` → `parseCrest` → RPC `create_team` → `saveTeam` si hubo escudo. Las Zonas salen de `zones` mediante `getZoneGroups()`; modalidad y nivel, de `SPORT_MODALITIES` y `TEAM_LEVELS`.
