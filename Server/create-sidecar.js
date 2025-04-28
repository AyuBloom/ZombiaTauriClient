const { execSync } = require("child_process");
// const fs = require("fs");

const ext = process.platform === "win32" ? ".exe" : "";

const rustInfo = execSync("rustc -vV");
const targetTriple = /host: (\S+)/g.exec(rustInfo)[1];
if (!targetTriple) {
  console.error("Failed to determine platform target triple");
}

for (let target of ["node22-macos-arm64" /*, "node22-macos-x64" */]) {
  execSync(
    `pkg ./Server/server.js --options expose-gc,max-old-space-size=512 --output ./src-tauri/binaries/server-${targetTriple}${ext} --target ${target}`,
  );
}
// fs.renameSync(`app${ext}`, `../src-tauri/binaries/app-${targetTriple}${ext}`);
