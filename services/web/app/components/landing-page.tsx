import React from "react";
import Link from "next/link";
import Header from "./ui/Header";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[var(--bg-page)] bg-dotted-grid">
      <Header isAuthenticated={false} />

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-[var(--bg-page)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-[var(--text-primary)] mb-6">
              Secure Your Digital Legacy with
              <span className="text-[var(--accent)] block">
                Blockchain Technology
              </span>
            </h1>
            <p className="text-xl text-[var(--text-muted)] mb-8 max-w-4xl mx-auto">
              WillChain revolutionizes digital inheritance by providing secure,
              automated transfer of crypto assets and digital wealth to your
              beneficiaries.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="bg-[var(--accent)] hover:opacity-90 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg text-center"
              >
                Create Your Digital Will
              </Link>
              <button className="border-2 border-[var(--border-section)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] px-8 py-4 rounded-lg text-lg font-semibold transition-colors">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="py-20 bg-[var(--bg-section)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Secure & Immutable */}
            <div className="text-center p-6 rounded-lg bg-[var(--bg-card)] border border-[var(--border-section)]">
              <div className="w-16 h-16 bg-[var(--accent)]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-[var(--accent)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                Secure & Immutable
              </h3>
              <p className="text-[var(--text-muted-alt)] text-sm">
                Blockchain-based smart contracts ensure your digital assets are
                protected and tamper-proof.
              </p>
            </div>

            {/* Automated Transfer */}
            <div className="text-center p-6 rounded-lg bg-[var(--bg-card)] border border-[var(--border-section)]">
              <div className="w-16 h-16 bg-[var(--accent)]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-[var(--accent)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                Automated Transfer
              </h3>
              <p className="text-[var(--text-muted-alt)] text-sm">
                Set conditions for asset transfer based on inactivity, time
                delays, or multi-sig validation.
              </p>
            </div>

            {/* Multiple Beneficiaries */}
            <div className="text-center p-6 rounded-lg bg-[var(--bg-card)] border border-[var(--border-section)]">
              <div className="w-16 h-16 bg-[var(--accent)]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-[var(--accent)]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                Multiple Beneficiaries
              </h3>
              <p className="text-[var(--text-muted-alt)] text-sm">
                Easily designate and manage multiple beneficiaries with
                customizable asset allocation.
              </p>
            </div>

            {/* Document Storage */}
            <div className="text-center p-6 rounded-lg bg-[var(--bg-card)] border border-[var(--border-section)]">
              <div className="w-16 h-16 bg-[var(--accent)]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-[var(--accent)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                Document Storage
              </h3>
              <p className="text-[var(--text-muted-alt)] text-sm">
                Store important documents and instructions securely using IPFS
                technology.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 bg-[var(--bg-page)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-[var(--accent)] mb-2">
                $3.8B+
              </div>
              <p className="text-[var(--text-muted-alt)]">
                Lost crypto annually due to poor estate planning
              </p>
            </div>
            <div>
              <div className="text-4xl font-bold text-[var(--accent)] mb-2">
                20%
              </div>
              <p className="text-[var(--text-muted-alt)]">
                Of Bitcoin is estimated to be lost forever
              </p>
            </div>
            <div>
              <div className="text-4xl font-bold text-[var(--accent)] mb-2">
                100%
              </div>
              <p className="text-[var(--text-muted-alt)]">
                Secure and automated with WillChain
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[var(--cta-bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--cta-text)] mb-4">
            Ready to Secure Your Digital Legacy?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
            Join thousands of users who trust WillChain to protect their digital
            assets and ensure their wishes are honored.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-white text-[var(--cta-bg)] px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
          >
            Get Started Today
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
