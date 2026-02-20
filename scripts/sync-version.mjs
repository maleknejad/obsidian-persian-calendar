//? Syncs the plugin version using "manifest.json" as the source of truth.
//? Updates package.json and versions.json accordingly.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

const manifestPath = path.join(root, "manifest.json");
const versionsPath = path.join(root, "versions.json");
const packagePath = path.join(root, "package.json");

function readJson(file) {
	if (!existsSync(file)) {
		throw new Error(`Missing file: ${file}`);
	}
	return JSON.parse(readFileSync(file, "utf8"));
}

function writeJson(file, data, indent = 2) {
	writeFileSync(file, JSON.stringify(data, null, indent) + "\n", "utf8");
}

// manifest.json
const manifest = readJson(manifestPath);

const { version: targetVersion, minAppVersion } = manifest;

if (!targetVersion) throw new Error("manifest.json is missing 'version' field.");
if (!minAppVersion) throw new Error("manifest.json is missing 'minAppVersion' field.");

console.log(`Target version: ${targetVersion}`);
console.log(`Min app version: ${minAppVersion}`);

// package.json
const packageJson = readJson(packagePath);
if (packageJson.version !== targetVersion) {
	packageJson.version = targetVersion;
	writeJson(packagePath, packageJson, 2);
	console.log("package.json synced");
} else {
	console.log("package.json already synced");
}

// versions.json
const newVersions = {
	[targetVersion]: minAppVersion,
};
writeJson(versionsPath, newVersions, "\t");
console.log("versions.json replaced with latest version");
