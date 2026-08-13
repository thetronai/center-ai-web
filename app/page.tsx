import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <p className="text-zinc-500">Center AI Vision — web app</p>
      <Link href="/monitoring" className="text-sm font-medium text-blue-600 underline">
        Go to Monitoring →
      </Link>
    </div>
  );
}
