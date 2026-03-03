import type { Preview } from "@storybook/react-vite";
import "../src/index.css";

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
    (Story) => (
      <div
        style={{
          width: "100%",
          minWidth: "min(1440px, 98vw)",
          padding: "1rem",
          borderRadius: "12px",
          background: "var(--color-app-bg)",
          color: "var(--color-app-fg)",
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default globalLayout;
