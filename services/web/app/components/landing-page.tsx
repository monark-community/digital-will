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
                href="/login"
                className="bg-[var(--accent)] hover:opacity-90 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg text-center"
              >
                Get Started
              </Link>
              <button className="border-2 border-[var(--border-section)] text-[var(--text-muted)] px-8 py-4 rounded-lg text-lg font-semibold cursor-default opacity-50">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="py-20 bg-[var(--bg-section)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            
            {/* 1. Peace of Mind */}
            <div className="text-center p-6 rounded-lg bg-[var(--bg-card)] border border-[var(--border-section)]">
              <div className="w-16 h-16 bg-[var(--accent)]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                Peace of Mind
              </h3>
              <p className="text-[var(--text-muted-alt)] text-sm">
                Your digital assets are protected by blockchain technology — secure, transparent, and verifiable.              
              </p>
            </div>

            {/* 2. Choose Your Guardians */}
            <div className="text-center p-6 rounded-lg bg-[var(--bg-card)] border border-[var(--border-section)]">
              <div className="w-16 h-16 bg-[var(--accent)]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}  d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                Choose Your Guardians
              </h3>
              <p className="text-[var(--text-muted-alt)] text-sm">
                Select trusted people to oversee your will — they work together to validate and execute your wishes.
              </p>
            </div>

            {/* 3. Protection Against False Claims */}
            <div className="text-center p-6 rounded-lg bg-[var(--bg-card)] border border-[var(--border-section)]">
              <div className="w-16 h-16 bg-[var(--accent)]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                Protection Against False Claims
              </h3>
              <p className="text-[var(--text-muted-alt)] text-sm">
                A built-in security window gives you time to react and stop any wrongful declaration.
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
            href="/login"
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
