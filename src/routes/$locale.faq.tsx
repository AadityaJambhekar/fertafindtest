import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * The FAQ is a section of the homepage, not a page of its own. `/faq` is a natural URL for
 * people to try (and was referenced as one), so send it to the section in the SAME locale
 * rather than 404ing. Mirrors the existing /about -> /#how redirect.
 */
export const Route = createFileRoute("/$locale/faq")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/$locale", params: { locale: params.locale }, hash: "faq" });
  },
  component: () => null,
});
