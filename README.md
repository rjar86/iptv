# Iptv

Esta es una aplicacion que simula un portal para visualizacion de canales gratuitos de IpTv, desarrollada en angular
y con personalizacion de modo claro/ oscuro

## Características principales

- Canal filtrado de "anime" al ingresar.
- Guia de canales del filtro en el panel derecho.
- Pagina de guia de canales completa
- Modo claro / oscuro persistente
- Diseño responsive (mobile-first)

## Tecnologías utilizadas

- Angular 21 (standalone components)
- TypeScript
- Tailwind CSS v4
- GitHub de catalogo de iptv
- Angular Material v21
- RxJS

## Demo

https://iptvrjar.netlify.app/home

## Instalación y uso local

### Clonar el repositorio

- git clone https://github.com/rjar86/iptv
- cd iptv

### Instalar dependencias

- npm install

### Ejecutar en desarrollo

- ng serve

### Abrir en el navegador:

- http://localhost:4200

## Estructura del proyecto (resumen)

-
- │
- ├─ src/
- │ ├─ app/
- │ │ ├─ core/
- │ │ │ ├─ interfaces/ # Modelos de listado de canales
- │ │ │ ├─ service/ # Servicios base / API
- │ │ │
- │ │ ├─ environments/
- │ │ │ ├─ environment.development # API de desarrollo
- │ │ │ ├─ envirionment # API de produccion
- │ │ ├─ layout/
- │ │ │ ├─ header/ # header principal
- │ │ │ ├─ footer/ # Footer
- │ │ │ ├─ layout.html # Layout base
- │ │ │ └─ layout.ts
- │ │ │
- │ │ ├─ pages/
- │ │ │ ├─ about/ # pagina de informacion
- │ │ │ ├─ error-page/ # pagina de error
- │ │ │ ├─ guide/ # guia de canales
- │ │ │ └─ home/ # pagina principal
- │ │ │
- │ │ └─ index.html
- │ │
- │ ├─ main.ts
- │ └─ styles.css # Tailwind CSS v4 + tokens de tema
- │

## API utilizada

Catalogo IpTV

- https://iptv-org.github.io/iptv/index.m3u

## Estado del proyecto

- Funcional
- En mejora continua
- Pensado como demo profesional / portfolio

## Licencia

Este proyecto es solo con fines educativos y demostrativos.

## Autor

- Ricardo Aguilar
- Fullstack Developer
- Portfolio: https://rjarportafolio.netlify.app/
- LinkedIn: https://www.linkedin.com/in/ingrjar86/
- GitHub: https://github.com/rjar86
