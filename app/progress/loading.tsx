/**
 * Route-level skeleton for the progress dashboard (server component with
 * several DB reads): a branded pulse in place of a blank screen while the
 * page streams in. Uses theme tokens so it renders correctly in both modes.
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl animate-pulse space-y-6">
        <div className="mx-auto h-10 w-72 max-w-full rounded-full bg-recess-20" />
        <div className="mx-auto h-4 w-96 max-w-full rounded-full bg-recess-15" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-72 rounded-[2rem] bg-recess-15" />
          <div className="h-72 rounded-[2rem] bg-recess-15" />
        </div>
        <div className="h-44 rounded-[2rem] bg-recess-15" />
      </div>
    </div>
  );
}
