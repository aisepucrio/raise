/* Contexto para compartilhar/trocar o source selecionado globalmente na aplicação. */

import { createContext, useContext, useState, type ReactNode } from "react";
import { defaultSourceId, type SourceId } from "@/sources";

type SourceContextValue = {
  source: SourceId;
  setSource: (source: SourceId) => void;
};

const SourceContext = createContext<SourceContextValue | null>(null);

function SourceProvider({ children }: { children: ReactNode }) {
  const [source, setSource] = useState<SourceId>(defaultSourceId);

  return (
    <SourceContext.Provider value={{ source, setSource }}>
      {children}
    </SourceContext.Provider>
  );
}

function useSource() {
  const context = useContext(SourceContext);

  if (!context) {
    throw new Error("useSource must be used within SourceProvider");
  }

  return context;
}

export { SourceProvider, useSource };
export type { SourceId };
