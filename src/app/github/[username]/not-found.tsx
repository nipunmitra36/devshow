import { ErrorState } from "@/components/states";

export default function UserNotFound() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <ErrorState
        variant="not-found"
        title="GitHub user not found"
        body="We couldn't find a GitHub account with that username. Check the spelling and try again."
      />
    </div>
  );
}
