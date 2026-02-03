//? remove "data.json" before run dev

import fs from "fs";
import path from "path";

const dataFilePath = path.resolve(process.cwd(), "data.json");

if (fs.existsSync(dataFilePath)) {
	fs.unlinkSync(dataFilePath);
	console.log("data.json removed => successfuly");
} else {
	console.log("data.json not found, nothing to clean => successfuly");
}
