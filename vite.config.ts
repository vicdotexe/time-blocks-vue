import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";
import Components from "unplugin-vue-components/vite";
import path from "path";
import pkg from "./package.json";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    dts({
      entryRoot: "src",
      staticImport: true,
      compilerOptions: {
        skipLibCheck: true,
      },
    }),
    Components({
      dts: false,
      extensions: ["vue", "ts"],
      include: [/\.vue$/, /\.ts$/, /\.vue\?vue/],
    }),
  ],
  build: {
    lib: {
      // src/indext.ts is where we have exported the component(s)
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "TimeBlocksVue",
      // the name of the output files when the build is run
      fileName: "time-blocks-vue",
    },
    outDir: "dist",
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ["vue", "date-fns"],
      output: {
        globals: {
          vue: "Vue",
          "date-fns": "dateFns",
        },
      },
    },
  },
});
