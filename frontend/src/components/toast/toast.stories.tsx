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
                description: "Feedback quick for actions comuns of the interface.",
              })
            }
            className="rounded-md border border-(--color-secondary-soft) px-3 py-2 text-sm"
          >
            Toast standard
          </button>

          <button
            type="button"
            onClick={() =>
              toast.success("record salvo", {
                description: "Example of confirmation visual temporary.",
              })
            }
            className="rounded-md border border-(--color-secondary-soft) px-3 py-2 text-sm"
          >
            success
          </button>

          <button
            type="button"
            onClick={() =>
              toast.info("Sincronizando date", {
                description: "message informativa without bloquear the fluxo.",
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
              toast.error("failure to processar", {
                description: "Example of error for feedback of operation.",
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
      description: "displays button of close in each toast.",
      table: { type: { summary: "boolean" } },
    },
    richColors: {
      control: { type: "boolean" },
      description: "Ativa paleta of cores for tipo (success, error etc.).",
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
      description: "position of the container of toasts in the screen.",
      table: { type: { summary: "ToasterProps['position']" } },
    },
    className: {
      control: false,
      description: "Classe CSS adicional of the container.",
      table: { type: { summary: "string" } },
    },
    icons: {
      control: false,
      description: "Mapeamento optional of icons for tipo of toast.",
      table: { type: { summary: "ToasterProps['icons']" } },
    },
    style: {
      control: false,
      description: "Estilos inline optional of the container.",
      table: { type: { summary: "CSSProperties" } },
    },
    theme: {
      control: false,
      description: "theme visual used pelo container of toasts.",
      table: { type: { summary: "ToasterProps['theme']" } },
    },
    toastOptions: {
      control: false,
      description: "configurations standard aplieachs to the toasts disparados.",
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
        story: "Use the buttons to trigger Examples of toast and toggle the theme.",
      },
    },
  },
};
