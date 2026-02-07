//? Syncs the plugin version using "manifest.json" as the source of truth.
//? Updates package.json and versions.json accordingly.

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

const manifestPath = path.join(root, "manifest.json");
const versionsPath = path.join(root, "versions.json");
const packagePath = path.join(root, "package.json");

const manifestRaw = readFileSync(manifestPath, "utf8");
const manifest = JSON.parse(manifestRaw);

const targetVersion = manifest.version;
const minAppVersion = manifest.minAppVersion;

if (!targetVersion) {
	throw new Error("manifest.json is missing 'version' field.");
}
if (!minAppVersion) {
	throw new Error("manifest.json is missing 'minAppVersion' field.");
}

// package.json
const packageRaw = readFileSync(packagePath, "utf8");
const packageJson = JSON.parse(packageRaw);

if (packageJson.version !== targetVersion) {
	packageJson.version = targetVersion;
	writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + "\n", "utf8");
	console.log(`package.json version → ${targetVersion}`);
} else {
	console.log("package.json is already in sync with manifest.");
}

// versions.json
const versionsRaw = readFileSync(versionsPath, "utf8");
const versions = JSON.parse(versionsRaw);

if (versions[targetVersion] !== minAppVersion) {
	versions[targetVersion] = minAppVersion;
	writeFileSync(versionsPath, JSON.stringify(versions, null, "\t") + "\n", "utf8");
	console.log(`versions.json → ${targetVersion}: ${minAppVersion}`);
} else {
	console.log("versions.json is already up to date for this version.");
}
