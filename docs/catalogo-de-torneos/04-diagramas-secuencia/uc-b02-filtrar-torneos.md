# S02 · UC-B02 — Filtrar torneos y compartir la búsqueda

Caso de uso: [UC-B02](../02-casos-de-uso.md#uc-b02--filtrar-torneos-y-compartir-la-búsqueda) · Pantalla: [P1](../03-pantallas.md#p1--catálogo) (panel de filtros) · Requerimientos: RF-B08, RF-B11 a RF-B13

El caso empieza con **dos grupos de opciones** (modalidad y Estado). Siguiendo la guía de formularios, el panel obtiene las opciones **antes** de que la persona elija. Las dos listas son **fijas del código** (no se guardan en la base), así que las provee `OpcionesTorneo` y no un repositorio. La carga de las opciones y el filtrado van en el mismo diagrama.

> **Alcance real.** Hoy el panel filtra solo por **modalidad** y **Estado**. Zona o Corredor, precio máximo y fechas de inicio figuran en `casos-de-uso.md` pero **no están en `main`**: cuando entren, la Zona se consultará en la base (un `ZonaRepository`, como en Editar perfil) y agregará su lista a este diagrama.

```mermaid
sequenceDiagram
    actor Invitado
    participant FiltrosCatalogo
    participant OpcionesTorneo
    participant PaginaCatalogo
    participant TorneoRepository

    Invitado->>FiltrosCatalogo: abrirCatalogo(filtros en la URL?)
    FiltrosCatalogo->>OpcionesTorneo: listarModalidades()
    OpcionesTorneo-->>FiltrosCatalogo: modalidades disponibles
    FiltrosCatalogo->>OpcionesTorneo: listarEstados()
    OpcionesTorneo-->>FiltrosCatalogo: Estados disponibles
    FiltrosCatalogo-->>Invitado: mostrar el panel con las opciones (las de la URL, resaltadas)

    Invitado->>FiltrosCatalogo: elegir modalidad y/o Estado
    FiltrosCatalogo->>FiltrosCatalogo: escribir los valores elegidos en la URL y volver a la primera página
    FiltrosCatalogo->>PaginaCatalogo: abrirCatalogo(modalidad?, estado?)
    PaginaCatalogo->>TorneoRepository: listarTorneos(modalidad?, estado?)
    Note over TorneoRepository: Los filtros se combinan (AND) y los Finalizados siguen excluidos

    alt La base rechaza un valor (fuera de las opciones)
        TorneoRepository-->>PaginaCatalogo: error
        PaginaCatalogo-->>Invitado: «Hubo un error al cargar los torneos deportivos.»
    else Sin resultados
        TorneoRepository-->>PaginaCatalogo: ninguno
        PaginaCatalogo-->>Invitado: «No hay torneos registrados…» (limpiar = elegir «Todas» y «Todos»)
    else Hay resultados
        TorneoRepository-->>PaginaCatalogo: torneos filtrados
        PaginaCatalogo-->>Invitado: mostrar las tarjetas filtradas
    end

    opt Comparte la búsqueda
        Invitado->>Invitado: copiar la URL y enviarla
        Note over Invitado,PaginaCatalogo: Quien abre el link repite este diagrama con los mismos filtros ya activos
    end
```

## Cómo se lee

- **Antes de elegir:** el panel muestra las opciones de `OpcionesTorneo` y resalta las que ya están en la URL. «Todas las modalidades» y «Todos los estados» quitan ese filtro.
- **Al elegir**, solo viajan los **valores elegidos** (`modalidad`, `estado`), nunca las listas. El panel los escribe en la URL y **vuelve a la primera página** (borra `page`).
- **Los filtros viven en la URL**, no en estado local: una vista filtrada es siempre un **link compartible**. Por eso compartir no necesita un paso aparte: quien abre el link repite la consulta.
- **La validación se repite al consultar… en teoría.** Un valor que el panel ofrece puede no seguir siendo válido, porque la URL se puede editar a mano. Hoy el servidor **no valida** `modality` y `status` antes de consultar: un valor fuera de la lista lo rechaza la base y la persona ve el error de carga, en lugar de que se ignore ese filtro como dice `casos-de-uso.md`. Una **clave** desconocida (`?foo=1`) sí se ignora.
- Las dos listas son del código: si algún día modalidad o Estado se guardaran en una tabla, `OpcionesTorneo` se reemplazaría por un repositorio.

## Correspondencia en el código

`Filters` (`src/components/Filters.tsx`) lee `useSearchParams`, arma la URL con `router.push` y borra `page`; `TournamentList` aplica `.eq('sport_modality', …)` y `.eq('status', …)`.
