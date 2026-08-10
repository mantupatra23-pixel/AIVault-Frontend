import Link from "next/link";

// Verify link rendering pattern matches singular route:
<Link key={tool.slug} href={`/tool/${tool.slug}`}>
  {tool.name}
</Link>
