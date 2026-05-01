import { createFileRoute } from "@tanstack/react-router";
import VoccaImagingConfigApp from "@/components/VoccaImagingConfigApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vocca — Configuration assistant vocal" },
      { name: "description", content: "Configurez Vocca, l'assistant vocal IA pour centres d'imagerie médicale, en quelques étapes guidées." },
    ],
  }),
  component: Index,
});

function Index() {
  return <VoccaImagingConfigApp />;
}
