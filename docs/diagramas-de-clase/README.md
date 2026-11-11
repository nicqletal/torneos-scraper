# Diagramas de clase por caso de uso

Un archivo por módulo, cada uno con su versión `.md` (para leer y editar en el repo) y `.pdf` (para entregar). Cada módulo está alineado con sus documentos de `01-requerimientos.md`, `02-casos-de-uso.md`, `03-pantallas.md` y `04-diagramas-secuencia/`.

| Módulo | Casos de uso | Documentación del módulo | Markdown | PDF |
|---|---|---|---|---|
| A — Cuenta y acceso | UC-A01 a UC-A06 | [docs/cuenta-y-acceso](../cuenta-y-acceso/README.md) | [cuenta-y-acceso.md](cuenta-y-acceso.md) | [cuenta-y-acceso.pdf](cuenta-y-acceso.pdf) |
| B — Catálogo de torneos | UC-B01 a UC-B06 | [docs/catalogo-de-torneos](../catalogo-de-torneos/README.md) | [catalogo-de-torneos.md](catalogo-de-torneos.md) | [catalogo-de-torneos.pdf](catalogo-de-torneos.pdf) |
| C — Equipos | UC-C01 a UC-C10 | [docs/equipos](../equipos/README.md) | [equipos.md](equipos.md) | [equipos.pdf](equipos.pdf) |
| D — Partidos (buscar rival) | UC-D01 a UC-D14 | [docs/partidos](../partidos/README.md) | [partidos.md](partidos.md) | [partidos.pdf](partidos.pdf) |
| E — Organizador | UC-E01 a UC-E07 | [docs/organizador](../organizador/README.md) | [organizador.md](organizador.md) | [organizador.pdf](organizador.pdf) |
| F — Administración | UC-F01 a UC-F06 | [docs/administracion](../administracion/README.md) | [administracion.md](administracion.md) | [administracion.pdf](administracion.pdf) |

El módulo T (seguridad y RLS) no tiene diagramas propios: sus reglas se aplican en la capa de persistencia (`«repositorio»`).

## Fuentes (en orden de autoridad)

1. [`decisiones-casos-de-uso.md`](../especificaciones-y-requerimientos/decisiones-casos-de-uso.md): **fuente de verdad del alcance y las reglas de negocio**.
2. [`casos-de-uso.md`](../casos-de-uso/casos-de-uso.md) y los documentos de cada módulo (`01-requerimientos.md`, `02-casos-de-uso.md`, `03-pantallas.md`, `04-diagramas-secuencia/`).
3. [`CONTEXT.md`](../../CONTEXT.md): glosario del dominio («propuesta» y no «cruce», «partido caído» y no «suspendido», «baja» y no «eliminar», «Aviso» y no «notificación»).
4. [`guia-diagramas.txt`](../diagramas-de-secuencia/guia-diagramas.txt): criterio para representar formularios, desplegables, proveedores de opciones fijas y repositorios.
5. [`docs/adr/`](../adr/): decisiones de arquitectura vigentes (por ejemplo, ADR 0002: conflictos sin árbitro).
6. `supabase/migrations/` y `src/`: de acá salen los atributos reales de las entidades y la matriz de trazabilidad.

## Convenciones de arquitectura y estereotipos (Craig Larman / ECB)

Cada archivo comienza con el **Modelo de dominio del módulo** (las entidades con sus atributos y operaciones de negocio, relaciones de herencia/composición/asociación y enumeraciones) y luego desarrolla **un diagrama de clases de diseño por cada caso de uso** alineado con las pantallas (`03-pantallas.md`) y los diagramas de secuencia del módulo (`04-diagramas-secuencia/`). Los flujos principales, reglas de negocio detalladas y flujos alternativos pertenecen a `02-casos-de-uso.md`, por lo que no se duplican en estos documentos. Las relaciones entre clases se representan mediante conectores UML estándar (multiplicidades en asociaciones/composiciones, herencia y dependencias) sin etiquetas de texto sobre las flechas.

| Estereotipo | Capa / Rol (Larman) | Qué representa en este proyecto |
|---|---|---|
| `«boundary»` | Presentación (Frontera / UI / Perímetro) | Pantallas, formularios, menús, campanita (`Campanita`), middleware de acceso (`ControlDeAcceso`) y sistemas externos (`WhatsApp`, `Instagram`, `ServicioCorreo`) |
| `«control»` | Lógica de negocio (BLL) | Controladores de caso de uso (`CuentaService`, `PerfilService`, `AvisoService`, `TorneoService`, `InscripcionService`, `ReporteService`, `EquipoService`, `BusquedaService`, `PartidoService`, `AdminService`) y proveedores de opciones de negocio (`Opciones*`) |
| `«validador»` | Lógica de negocio (BLL) | Componentes cohesivos de validación por módulo (`ValidadorCuenta`, `ValidadorTorneo`, `ValidadorEquipo`, `ValidadorPartido`, `ValidadorAdmin`), invocados siempre desde el `«control»` (`*Service`) |
| `«repositorio»` | Datos (Acceso a datos / DAL) | Lee y escribe entidades en la base o Storage aplicando RLS y funciones RPC (`*Repository`, `RegistroDeAcciones`) |
| `«entidad»` | Dominio / Datos | Conceptos del dominio con identidad, estado persistente/calculado y operaciones de negocio (`Usuario`, `Administrador`, `Perfil`, `Sesion`, `Torneo`, `Inscripcion`, `Equipo`, `Partido`, `Propuesta`, `Aviso`, etc.) |
| `«enumeracion»` | Dominio | Conjuntos cerrados de valores del dominio (`Modalidad`, `EstadoTorneo`, `NivelEquipo`, `FasePartido`, `TipoAviso`, etc.) |

### Principios aplicados transversalmente

- **Separación estricta de capas sin salteos (`Presentación` → `Lógica` → `Datos`):** ningún componente de **Presentación** (`«boundary»`) accede de forma directa a **Datos** (`«repositorio»` o `«entidad»`) ni a un `«validador»`. Toda lectura o escritura pasa obligatoriamente por el controlador de **Lógica** (`*Service`, `«control»`), y este delega la persistencia en **Datos** (`*Repository`, `«repositorio»`).
- **Validadores cohesivos en Lógica (BLL):** cada módulo cuenta con un componente `«validador»` con todos los métodos de validación y normalización requeridos por los diagramas de secuencia, invocado exclusivamente por el `*Service` (`«control»`).
- **Subsistema de Avisos (campanita) sin saltear capas:** en `UC-A06`, `Campanita` (`«boundary»`, Presentación) pasa siempre por `AvisoService` (`«control»`, Lógica) antes de llegar a `AvisoRepository` (`«repositorio»`, Datos) y `Aviso` (`«entidad»`), corrigiendo el salto directo de Presentación a Datos que tenía el diagrama de secuencia original.
- **Generalización en el dominio:** los roles especializados con identidad de cuenta (como `Administrador` respecto de `Usuario`) se modelan mediante herencia (`<|--`).

## Regenerar los PDF

Después de editar un `.md`:

```bash
node scripts/generar-diagramas-pdf.mjs                                   # todos
node scripts/generar-diagramas-pdf.mjs docs/diagramas-de-clase/equipos.md # uno solo
```
