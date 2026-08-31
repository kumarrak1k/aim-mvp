/**
 * Route-level skeleton for the practice dashboard (SSR reads the DB on
 * load): a branded pulse in place of a blank screen while the page streams
 * in. Uses theme tokens so it renders correctly in both modes.
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl animate-pulse space-y-6">
        <div className="mx-auto h-10 w-64 max-w-full rounded-full bg-recess-20" />
        <div className="mx-auto h-4 w-80 max-w-full rounded-full bg-recess-15" />
        <div className="h-56 rounded-[2rem] bg-recess-15" />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="h-36 rounded-[2rem] bg-recess-15" />
          <div className="h-36 rounded-[2rem] bg-recess-15" />
          <div className="h-36 rounded-[2rem] bg-recess-15" />
        </div>
      </div>
    </div>
  );
}
