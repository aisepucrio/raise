import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@/components/button";
import { ThemeProvider } from "@/lib/theme-context";
import { CodePreviewModal } from "./CodePreviewModal";

function InteractiveDemo() {
  const [open, setOpen] = useState(false);
  const [previewValue, setPreviewValue] = useState<unknown>(null);

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
    onClose: { control: false },
  },
  parameters: {
    wrapperSize: "large",
    docs: {
      description: {
        component:
          "Modal para inspecionar conteúdo em texto ou JSON, com opção de copiar.",
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

export const Padrao: Story = {
  render: () => <InteractiveDemo />,
};
