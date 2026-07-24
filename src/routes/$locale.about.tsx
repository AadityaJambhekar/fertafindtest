import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/about")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/$locale", params: { locale: params.locale }, hash: "how" });
  },
  component: () => null,
});
