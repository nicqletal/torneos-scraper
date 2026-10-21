from pathlib import Path
import re,unicodedata
p=Path('docs/diagramas-secuencia.md'); s=p.read_text(encoding='utf-8')
# Keep the original D31-D36 numbers so the requested data-modification diagrams remain D35 and D36.
a=s.index('### D31 - Cargar Torneo copiado'); b=s.index('\n### D32 - ',a); copied=s[a:b].replace('### D31 - Cargar Torneo copiado','### D37 - Cargar Torneo copiado',1)
s=s[:a]+s[b+1:]
# Restore original IDs for the diagrams following the now-separated D30 flow.
for old,new in [(37,36),(36,35),(35,34),(34,33),(33,32),(32,31)]:
 s=re.sub(rf'(?m)^### D{old:02d} -',f'### D{new:02d} -',s)
# Preserve the split copy flow as a clearly labeled continuation of module F.
s=s.rstrip()+'\n\n## F. Administración (continuación)\n\n'+copied.strip()+'\n'
# Sort the index numerically and rebuild links from their headings.
header='| Diagrama | Caso de uso | Acción |\n|---|---|---|'; start=s.index(header); end=s.index('\n\nQuedan para otra tanda:',start)
found=list(re.finditer(r'(?m)^### (D\d{2}) - (.+)$',s)); rows=[]
for i,m in enumerate(found):
 did,title=m.group(1),m.group(2); nxt=found[i+1].start() if i+1<len(found) else len(s); part=s[m.start():nxt]; ref=re.search(r'Referencia: ([^.]+)\.',part).group(1)
 slug=unicodedata.normalize('NFD',title.lower()); slug=''.join(c for c in slug if unicodedata.category(c)!='Mn'); slug=re.sub(r'[^a-z0-9]+','-',slug).strip('-'); rows.append((int(did[1:]),f'| [{did}](#{did.lower()}--{slug}) | {ref} | {title} |'))
rows='\n'.join(row for _,row in sorted(rows))
s=s[:start]+header+'\n'+rows+s[end:]
s=s.replace('cubren 33/41 (80,5%).','cubren 33/41 (80,5%).')
p.write_text(s,encoding='utf-8')
print('diagram headings:',[(m.group(1),m.group(2)) for m in re.finditer(r'(?m)^### (D\d{2}) - (.+)$',s)][-8:])
