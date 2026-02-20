//? remove build files

import fs from "fs";
import path from "path";

const root = process.cwd();

const filesToRemove = ["data.json", "styles.css", "main.js"];

function removeFile(relativePath) {
	const fullPath = path.resolve(root, relativePath);

	if (fs.existsSync(fullPath)) {
		try {
			fs.unlinkSync(fullPath);
			console.log(`✔ ${relativePath} removed successfully`);
		} catch (err) {
			console.error(`✖ Failed to remove ${relativePath}`);
			console.error(err);
		}
	} else {
		console.log(`✔ ${relativePath} not found (skipped)`);
	}
}

filesToRemove.forEach(removeFile);
