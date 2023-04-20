import * as esbuild from 'esbuild'

let ctx = await esbuild.context({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: "node",
    packages: "external",
    outdir: "./dist",
})

await ctx.watch()
console.log('watching...')