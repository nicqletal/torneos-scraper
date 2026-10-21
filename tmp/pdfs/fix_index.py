from pathlib import Path
import re,unicodedata
p=Path('docs/diagramas-secuencia.md'); s=p.read_text(encoding='utf-8').replace('### D32 - Cargar Torneo copiado','### D31 - Cargar Torneo copiado')
header='| Diagrama | Caso de uso | Acción |\n|---|---|---|'; a=s.index(header); b=s.index('\n\nQuedan para otra tanda:',a)
matches=list(re.finditer(r'(?m)^### (D\d{2}) - (.+)$',s)); rows=[]
for i,m in enumerate(matches):
 did,title=m.group(1),m.group(2); stop=matches[i+1].start() if i+1<len(matches) else len(s); section=s[m.start():stop]; ref=re.search(r'Referencia: ([^.]+)\.',section).group(1)
 slug=unicodedata.normalize('NFD',title.lower()); slug=''.join(c for c in slug if unicodedata.category(c)!='Mn'); slug=re.sub(r'[^a-z0-9]+','-',slug).strip('-'); rows.append(f'| [{did}](#{did.lower()}--{slug}) | {ref} | {title} |')
s=s[:a]+header+'\n'+'\n'.join(rows)+s[b:]; p.write_text(s,encoding='utf-8')
print('count',len(matches),'unique IDs',len(set(m.group(1) for m in matches))); print('\n'.join(rows[-8:]))
