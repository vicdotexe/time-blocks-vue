import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Components from "unplugin-vue-components/vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
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
      formats: ["es"],
    },
    outDir: "dist",
    emptyOutDir: false,
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
