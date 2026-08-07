import Link from "next/link";

/** Root fallback when a locale segment is unavailable. */
export default function RootNotFound() {
  return (
    <html lang="en">
      <body style={{fontFamily: "system-ui, sans-serif", padding: "48px 24px"}}>
        <main>
          <h1 style={{fontSize: "1.75rem", fontWeight: 600}}>Page Not Found</h1>
          <p style={{marginTop: 12, color: "#475569"}}>
            The page you&apos;re looking for may have been moved, renamed or no longer exists.
          </p>
          <p style={{marginTop: 24}}>
            <Link href="/" style={{color: "#2563eb", fontWeight: 600}}>
              Go Home
            </Link>
            {" · "}
            <Link href="/search" style={{color: "#2563eb", fontWeight: 600}}>
              Explore Tools
            </Link>
          </p>
        </main>
      </body>
    </html>
  );
}
