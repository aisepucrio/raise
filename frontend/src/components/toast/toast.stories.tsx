import type { Meta, StoryObj } from "@storybook/react-vite";
import { ThemeProvider, useAppTheme } from "@/lib/theme-context";

import { Toast, toast, type ToastProps } from "./index";

function ToastDemo(props: ToastProps) {
  const { theme, setTheme } = useAppTheme();

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-(--color-secondary-soft) p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">Current theme: {theme}</p>
          <div className="inline-flex rounded-lg border border-(--color-secondary-soft) p-1">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`rounded-md px-3 py-1 text-sm transition ${
                theme === "light"
                  ? "bg-(--color-secondary) text-(--color-primary)"
                  : "text-(--color-secondary) opacity-70 hover:opacity-100"
              }`}
            >
              Light
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`rounded-md px-3 py-1 text-sm transition ${
                theme === "dark"
                  ? "bg-(--color-secondary) text-(--color-primary)"
                  : "text-(--color-secondary) opacity-70 hover:opacity-100"
              }`}
            >
              Dark
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              toast("Update completed", {
                description: "Quick feedback for common interface actions.",
              })
            }
            className="rounded-md border border-(--color-secondary-soft) px-3 py-2 text-sm"
          >
            Toast standard
          </button>

          <button
            type="button"
            onClick={() =>
              toast.success("Record saved", {
                description: "Example of temporary visual confirmation.",
              })
            }
            className="rounded-md border border-(--color-secondary-soft) px-3 py-2 text-sm"
          >
            success
          </button>

          <button
            type="button"
            onClick={() =>
              toast.info("Syncing data", {
                description: "Informational message without blocking the flow.",
              })
            }
            className="rounded-md border border-(--color-secondary-soft) px-3 py-2 text-sm"
          >
            Info
          </button>

          <button
            type="button"
            onClick={() =>
              toast.warning("Filter warning", {
                description: "Example of warning for review of parameters.",
              })
            }
            className="rounded-md border border-(--color-secondary-soft) px-3 py-2 text-sm"
          >
            warning
          </button>

          <button
            type="button"
            onClick={() =>
              toast.error("Failed to process request", {
                description: "Example of error feedback for an operation.",
              })
            }
            className="rounded-md border border-(--color-secondary-soft) px-3 py-2 text-sm"
          >
            error
          </button>
        </div>
      </div>

      <Toast {...props} />
    </div>
  );
}

const meta = {
  title: "Components/Toast",
  component: Toast,
  tags: ["autodocs"],
  args: {
    closeButton: true,
    richColors: true,
    position: "top-right",
  },
  argTypes: {
    closeButton: {
      control: { type: "boolean" },
      description: "Displays a close button on each toast.",
      table: { type: { summary: "boolean" } },
    },
    richColors: {
      control: { type: "boolean" },
      description: "Enables color palette by type (success, error, etc.).",
      table: { type: { summary: "boolean" } },
    },
    position: {
      control: { type: "select" },
      options: [
        "top-left",
        "top-center",
        "top-right",
        "bottom-left",
        "bottom-center",
        "bottom-right",
      ],
      description: "Position of the toast container on screen.",
      table: { type: { summary: "ToasterProps['position']" } },
    },
    className: {
      control: false,
      description: "Additional CSS class for the container.",
      table: { type: { summary: "string" } },
    },
    icons: {
      control: false,
      description: "Optional icon mapping by toast type.",
      table: { type: { summary: "ToasterProps['icons']" } },
    },
    style: {
      control: false,
      description: "Optional inline styles for the container.",
      table: { type: { summary: "CSSProperties" } },
    },
    theme: {
      control: false,
      description: "Visual theme used by the toast container.",
      table: { type: { summary: "ToasterProps['theme']" } },
    },
    toastOptions: {
      control: false,
      description: "Default configuration applied to triggered toasts.",
      table: { type: { summary: "ToasterProps['toastOptions']" } },
    },
  },
  parameters: {
    wrapperSize: "small",
    layout: "centered",
    docs: {
      description: {
        component:
          "Toast component based on Sonner to show temporary feedback.",
      },
    },
  },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <ThemeProvider>
      <ToastDemo {...args} />
    </ThemeProvider>
  ),
  parameters: {
    docs: {
      description: {
        story: "Use buttons to trigger toast examples and toggle theme.",
      },
    },
  },
};
