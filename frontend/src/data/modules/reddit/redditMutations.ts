import { useMutation } from "@tanstack/react-query";

export function useRedditExportMutation() {
  return useMutation({
    mutationFn: async () => {
      const data = { message: "Reddit export successful" };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "reddit_export.json";
      a.click();
    },
  });
}