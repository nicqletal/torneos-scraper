# Diagramas de clase por caso de uso

Versión del **04/11/2026**. Un archivo por módulo, cada uno con su versión `.md` (para leer y editar en el repo) y `.pdf` (para entregar). Cada módulo está alineado con sus documentos de `01-requerimientos.md`, `02-casos-de-uso.md`, `03-pantallas.md` y `04-diagramas-secuencia/`.

| Módulo | Casos de uso | Documentación del módulo | Markdown | PDF |
|---|---|---|---|---|
| A — Cuenta y acceso | UC-A01 a UC-A06 | [docs/cuenta-y-acceso](../cuenta-y-acceso/README.md) | [cuenta-y-acceso.md](cuenta-y-acceso.md) | [cuenta-y-acceso.pdf](cuenta-y-acceso.pdf) |
| B — Catálogo de torneos | UC-B01 a UC-B06 | [docs/catalogo-de-torneos](../catalogo-de-torneos/README.md) | [catalogo-de-torneos.md](catalogo-de-torneos.md) | [catalogo-de-torneos.pdf](catalogo-de-torneos.pdf) |
| C — Equipos | UC-C01 a UC-C10 | [docs/equipos](../equipos/README.md) | [equipos.md](equipos.md) | [equipos.pdf](equipos.pdf) |
| D — Partidos (buscar rival) | UC-D01 a UC-D14 | [docs/partidos](../partidos/README.md) | [partidos.md](partidos.md) | [partidos.pdf](partidos.pdf) |
| E — Organizador | UC-E01 a UC-E07 | [docs/organizador](../organizador/README.md) | [organizador.md](organizador.md) | [organizador.pdf](organizador.pdf) |
| F — Administración | UC-F01 a UC-F06 | [docs/administracion](../administracion/README.md) | [administracion.md](administracion.md) | [administracion.pdf](administracion.pdf) |

El módulo T (seguridad y RLS) no tiene diagramas propios: sus reglas aparecen como restricciones dentro de cada caso de uso y en los repositorios.

## Fuentes (en orden de autoridad)

1. [`decisiones-casos-de-uso.md`](../especificaciones-y-requerimientos/decisiones-casos-de-uso.md): **fuente de verdad del alcance y las reglas de negocio**.
2. [`casos-de-uso.md`](../casos-de-uso/casos-de-uso.md) y los documentos de cada módulo (`01-requerimientos.md`, `02-casos-de-uso.md`, `03-pantallas.md`, `04-diagramas-secuencia/`).
3. [`CONTEXT.md`](../../CONTEXT.md): glosario del dominio («propuesta» y no «cruce», «partido caído» y no «suspendido», «baja» y no «eliminar», «Aviso» y no «notificación»).
4. [`guia-diagramas.txt`](../diagramas-de-secuencia/guia-diagramas.txt): criterio para representar formularios, desplegables, proveedores de opciones fijas y repositorios.
5. [`docs/adr/`](../adr/): decisiones de arquitectura vigentes (por ejemplo, ADR 0002: conflictos sin árbitro).
6. `supabase/migrations/` y `src/`: de acá salen los atributos reales de las entidades y la matriz de trazabilidad.

## Convenciones de los diagramas

Cada archivo comienza con el **Modelo de dominio del módulo** (las entidades y enumeraciones persistentes o calculadas) y luego desarrolla **un diagrama de clases por cada caso de uso**, mostrando únicamente las clases que participan en ese caso y manteniendo correspondencia directa con los participantes y mensajes de su **diagrama de secuencia** (`04-diagramas-secuencia/`).

| Estereotipo | Qué representa | En este proyecto |
|---|---|---|
| `«interfaz»` | La pantalla o componente que el actor ve y opera | Páginas del App Router y componentes (`FormularioAcceso`, `FichaTorneo`, `FichaEquipo`, `PantallaPartidos`) |
| `«proveedor de opciones»` | Entrega listas fijas definidas en el código, sin consultar la base | `OpcionesEquipo`, `OpcionesTorneo`, `OpcionesBusqueda`, `OpcionesPartido`, `OpcionesReporte`, `OpcionesResolucion`, `OpcionesSuspension` |
| `«control»` | Coordina el caso de uso o valida las entradas | Server Actions (`*Service`), middleware (`ControlDeAcceso`) y validadores puros (`Validador`) |
| `«repositorio»` | Lee y escribe datos en la base o Storage, aplicando RLS y funciones RPC | `*Repository` (`ZonaRepository`, `EquipoRepository`, `TorneoRepository`, `PartidoRepository`, etc.) |
| `«entidad»` | Un concepto del dominio con identidad o valor persistente/calculado | Tablas y vistas de Supabase (`Usuario`, `Perfil`, `Torneo`, `Inscripcion`, `Equipo`, `Partido`, `Propuesta`, `Aviso`, etc.) |
| `«enumeracion»` | Un conjunto cerrado de valores del dominio | `enum` de Postgres o listas cerradas (`Modalidad`, `EstadoTorneo`, `NivelEquipo`, `FasePartido`, etc.) |
| `«servicio externo»` | Un sistema externo fuera de nuestro código | `WhatsApp`, `Instagram`, `ServicioCorreo` |

- **Carga previa de desplegables y validación al guardar:** siguiendo la guía de diagramas, cuando un caso empieza con un formulario con desplegables, la `«interfaz»` consulta antes a los repositorios (`ZonaRepository`) o proveedores de opciones (`OpcionesEquipo`, `OpcionesTorneo`, `OpcionesBusqueda`), y al enviar pasa al `«control»` solo los valores elegidos (`zonaId`, `modalidad`, `nivel`). El `Validador` y el `«repositorio»` vuelven a validar al guardar.
- **Valores calculados:** los estados y plazos que no se guardan en columnas sino que se calculan al leer (como `Torneo.estado()`, `Torneo.antiguedadVerificacion()`, `Partido.fase()`, `Partido.plazo()`, `Propuesta.estado()`) se representan como **métodos** de la entidad.
- **Nombres de clases:** van sin tildes ni espacios (`Inscripcion`, `Sesion`, `BusquedaDeRival`) por compatibilidad con Mermaid; en atributos, métodos y etiquetas sí se usan tildes.
- **Relaciones:** `..>` dependencia (usa / consulta), `-->` asociación, `*--` composición, `o--` agregación.

## Regenerar los PDF

Después de editar un `.md`:

```bash
node scripts/generar-diagramas-pdf.mjs                                   # todos
node scripts/generar-diagramas-pdf.mjs docs/diagramas-de-clase/equipos.md # uno solo
```
