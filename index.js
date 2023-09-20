const chokidar = require("chokidar");
const fs = require("fs");
const path = require("path");

const ALLOWED_EXTENSIONS = [".jpg", ".png", ".svg", ".gif"];

function generateDTsFilename(imagePath) {
  return `${imagePath}.d.ts`;
}

function createDTsContent(imageName) {
  const variableName = "I_" + imageName.toUpperCase().replace(/\W/g, "_");
  return `declare const ${variableName}: ImageMetadata;\nexport default ${variableName};\n`;
}

const targetDirectory = process.argv[2];

// コマンドライン引数でのディレクトリ指定が必須
if (!targetDirectory) {
  console.error("Error: You must specify a directory path.");
  process.exit(1);
}

// 指定されたディレクトリが存在しない場合もエラーで終了
if (
  !fs.existsSync(targetDirectory) ||
  !fs.statSync(targetDirectory).isDirectory()
) {
  console.error(
    `Error: The specified directory "${targetDirectory}" does not exist or is not a directory.`
  );
  process.exit(1);
}

const watcher = chokidar.watch(targetDirectory, {
  persistent: true,
  depth: 99,
  ignored: [path.join(targetDirectory, "**/*.d.ts")],
});

watcher
  .on("add", (filePath) => {
    const fileExtension = path.extname(filePath);
    if (ALLOWED_EXTENSIONS.includes(fileExtension)) {
      const dtsFilename = generateDTsFilename(filePath);
      if (!fs.existsSync(dtsFilename)) {
        const baseName = path.basename(filePath, fileExtension);
        const dtsContent = createDTsContent(baseName);
        fs.writeFileSync(dtsFilename, dtsContent);
        console.log(`Generated .d.ts for ${filePath}`);
      }
    }
  })
  .on("unlink", (filePath) => {
    const dtsPath = generateDTsFilename(filePath);
    if (fs.existsSync(dtsPath)) {
      fs.unlinkSync(dtsPath);
      console.log(`Deleted .d.ts for ${filePath}`);
    }
  });

console.log(`Watching for changes in ${targetDirectory}`);
