# S05 · UC-A05 — Editar perfil

Caso de uso: [UC-A05](../02-casos-de-uso.md#uc-a05--editar-perfil) · Pantalla: [P3](../03-pantallas.md#p3--mi-perfil) · Requerimientos: RF-A11 a RF-A18

El formulario tiene **un solo desplegable: la Zona**. Sigue el criterio de la guía de formularios: la pantalla obtiene las Zonas de `ZonaRepository` **antes** de que la persona elija, y al enviar manda solo el `zonaId` elegido. Nombre, WhatsApp y foto son campos de texto y de archivo, sin listas que cargar; por eso no hay proveedor de opciones fijas. La carga de la Zona y el guardado van en este único diagrama.

```mermaid
sequenceDiagram
    actor Usuario
    participant FormularioPerfil
    participant ZonaRepository
    participant PerfilService
    participant Validador
    participant PerfilRepository

    Note over Usuario,FormularioPerfil: Sin sesión, la pantalla redirige al login y conserva /perfil como destino
    Usuario->>FormularioPerfil: abrirMiPerfil(destino?)
    FormularioPerfil->>PerfilRepository: obtenerPerfil(usuario)
    PerfilRepository-->>FormularioPerfil: nombre, foto, zona y WhatsApp actuales
    FormularioPerfil->>ZonaRepository: listarZonas()
    ZonaRepository-->>FormularioPerfil: Zonas disponibles
    FormularioPerfil-->>Usuario: mostrar el formulario con el desplegable de Zona y los valores actuales (y «Para seguir, cargá tu WhatsApp» si llegó con destino y no lo tiene)

    Usuario->>FormularioPerfil: cambiar nombre, foto, Zona o WhatsApp
    Usuario->>FormularioPerfil: confirmar con «Guardar»
    FormularioPerfil->>PerfilService: editarPerfil(nombre, zonaId?, whatsapp, foto?, destino?)
    PerfilService->>Validador: validarNombre(nombre)
    Validador-->>PerfilService: nombre válido o error

    opt El WhatsApp no está vacío
        PerfilService->>Validador: normalizarWhatsapp(whatsapp)
        Validador-->>PerfilService: 549 y 10 dígitos, o error
    end

    opt Se eligió una foto
        PerfilService->>Validador: validarFoto(foto)
        Validador-->>PerfilService: foto válida o error
    end

    alt Hay errores de validación
        PerfilService-->>FormularioPerfil: errores
        FormularioPerfil-->>Usuario: mostrar errores
    else Datos válidos
        PerfilService->>PerfilRepository: guardarPerfil(nombre, zonaId, foto?)
        Note over PerfilRepository: La base comprueba que zonaId exista y que solo se edite el propio perfil (nombre, foto y Zona)

        opt Hay foto nueva
            PerfilRepository->>PerfilRepository: subir la foto nueva antes de guardar
        end

        alt Guardado rechazado
            PerfilRepository->>PerfilRepository: retirar la subida de la foto nueva, si la hubo
            PerfilRepository-->>PerfilService: motivo de rechazo
            PerfilService-->>FormularioPerfil: motivo de rechazo
            FormularioPerfil-->>Usuario: mostrar error (se conserva la foto anterior)
        else Perfil guardado
            opt Se reemplazó la foto
                PerfilRepository->>PerfilRepository: retirar la foto anterior
            end
            PerfilRepository-->>PerfilService: perfil guardado (con aviso si no se pudo retirar la foto anterior)
            PerfilService->>PerfilRepository: guardarWhatsapp(whatsapp)
            Note over PerfilRepository: Pendiente (RF-A17): rechazar un WhatsApp vacío si es Capitán de un equipo no disuelto

            alt No se pudo guardar el WhatsApp
                PerfilRepository-->>PerfilService: rechazo
                PerfilService-->>FormularioPerfil: «No se pudo guardar el WhatsApp»
                FormularioPerfil-->>Usuario: mostrar error (el resto ya quedó guardado)
            else WhatsApp guardado
                PerfilRepository-->>PerfilService: ok
                PerfilService-->>FormularioPerfil: ok
                FormularioPerfil-->>Usuario: «Perfil guardado.» o abrir el destino pendiente
            end
        end
    end
```

## Cómo se lee

- **Antes de elegir:** la pantalla trae los valores actuales de `PerfilRepository` y las Zonas de `ZonaRepository`, y recién entonces muestra el formulario. El desplegable ofrece además «Sin zona»: la Zona del perfil es **opcional**.
- **Al enviar:** `editarPerfil(...)` recibe solo los **valores elegidos** (`zonaId`), no la lista de Zonas.
- **Se valida de nuevo al guardar.** `Validador` revisa el nombre (de 2 a 50 caracteres), el WhatsApp y la foto aunque el formulario tenga sus propias restricciones; y la base comprueba que la Zona exista (clave foránea) y que cada persona edite solo su perfil, y solo las columnas nombre, foto y Zona. El rol de administrador no está entre ellas: **no se puede editar desde la app**.
- **El WhatsApp se normaliza:** la persona escribe «11 2345 6789» y se guarda `5491123456789` (`549` + código de área sin 0 + número sin 15). Un número con «15» se rechaza, porque después del código de área no se sabe dónde termina el código. Vacío es válido.
- **La foto no se pierde si algo falla:** la foto nueva se **sube antes** de guardar; si el guardado falla, se retira esa subida y la anterior queda intacta; la anterior **solo se retira después** de guardar la URL nueva. Si dos pestañas reemplazan la foto a la vez, la segunda no se guarda.
- **Guardado en dos pasos, sin transacción:** primero nombre, Zona y foto; después el WhatsApp, que está en otra tabla (`profile_contacts`, aparte para que leer el perfil público nunca exponga el número). Si el segundo paso falla, el primero **ya quedó guardado**, y el mensaje lo dice.
- **Regla pendiente:** el Capitán de un equipo no disuelto no puede dejar el WhatsApp vacío (sí cambiarlo), porque el rival lo necesita para coordinar. **Hoy nada lo hace cumplir**: la acción no consulta los equipos y la base no tiene un trigger sobre `profile_contacts` (el único trigger de la base es el del alta de cuentas). Cuando se resuelva, la comprobación va en `guardarWhatsapp`, dentro de la base.

## Correspondencia en el código

`updateProfile` (`src/app/perfil/actions.ts`): regla del nombre → `normalizeWhatsapp` → `parseAvatar` → `saveProfile` (`src/utils/supabase/profile.ts`) → `update` de `profile_contacts` → redirige al destino o a `/perfil?ok=1`. Las Zonas salen de `zones` mediante `getZoneGroups()`.
