import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts', 'src/client.ts', 'src/recipes.ts', 'src/types.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    splitting: false,
});
