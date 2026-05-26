# Precios Bimbo - Supermercados Uruguay

App para relevar precios de productos del Grupo Bimbo en Tata, Disco, Devoto y Tienda Inglesa.

## Instalación (una sola vez)

1. **Instalar Node.js**
   - Bajar de [nodejs.org](https://nodejs.org) la versión "LTS"
   - Instalar con todas las opciones por defecto
   - **Reiniciar la computadora** después de instalar (importante)

2. **Doble click en `INSTALAR.bat`**
   - Va a tardar unos minutos (descarga ~190 MB en total)
   - Cuando termine va a decir "Listo"

## Uso

Doble click en **`EJECUTAR.bat`**.

Tarda alrededor de 1-2 minutos. Cuando termina:
- Se abre solo la carpeta `data\output\`
- Ahí están los archivos: `bimbo_<fecha>.csv` y `bimbo_<fecha>.pdf`

## Marcas relevadas

- Bimbo
- Los Sorchantes
- Maestro Cubano
- Nutrabien
- Salmas
- Tía Rosa

## Si algo falla

- Verificá que Node.js esté instalado: abrí "cmd" y escribí `node --version` (tiene que mostrar v18 o superior).
- Si la app dice que algún super no responde, esperá 5 min y volvé a correrla. Los supers a veces bloquean temporalmente si detectan muchos pedidos seguidos.
