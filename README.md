<h1 align="center">ZombiaTauriClient</h1>

<div align="center">

![JavaScript](https://img.shields.io/badge/-JavaScript-05122A?style=flat&logo=javascript)&nbsp;
![SvelteKit](https://img.shields.io/badge/-SvelteKit-05122A?style=flat&logo=svelte)&nbsp;
![Tauri](https://img.shields.io/badge/-Tauri-05122A?style=flat&logo=tauri)&nbsp;
![Tailwind](https://img.shields.io/badge/-Tailwind-05122A?style=flat&logo=tailwindcss)&nbsp;

A change in direction <br />
🚧 Work in progress 🚧
</div>

## Installation
Only the release for Apple Silicon Macs is readily available. I haven't found a way to compile the server to binaries for other platforms & architectures. If you need to install the client for another platform/architecture, please follow the steps below:
<!-- Go to releases for the installers! Note that your browser might flag the download. For Windows, that is because it is a unsigned .exe file.  -->

## 1. Setup Tauri
Follow the prerequisites page for building Tauri ([here](https://v2.tauri.app/start/prerequisites/)).
(If any problems arise, please make an issue) <br>
Install npm dependencies if you haven't already:
```sh
npm i
```

## 2. Setup Sidecar
Run the following command:
```sh
npm run sidecar
```
This will build the server binary for your platform & architecture. (I would appreciate it a lot if you can contribute your binary build to the project by making an issue!)

## 3. Debug or build the client
### Debug
To debug, run:
```sh
npm run tauri dev
```
For development, I recommend you run both the sidecar command and tauri dev mode at the time:
```
npm run sidecar && npm run tauri dev
```

### Build
To build the client, run:
```sh
npm run tauri build
```

