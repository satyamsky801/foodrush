import EmptyState from '../components/EmptyState';

export default function NotFoundPage() {
  return (
    <div className="container-app py-20">
      <EmptyState
        icon="🍽️"
        title="404 — Page not found"
        description="Oops! This page seems to have been eaten. Let's get you back to something delicious."
        actionLabel="Back to home"
        actionTo="/"
      />
    </div>
  );
}
