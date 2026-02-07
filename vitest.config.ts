import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
	test: {
		environment: "node",
	},
	resolve: {
		alias: {
			src: path.resolve(__dirname, "src"),
		},
	},
});
