import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/supplier-portal")({
  beforeLoad: () => {
    throw redirect({ to: "/suppliers" });
  },
});
