import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout for the /suppliers branch. The list lives in suppliers.index.tsx and the
// detail in suppliers.$slug.tsx; this only provides the <Outlet> so the detail page
// renders on its own (and does not inherit the list's canonical / CollectionPage head).
export const Route = createFileRoute("/$locale/suppliers")({
  component: () => <Outlet />,
});
