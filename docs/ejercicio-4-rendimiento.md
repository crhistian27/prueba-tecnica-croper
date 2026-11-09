# Ejercicio 4 – Rendimiento web en móviles

- **Carga diferida:** cada pantalla descarga solo su código. El bundle inicial bajó de 691 kB a 351 kB.
- **Fuentes livianas:** la fuente de íconos pasó de 170 KB a 6 KB, y las fuentes se sirven desde el propio servidor.
- **Carga visible al instante:** pantalla de carga y esqueletos; el primer contenido aparece en 0,7 s en lugar de 4–5 s.
- **Menos datos:** paginación en el servidor, búsqueda con espera (debounce), compresión gzip y caché de archivos estáticos.
- **Siguiente paso:** convertirla en PWA para que funcione con mala señal en zonas rurales.
