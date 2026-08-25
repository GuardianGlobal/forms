import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: {
			'#src': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
	test: {
		// 1. Tells Vitest to inject describe/it/expect into the global execution context
		globals: true,
		environment: 'node',
		include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
	},
});
