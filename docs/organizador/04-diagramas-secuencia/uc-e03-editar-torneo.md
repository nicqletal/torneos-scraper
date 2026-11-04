# S03 · UC-E03 — Editar un torneo

Caso de uso: [UC-E03](../02-casos-de-uso.md#uc-e03--editar-un-torneo) · Pantalla: [P3](../03-pantallas.md#p3--gestión-del-torneo) (pestaña Datos) · Requerimientos: RF-E02 a RF-E06, RF-E09 a RF-E11

Es el mismo formulario que [S01](uc-e01-publicar-torneo.md), con los dos desplegables (**Zona** y **modalidad**): sigue el mismo criterio. La carga de las opciones y el guardado van en el mismo diagrama. La diferencia: el formulario llega con los **valores actuales**, se **confirma** si hay equipos anotados y la base solo deja editar al dueño.

```mermaid
sequenceDiagram
    actor Organizador
    participant FormularioTorneo
    participant ZonaRepository
    participant OpcionesTorneo
    participant TorneoService
    participant Validador
    participant TorneoRepository

    Organizador->>FormularioTorneo: abrirDatosDelTorneo(torneoId)
    FormularioTorneo->>TorneoRepository: obtenerTorneoPropio(torneoId, usuario)
    TorneoRepository-->>FormularioTorneo: valores actuales, flyer e inscriptos (o 404 si no es suyo)
    FormularioTorneo->>ZonaRepository: listarZonas()
    ZonaRepository-->>FormularioTorneo: Zonas disponibles
    FormularioTorneo->>OpcionesTorneo: listarModalidades()
    OpcionesTorneo-->>FormularioTorneo: modalidades disponibles
    FormularioTorneo-->>Organizador: mostrar el formulario con los dos desplegables y los valores actuales

    Organizador->>FormularioTorneo: cambiar datos, elegir un flyer nuevo
    Organizador->>FormularioTorneo: guardar

    opt Hay equipos anotados
        FormularioTorneo-->>Organizador: pedir confirmación («Hay N equipos anotados, ¿confirmás el cambio?»)
        Organizador->>FormularioTorneo: confirmar
    end

    FormularioTorneo->>TorneoService: editarTorneo(torneoId, nombre, modalidad, zonaId, fechas, direccion, contactos, precio?, cupo?, descripcion?, reglamento?, flyer?)
    TorneoService->>Validador: validarDatos(nombre, modalidad, zonaId, fechas, direccion, contactos, precio, cupo)
    Validador-->>TorneoService: datos normalizados o error

    opt Se eligió un flyer nuevo
        TorneoService->>Validador: validarFlyer(flyer)
        Validador-->>TorneoService: flyer válido o error
    end

    alt Hay errores de validación
        TorneoService-->>FormularioTorneo: error y lo ya cargado
        FormularioTorneo-->>Organizador: mostrar el error (el formulario no se vacía)
    else Datos válidos
        TorneoService->>TorneoRepository: guardarCambios(torneoId, datos, usuario)
        Note over TorneoRepository: Solo el dueño y solo las columnas del formulario. No toca la antigüedad de verificación. La base comprueba que zonaId exista

        alt El torneo ya no existe o no es suyo, o falló el guardado
            TorneoRepository-->>TorneoService: ninguna fila actualizada, o error
            TorneoService-->>FormularioTorneo: «Este torneo ya no existe o no es tuyo.» o «No pudimos guardar los cambios. Probá de nuevo.»
            FormularioTorneo-->>Organizador: mostrar el error
        else Cambios guardados
            opt Se eligió un flyer nuevo
                TorneoService->>TorneoRepository: guardarFlyer(torneoId, flyer)
                TorneoRepository-->>TorneoService: resultado (el nuevo reemplaza al anterior)
            end
            TorneoService-->>FormularioTorneo: ok (o «Guardamos los cambios, pero no pudimos subir el flyer»)
            FormularioTorneo-->>Organizador: volver a la pantalla de gestión
        end
    end
```

## Cómo se lee

- **Mismo patrón que publicar:** las Zonas de `ZonaRepository`, las modalidades de `OpcionesTorneo`, y al enviar solo los **valores elegidos**. Los valores actuales vienen de `obtenerTorneoPropio`; el WhatsApp se muestra como lo cargó la persona (sin el `549`).
- **Quién puede editar lo decide la base**, no el código: la policy de actualización exige ser el dueño y los permisos por columna dejan escribir solo las del formulario. Con un torneo ajeno o dado de baja la actualización **no da error: afecta cero filas**, y por eso el mensaje «Este torneo ya no existe o no es tuyo».
- **Se valida de nuevo al guardar**, con las mismas reglas del alta.
- **Editar no cuenta como verificar:** `verified_at` no se toca (la persona no puede escribirlo, solo `verify_tournament`). Reiniciar la antigüedad es «Sigue vigente» ([S04](uc-e04-verificar-torneo.md)).
- **Confirmación con equipos anotados:** si hay inscriptos, el cambio los afecta (fechas, cupo, sede), así que se pide confirmar. Sin equipos, no se pregunta.
- **Subir el cupo** es la forma de admitir más inscripciones cuando está completo.
- **El flyer:** dejarlo vacío conserva el actual; uno nuevo **reemplaza** al anterior (mismo objeto). Si la subida falla, los cambios ya están guardados y se avisa.

## Correspondencia en el código

`updateTournament` (`src/app/mis-torneos/[id]/editar/actions.ts`): `parseTournamentForm` → `parseFlyer` → `update` filtrado por `id` y `user_id` → `uploadFlyer` → redirige a `/mis-torneos/{id}?tab=datos`. La confirmación sale de `editConfirmation` (`utils/tournament-form.ts`).
