import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import tempDir from 'temp-dir';
import {uglify} from 'rollup-plugin-uglify';
import commonjs from 'rollup-plugin-commonjs';

export default () => {
    return [
        {
            input: 'src/index.ts',
            output: {
                file: 'build/index.min.js',
                name: 'project',
                format: 'iife',
                sourcemap: true,
            },
            treeshake: {
                propertyReadSideEffects: false,
            },
            plugins: [
                resolve(),
                commonjs(),
                typescript({
                    cacheRoot: `${tempDir}/.rpt2_cache`,
                    useTsconfigDeclarationDir: true,
                }),
                uglify({
                    compress: {
                        unused: true,
                        dead_code: true,
                    },
                }),
            ],
        },
    ];
};
