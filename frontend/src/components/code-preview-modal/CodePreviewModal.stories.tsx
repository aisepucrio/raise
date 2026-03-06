import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@/components/button";
import { ThemeProvider } from "@/lib/theme-context";
import { CodePreviewModal } from "./CodePreviewModal";

type PreviewValue =
  | string
  | number
  | boolean
  | null
  | Record<string, string | number | boolean | null | string[]>;

function InteractiveDemo() {
  const [open, setOpen] = useState(false);
  const [previewValue, setPreviewValue] = useState<PreviewValue>(null);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          text="Open JSON"
          fullWidth={false}
          className="min-h-9 px-3 py-1.5"
          onClick={() => {
            setPreviewValue({
              id: 381,
              repository: "facebook/react",
              state: "open",
              labels: ["bug", "typescript"],
            });
            setOpen(true);
          }}
        />

        <Button
          text="Open Text"
          fullWidth={false}
          className="min-h-9 px-3 py-1.5"
          onClick={() => {
            setPreviewValue("Small plain text preview for debugging.");
            setOpen(true);
          }}
        />
      </div>

      <CodePreviewModal
        open={open}
        onClose={() => setOpen(false)}
        value={previewValue}
      />
    </div>
  );
}

const meta = {
  title: "Components/CodePreviewModal",
  component: CodePreviewModal,
  tags: ["autodocs"],
  argTypes: {
    open: {
      control: { type: "boolean" },
      description: "Controls whether the preview modal is open.",
      table: { type: { summary: "boolean" } },
    },
    onClose: {
      control: false,
      description: "Callback executed to close the modal.",
      table: { type: { summary: "() => void" } },
    },
    value: {
      control: false,
      description: "Content rendered in the code block (text or JSON).",
      table: {
        type: {
          summary:
            "string | number | boolean | null | Record<string, string | number | boolean | null | string[]>",
        },
      },
    },
    dialogLabel: {
      control: { type: "text" },
      description: "Accessible dialog name for screen readers.",
      table: { type: { summary: "string" }, defaultValue: { summary: "Cell content preview" } },
    },
  },
  parameters: {
    wrapperSize: "large",
    docs: {
      description: {
        component:
          "Modal to inspect content as text or JSON, with copy option.",
      },
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <div className="rounded-xl border border-(--color-secondary-soft) bg-(--color-primary) p-6 text-(--color-secondary)">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
} satisfies Meta<typeof CodePreviewModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <InteractiveDemo />,
  parameters: {
    docs: {
      description: {
        story: "Interactive test with modal opening for JSON and plain text.",
      },
    },
  },
};
