import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Terms of Service
          </h1>
          <p className="mt-3 text-xl text-gray-500">
            Last updated: June 24, 2024
          </p>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="prose prose-blue max-w-none">
              <h2>1. Acceptance of Terms</h2>
              <p>
                By accessing or using our service, you agree to be bound by these terms. 
                If you disagree with any part of the terms, you may not access the service.
              </p>

              <h2>2. User Responsibilities</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account and password. 
                You agree to accept responsibility for all activities that occur under your account.
              </p>

              <h2>3. Content</h2>
              <p>
                Our service allows you to post, link, store, share and otherwise make available certain information, 
                text, graphics, videos, or other material. You are responsible for the content that you post.
              </p>

              <h2>4. Privacy</h2>
              <p>
                Your use of the service is also governed by our Privacy Policy. Please review our Privacy Policy, 
                which is incorporated into these Terms of Service by this reference.
              </p>

              <h2>5. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. We will provide notice of any changes 
                by updating the "Last Updated" date at the top of this page.
              </p>

              <h2>6. Contact Us</h2>
              <p>
                If you have any questions about these Terms, please contact us at support@example.com.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-blue-600 hover:text-blue-500">
            &larr; Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
