import type { Meta, StoryObj } from "@storybook/react-vite";
import { ThemeProvider, useAppTheme } from "@/lib/theme-context";

import { Toast, toast, type ToastProps } from "./index";

function ToastDemo(props: ToastProps) {
  const { theme, setTheme } = useAppTheme();

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-(--color-secondary-soft) p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">Tema atual: {theme}</p>
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
              toast("Atualização concluída", {
                description: "Feedback rápido para ações comuns da interface.",
              })
            }
            className="rounded-md border border-(--color-secondary-soft) px-3 py-2 text-sm"
          >
            Toast padrão
          </button>

          <button
            type="button"
            onClick={() =>
              toast.success("Registro salvo", {
                description: "Exemplo de confirmação visual temporária.",
              })
            }
            className="rounded-md border border-(--color-secondary-soft) px-3 py-2 text-sm"
          >
            Sucesso
          </button>

          <button
            type="button"
            onClick={() =>
              toast.info("Sincronizando dados", {
                description: "Mensagem informativa sem bloquear o fluxo.",
              })
            }
            className="rounded-md border border-(--color-secondary-soft) px-3 py-2 text-sm"
          >
            Info
          </button>

          <button
            type="button"
            onClick={() =>
              toast.warning("Atenção ao filtro", {
                description: "Exemplo de aviso para revisão de parâmetros.",
              })
            }
            className="rounded-md border border-(--color-secondary-soft) px-3 py-2 text-sm"
          >
            Aviso
          </button>

          <button
            type="button"
            onClick={() =>
              toast.error("Falha ao processar", {
                description: "Exemplo de erro para feedback de operação.",
              })
            }
            className="rounded-md border border-(--color-secondary-soft) px-3 py-2 text-sm"
          >
            Erro
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
    className: { control: false },
    icons: { control: false },
    style: { control: false },
    theme: {
      control: false,
      description: "Tema visual usado pelo container de toasts.",
    },
    toastOptions: { control: false },
  },
  parameters: {
    wrapperSize: "small",
    layout: "centered",
    docs: {
      description: {
        component:
          "Componente `Toast` baseado no `Sonner` para exibir feedbacks temporários.",
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
        story: "Use os botões para disparar exemplos de toast e alternar o tema.",
      },
    },
  },
};
