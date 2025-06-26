import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-3 text-xl text-gray-500">
            Last updated: June 24, 2024
          </p>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="prose prose-blue max-w-none">
              <h2>1. Information We Collect</h2>
              <p>
                We collect information that you provide directly to us, such as when you create an account, 
                update your profile, or communicate with us. This may include your name, email address, 
                profile information, and any other information you choose to provide.
              </p>

              <h2>2. How We Use Your Information</h2>
              <p>
                We use the information we collect to:
              </p>
              <ul>
                <li>Provide, maintain, and improve our services</li>
                <li>Respond to your comments, questions, and requests</li>
                <li>Send you technical notices and support messages</li>
                <li>Communicate with you about products, services, and events</li>
                <li>Monitor and analyze trends, usage, and activities</li>
              </ul>

              <h2>3. Information Sharing</h2>
              <p>
                We do not share your personal information with third parties except as described in this 
                Privacy Policy. We may share information with service providers who perform services on our behalf.
              </p>

              <h2>4. Data Security</h2>
              <p>
                We take reasonable measures to help protect your personal information from loss, theft, 
                misuse, and unauthorized access, disclosure, alteration, and destruction.
              </p>

              <h2>5. Your Choices</h2>
              <p>
                You may update, correct, or delete information about you at any time by logging into your 
                online account. You can also contact us to request access to or deletion of your personal information.
              </p>

              <h2>6. Changes to This Policy</h2>
              <p>
                We may change this Privacy Policy from time to time. If we make changes, we will notify you by 
                revising the date at the top of the policy and, in some cases, we may provide you with additional 
                notice (such as adding a statement to our homepage or sending you a notification).
              </p>

              <h2>7. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at privacy@example.com.
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
