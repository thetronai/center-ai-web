import { Suspense } from "react";
import { MonitoringView } from "./MonitoringView";

export default function MonitoringPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-zinc-500">Loading…</div>}>
      <MonitoringView />
    </Suspense>
  );
}
