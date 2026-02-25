import type { Preview } from "@storybook/react-vite";
import "../src/index.css";

const preview: Preview = {
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
          width: "min(560px, 92vw)",
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

export default preview;
