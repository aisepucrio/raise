import type { Preview } from "@storybook/react-vite";
import "../src/index.css";

type WrapperSize = "small" | "medium" | "large";
const DEFAULT_WRAPPER_SIZE: WrapperSize = "medium";

const WRAPPER_WIDTH_BY_SIZE: Record<WrapperSize, string> = {
  small: "520px",
  medium: "960px",
  large: "1440px",
};

function isWrapperSize(value: unknown): value is WrapperSize {
  return value === "small" || value === "medium" || value === "large";
}

const globalLayout: Preview = {
  parameters: {
    layout: "centered",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      story: {
        inline: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const configuredSize = context.parameters.wrapperSize;
      const wrapperSize =
        (isWrapperSize(configuredSize) && configuredSize) || DEFAULT_WRAPPER_SIZE;

      return (
        <div
          style={{
            width: "100%",
            maxWidth: WRAPPER_WIDTH_BY_SIZE[wrapperSize],
            marginInline: "auto",
            padding: "1rem",
            boxSizing: "border-box",
            borderRadius: "12px",
            background: "var(--color-app-bg)",
            color: "var(--color-app-fg)",
          }}
        >
          <Story />
        </div>
      );
    },
  ],
};

export default globalLayout;
