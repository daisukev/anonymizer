/* Simple bundler that combines the html, css, and JS files */
import fs, { unlink } from "fs";
import { minify } from "html-minifier";
import path from "path";
import { exit } from "process";
import { fileURLToPath } from "url";

const html = "xml-anonymizer.html";
const script = "xml.js";
const css = "styles.css";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcPath = "" + __dirname + "/src/";
const htmlFilePath = path.join(srcPath, html);
const jsFilePath = path.join(srcPath, script);
const cssFilePath = path.join(srcPath, css);
const outputPath = path.join(__dirname, "/dist/anonymizer.html");

console.log(`Deleting ${outputPath}...`);
unlink(outputPath, (err) => {
  if (err) console.error("error,", err);
  else {
    console.log(
      `\x1b[32m${outputPath}\x1b[0m deleted successfully, building...`
    );
    console.log("bundling files...");
    /* Read in individual files */
    const htmlContent = fs.readFileSync(htmlFilePath, "utf8");
    const jsContent = fs.readFileSync(jsFilePath, "utf8");
    const cssContent = fs.readFileSync(cssFilePath, "utf8");

    /* Replace External Script with inline JS */
    let bundledHTML = htmlContent.replace(
      /<script\s+src=["']xml.js["']><\/script>/,
      `<script>${jsContent}</script>`
    );

    /* Replace External Stylesheet with inline CSS */
    bundledHTML = bundledHTML.replace(
      /<link\s+rel=["']stylesheet["']\s+href=["']styles\.css["']\s*\/>/,
      `<style>${cssContent}</style>`
    );

    const minifiedHtml = minify(bundledHTML, {
      collapseWhitespace: true,
      removeComments: true,
      minifyCSS: true,
      minifyJS: true,
    });

    fs.writeFileSync(outputPath, minifiedHtml, "utf8");
    console.log(`Bundled file created at: \x1b[32m${outputPath}`);
  }
});
