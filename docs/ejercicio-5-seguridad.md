# Ejercicio 5 – Seguridad en APIs y cloud

- **OAuth vs JWT:** JWT es un formato de token; OAuth es un protocolo para dar permisos. Para una sola app basta JWT; con varias apps o terceros conviene OAuth/OIDC.
- **Fuerza bruta:** máximo 5 intentos de login por minuto, contraseñas con bcrypt y mensaje de error genérico. En producción: MFA y CAPTCHA.
- **MongoDB:** siempre con usuario y clave, sin exposición a internet, usuario de la app con permisos mínimos y validación de datos para evitar inyecciones.
- **Cloud:** HTTPS, servicios en red privada, secretos en un gestor (nunca en el código), contenedores sin root y revisión de dependencias en CI.
