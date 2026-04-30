import Head from 'next/head'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy - Laverdi.tech</title>
      </Head>

      <Navbar />

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container-max max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

          <div className="bg-white rounded-lg shadow-md p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">Introduction</h2>
              <p className="text-gray-700">
                Laverdi.tech ("we" or "us" or "our") operates the laverdi.tech website.
                This page informs you of our policies regarding the collection, use, and
                disclosure of personal data when you use our Service and the choices you have
                associated with that data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Information Collection and Use</h2>
              <p className="text-gray-700 mb-4">We collect several different types of information:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Personal identification information (name, email address, password)</li>
                <li>Technical information (IP address, browser type, device type)</li>
                <li>Usage information (API calls, subscription tier, features used)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Use of Data</h2>
              <p className="text-gray-700">Laverdi.tech uses the collected data for various purposes:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>To provide and maintain our Service</li>
                <li>To notify you about changes to our Service</li>
                <li>To allow you to participate in interactive features</li>
                <li>To gather analysis or valuable information so that we can improve our Service</li>
                <li>To monitor the usage of our Service</li>
                <li>To detect, prevent, and address technical and security issues</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Security of Data</h2>
              <p className="text-gray-700">
                The security of your data is important to us, but remember that no method of
                transmission over the Internet or method of electronic storage is 100% secure.
                While we strive to use commercially acceptable means to protect your Personal Data,
                we cannot guarantee its absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Changes to This Privacy Policy</h2>
              <p className="text-gray-700">
                We may update our Privacy Policy from time to time. We will notify you of any changes
                by posting the new Privacy Policy on this page and updating the "effective date" at
                the top of this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
              <p className="text-gray-700">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <p className="text-gray-700 mt-4">
                Email: privacy@laverdi.tech
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}
