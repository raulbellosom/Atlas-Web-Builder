# Atlas 0.5.0 — aceptación en teléfonos físicos

Estado inicial: **PENDIENTE**. Los recorridos de Chromium/WebKit automatizados son emulados y no sustituyen estas pruebas. Registrar por separado iPhone/Safari y Android/Chrome, modelo, versión de sistema/navegador, fecha y resultado. No publicar hasta revisar los fallos y autorizar el release.

## Preparación

En la computadora, desde la raíz del repositorio:

```powershell
pnpm install --frozen-lockfile --ignore-scripts
pnpm playground:lan
```

El comando imprime la URL con una IPv4 privada asignada y puerto 5173. En la red observada al preparar este corte: **http://192.168.100.154:5173/**. La IP puede cambiar; usar siempre la que imprime el comando. Computadora y teléfono deben compartir una red privada con comunicación entre clientes. Abrir esa URL directamente en Safari o Chrome. El teléfono no instala npm ni Atlas.

Si hay varias interfaces, configurar `ATLAS_LAN_HOST` con la IPv4 privada de Wi-Fi/Ethernet antes del comando. Si Windows pregunta por firewall, permitir sólo la red privada para este servidor de prueba; no abrir puertos del router, túneles ni acceso público. No se modificó automáticamente el firewall. Para terminar: Ctrl+C. No usar datos reales de clientes en esta demo.

El playground usa las fuentes locales de Atlas, una imagen SVG local y localStorage del navegador. No tiene backend, publicación ni conexiones ERP/Hub. La dependencia workspace usa `@raulbellosom/atlas-web-builder`; el alias histórico sólo conserva ejemplos antiguos. Si se cambia IP o puerto, cambia el origen y su almacenamiento. El modo privado puede impedir persistencia; el error debe mostrarse y el último borrador válido conservarse.

## Registro de ejecución

| Dispositivo físico | SO / navegador | Vertical | Horizontal | Fecha / probador | Resultado |
| --- | --- | --- | --- | --- | --- |
| iPhone / Safari | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Android / Chrome | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |

Repetir la siguiente lista en ambos teléfonos y orientaciones. Marcar PASS, FAIL o NO SOPORTADO y adjuntar captura o vídeo al fallar. Un fallo de guardado, pérdida de datos, scroll bloqueado o herramienta inaccesible bloquea la aceptación.

## Recorrido manual

1. **Inicio y apariencia.** Abrir la URL y comprobar que carga la página, incluidos imagen y bloques anidados. Cambiar claro/oscuro/sistema en Más acciones; cambiar también el modo del teléfono. El website blanco debe conservar su paleta. No perder selección, texto ni undo al cambiar de modo.
2. **Inserción y scroll de biblioteca.** Abrir Bloques, desplazar verticalmente con el dedo y comprobar que el scroll no inserta ni arrastra. Tocar una tarjeta para insertar. Seleccionar un bloque anidado y confirmar el destino de la inserción. Abrir/cerrar Capas sin perder cambios.
3. **Selección.** Tocar texto, imagen, contenedor y botón. Seleccionar el nivel correcto sin activar enlaces del sitio ni abrir pestañas. Recorrer el árbol y expandir/contraer nodos; seleccionar desde Capas.
4. **Arrastre táctil.** Mantener pulsado el tirador y reordenar dos bloques, incluyendo alturas distintas y bloques anidados. Soltar en destino válido; comprobar el orden. Probar movimiento con botones si el drag resulta difícil. Deshacer y rehacer ambos caminos. Un gesto de scroll sobre contenido normal no debe iniciar drag.
5. **Inspector inferior.** Abrir Propiedades y contraer secciones. Editar texto, nivel, alineación, espaciado y opacidad de Efectos. Comprobar etiquetas, estado modificado y restablecimiento. Cerrar y reabrir: mantener el valor y selección. Desplazar todo el inspector sin mover por accidente el canvas ni dejar inaccesibles sus extremos.
6. **Teclado virtual real.** Enfocar texto al principio y final del inspector; escribir varias líneas, seleccionar/copiar/pegar, cerrar teclado y cambiar orientación con él abierto. La hoja no debe cubrir la barra superior; la propiedad enfocada debe poder verse y desplazarse. No afirmar este resultado usando sólo un resize de escritorio.
7. **Barra contextual y altura.** Seleccionar un bloque cerca de los bordes; abrir/cerrar teclado, barras del navegador, inspector y cambiar orientación. La barra debe seguir el canvas o desaparecer si su bloque queda fuera de vista; nunca quedar flotando fuera del editor. Sus tiradores y acciones deben responder con el dedo.
8. **Menús, selects y medios.** Abrir Más acciones, un select nativo, alineación, color y selector de imagen; aceptar/cancelar con gestos y botón Atrás cuando corresponda. Cerrar overlay anidado sin cerrar por accidente el panel. Recuperar un destino de foco útil cuando el navegador lo admita. La biblioteca no necesita subir archivos ni credenciales.
9. **Zoom y desplazamiento.** Usar ajustar y 25–150%, desplazar el canvas en ambos ejes y seleccionar/arrastrar tras escalar. Comprobar que las herramientas mantienen tamaño útil. Probar pinch del navegador: no hay pinch propio del canvas. No confundir el zoom de accesibilidad del navegador con el zoom lógico del editor.
10. **Persistencia.** Cambiar texto a una marca única, alineación y opacidad; deshacer/rehacer. Guardar borrador en Más acciones y esperar confirmación. Pulsar Reabrir guardado y confirmar los valores. Recargar la página y pulsar Reabrir guardado otra vez. Imagen, árbol anidado y datos históricos deben mantenerse. Reabrir inicia una sesión nueva; no restaura el historial anterior.
11. **Recuperación y fallos.** Repetir sin haber guardado: reabrir debe informar la ausencia, sin borrar contenido. Si el almacenamiento está bloqueado, guardar debe informar el error y no simular éxito. Borrar datos del navegador elimina el borrador: documentarlo. Exportar JSON como respaldo manual antes de limpiar datos o cambiar de origen.
12. **Preview y navegación.** Entrar/salir de vista previa, verificar imagen, efectos y enlaces. En preview los enlaces de nueva pestaña mantienen el comportamiento del navegador; volver al editor sin perder datos. No ejecutar compras, formularios externos ni publicaciones reales.

## Capacidades del navegador

- El playground no ofrece fullscreen como requisito de aceptación. Si se prueba desde una integración que sí lo expone, detectar soporte y requerir gesto del usuario. Si Safari/iPhone no ofrece fullscreen de elementos, registrar NO SOPORTADO; no simularlo con una captura ni prometer paridad con WebKit de escritorio.
- El color picker y selects son nativos y su presentación depende del sistema. Registrar limitaciones reales de teclado, foco, viewport y accesibilidad.
- La URL LAN usa HTTP. APIs que requieran contexto seguro pueden no estar disponibles; no instalar certificados, habilitar flags inseguros ni desactivar protecciones para ocultarlo.
- Cada pendiente físico sigue pendiente aunque la emulación equivalente haya aprobado.

## Aceptación

Adjuntar resultados de ambos dispositivos, defectos y decisiones sobre casos no soportados. Los fallos funcionales requieren corrección y una prueba dirigida antes de aprobar. La aprobación física **no publica** el paquete: la autorización de npm, tag definitivo y adopción de consumidores es posterior e independiente.
