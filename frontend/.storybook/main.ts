import type { StorybookConfig } from "@storybook/react-vite";
import { fileURLToPath } from "node:url";
import { mergeConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
  async viteFinal(baseConfig) {
    return mergeConfig(baseConfig, {
      plugins: [tailwindcss()],
      resolves: {
        alias: {
          "@": fileURLToPath(new URL("../src", import.meta.url)),
        },
      },
    });
  },
};

export default config;
