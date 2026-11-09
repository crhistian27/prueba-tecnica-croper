# Ejercicio 3 – Arquitectura de microservicios

- **Empezar con un monolito modular** (como el backend NestJS de este proyecto) y separar servicios solo cuando haga falta.
- **Servicios:** Catálogo, Búsqueda, Pedidos, Inventario, Pagos, Logística y Notificaciones, cada uno con su propia base de datos.
- **Entrada:** un API Gateway que valida el JWT; el login lo maneja un proveedor de identidad (OIDC).
- **Comunicación:** REST para consultar y eventos (RabbitMQ) para reaccionar, por ejemplo "pedido creado" o "pago confirmado".
- **Compra:** reservar stock → cobrar → confirmar; si un paso falla, se deshacen los anteriores. Con clave de idempotencia para que un reintento no cobre dos veces.
