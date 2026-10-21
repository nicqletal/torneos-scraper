from pathlib import Path
import re, unicodedata
p=Path('docs/diagramas-secuencia.md'); s=p.read_text(encoding='utf-8')
new30='''### D30 - Acceder a administración

Referencia: CU-F01. El Administrador solicita acceso a administración; el flujo termina al habilitar o denegar ese acceso.

```mermaid
sequenceDiagram
    autonumber
    participant Navegador
    participant UI as Interfaz
    participant Localidad
    participant Datos as Acceso a datos
    Administrador->>Navegador: Abre administración
    Navegador->>UI: Enviar solicitud a la Interfaz
    UI->>Datos: Validar permiso administrativo
    alt Acceso permitido
        Datos-->>UI: Permiso confirmado
        UI-->>Navegador: Devolver respuesta de la Interfaz
        Navegador-->>Administrador: Mostrar administración
    else Acceso denegado
        Datos-->>UI: Permiso denegado
        UI-->>Navegador: Devolver respuesta de la Interfaz
        Navegador-->>Administrador: Mostrar acceso denegado
    end
```

### D31 - Cargar Torneo copiado

Referencia: CU-F01. Con acceso administrativo disponible, el Administrador carga un Torneo copiado sin Organizador.

```mermaid
sequenceDiagram
    autonumber
    participant Navegador
    participant UI as Interfaz
    participant Localidad
    participant Datos as Acceso a datos
    Administrador->>Navegador: Completa datos del Torneo copiado
    Navegador->>UI: Enviar solicitud a la Interfaz
    UI->>Datos: Guardar Torneo sin Organizador
    Datos-->>UI: Torneo copiado guardado
    UI-->>Navegador: Devolver respuesta de la Interfaz
    Navegador-->>Administrador: Mostrar confirmación
```
'''
start=s.index('### D30 - '); end=s.index('\n### D31 - ',start)
s=s[:start]+new30.rstrip()+s[end:]
# Shift former D31-D36 after inserting a new D31.
for old in range(36,30,-1):
 s=re.sub(rf'(?m)^### D{old:02d} -',f'### D{old+1:02d} -',s)
# Replace current D36 and D37 sections with modification-only flows.
def replace_section(doc, did, replacement):
 start=doc.index(f'### {did} - ')
 nxt=re.search(r'(?m)^### D\d{2} - |^## ',doc[start+1:])
 end=start+1+nxt.start() if nxt else len(doc)
 return doc[:start]+replacement.rstrip()+'\n\n'+doc[end:]
new36='''### D36 - Modificar datos propios

Referencia: UC-52. La persona modifica datos propios o de su Equipo cuando su relación y rol lo permiten.

```mermaid
sequenceDiagram
    autonumber
    participant Navegador
    participant UI as Interfaz
    participant Localidad
    participant Datos as Acceso a datos
    Usuario->>Navegador: Edita datos propios
    Navegador->>UI: Enviar solicitud a la Interfaz
    UI->>Datos: Verificar relación y permiso
    alt Tiene permiso
        Datos-->>UI: Modificación autorizada
        UI->>Datos: Guardar cambios
        Datos-->>UI: Datos actualizados
        UI-->>Navegador: Devolver respuesta de la Interfaz
        Navegador-->>Usuario: Mostrar datos actualizados
    else Sin permiso
        Datos-->>UI: Acceso denegado
        UI-->>Navegador: Devolver respuesta de la Interfaz
        Navegador-->>Usuario: Mostrar respuesta de acceso
    end
```
'''
new37='''### D37 - Modificar datos como Administrador

Referencia: UC-53. El Administrador modifica datos dentro de su permiso administrativo.

```mermaid
sequenceDiagram
    autonumber
    participant Navegador
    participant UI as Interfaz
    participant Localidad
    participant Datos as Acceso a datos
    Administrador->>Navegador: Edita datos administrativos
    Navegador->>UI: Enviar solicitud a la Interfaz
    UI->>Datos: Verificar rol y permiso
    alt Tiene permiso
        Datos-->>UI: Modificación autorizada
        UI->>Datos: Guardar cambios
        Datos-->>UI: Datos actualizados
        UI-->>Navegador: Devolver respuesta de la Interfaz
        Navegador-->>Administrador: Mostrar datos actualizados
    else Sin permiso
        Datos-->>UI: Acceso denegado
        UI-->>Navegador: Devolver respuesta de la Interfaz
        Navegador-->>Administrador: Mostrar respuesta de acceso
    end
```
'''
s=replace_section(s,'D36',new36)
s=replace_section(s,'D37',new37)
# Refresh index anchors and rows from current headings.
header='| Diagrama | Caso de uso | Acción |\n|---|---|---|'
table_start=s.index(header); table_end=s.index('\n\nQuedan para otra tanda:',table_start)
rows=[]
for did,title in re.findall(r'(?m)^### (D\d{2}) - (.+)$',s):
 body=s[s.index(f'### {did} - '):]
 ref=re.search(r'Referencia: ([^.]+)\.',body).group(1)
 slug=unicodedata.normalize('NFD',title.lower()); slug=''.join(ch for ch in slug if unicodedata.category(ch)!='Mn'); slug=re.sub(r'[^a-z0-9]+','-',slug).strip('-')
 rows.append(f'| [{did}](#{did.lower()}--{slug}) | {ref} | {title} |')
s=s[:table_start]+header+'\n'+'\n'.join(rows)+s[table_end:]
p.write_text(s,encoding='utf-8')
print('diagrams:',len(rows),'D30/D31 split; D36/D37 modification flows')
