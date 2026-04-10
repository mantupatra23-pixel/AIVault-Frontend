import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="bg-white min-h-screen selection:bg-blue-100">
      <div className="max-w-4xl mx-auto px-6 py-24">
        {/* Header */}
        <header className="mb-20">
          <h1 className="text-6xl md:text-8xl font-black text-gray-900 tracking-tighter mb-6">
            Privacy<span className="text-blue-600">.</span>
          </h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
            Last Updated: April 2026 • AIVault Infrastructure
          </p>
        </header>

        {/* Content Section */}
        <div className="prose prose-lg max-w-none text-gray-600 leading-relaxed space-y-12">
          
          <section>
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-4">1. Introduction</h2>
            <p>
              Welcome to <strong>AIVault</strong> (accessible at aivault.vercel.app). We are committed to protecting your personal information and your right to privacy. This policy explains how we handle your data when you visit our AI directory.
            </p>
          </section>

          <section className="border-l-4 border-blue-600 pl-8 py-2">
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-4">2. Information We Collect</h2>
            <p>
              We do not require users to create accounts. However, we may collect minimal data such as:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Log Data:</strong> IP addresses, browser type, and pages visited.</li>
              <li><strong>Cookies:</strong> To improve user experience and analyze traffic.</li>
              <li><strong>Search Queries:</strong> To improve our tool recommendation engine.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-4">3. Google AdSense & Cookies</h2>
            <p>
              AIVault uses Google AdSense to serve ads. Google, as a third-party vendor, uses cookies to serve ads based on your visit to this site and other sites on the Internet. 
            </p>
            <p className="mt-4">
              Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" className="text-blue-600 underline">Google Ad Settings</a>.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-4">4. Third-Party Links</h2>
            <p>
              Our directory contains links to external AI tool websites. We are not responsible for the privacy practices or content of these third-party sites. Please review their policies before engaging.
            </p>
          </section>

          <section className="bg-gray-50 p-10 rounded-[2.5rem]">
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-4">5. Contact Mantu Patra</h2>
            <p className="mb-6">
              If you have questions about this policy, please reach out directly:
            </p>
            <div className="font-bold text-gray-900">
              Email: <a href="mailto:support@aivault.app" className="text-blue-600">support@aivault.app</a><br />
              Location: Brahmapur, Odisha, India
            </div>
          </section>
        </div>

        {/* Back Link */}
        <footer className="mt-20 pt-10 border-t border-gray-100">
          <Link href="/" className="text-sm font-black text-blue-600 uppercase tracking-widest hover:opacity-70 transition-all">
            ← Return to Vault
          </Link>
        </footer>
      </div>
    </div>
  );
}
