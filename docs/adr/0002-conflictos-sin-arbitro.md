# Los conflictos de no presentado no los resuelve nadie: se muestran

El documento original mandaba al administrador las disputas de "no presentado" para que decidiera a favor de uno de los equipos. Descartamos eso porque el administrador no estuvo en la cancha y no tiene forma de verificar nada: su decisión sería arbitraria. En su lugar, si el acusado responde "nosotros fuimos", el partido queda **en conflicto**: no hay falta para nadie, **los dos equipos suman un conflicto** visible en su página pública (junto con la cantidad de rivales distintos) y el historial muestra las dos versiones. Así, mentir para salvarse de una falta o reportar en falso para perjudicar a otro deja de convenir, y los patrones repetidos quedan a la vista de los próximos rivales.

## Consequences

- Desaparece el caso de uso "Resolver disputa de no presentado" del panel de administración.
- Un equipo honesto puede cargar con un conflicto injusto. Es el costo aceptado de no poder verificar, y queda acotado porque un conflicto aislado pesa poco frente al historial.
- Las penalizaciones automáticas (bajar en las listas, bloquear búsquedas) cuentan solo faltas, nunca conflictos.
- **Acusación cruzada (27/10/2026):** si los dos equipos reportan "no vinieron", el partido también queda en conflicto. Antes quedaba sin jugar y sin nada para nadie, y eso abría un agujero: el que faltaba respondía acusando de vuelta y se salvaba de la falta sin pagar ni siquiera el conflicto. Ahora acusar de vuelta cuesta lo mismo que negar.
