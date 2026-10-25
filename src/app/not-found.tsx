import { ErrorState } from "@/components/states";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <ErrorState variant="not-found" title="Page not found" body="The page you're looking for doesn't exist." />
    </div>
  );
}
