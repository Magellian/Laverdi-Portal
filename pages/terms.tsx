import Head from 'next/head'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms of Service - Laverdi.tech</title>
      </Head>

      <Navbar />

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container-max max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>

          <div className="bg-white rounded-lg shadow-md p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-700">
                By accessing and using the Laverdi.tech website and service, you accept and agree
                to be bound by and comply with these terms and conditions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Use License</h2>
              <p className="text-gray-700 mb-4">
                Permission is granted to temporarily download one copy of the materials (information
                or software) from Laverdi.tech for personal, non-commercial transitory viewing only.
                This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or for any public display</li>
                <li>Attempt to decompile or reverse engineer any software contained on the website</li>
                <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
                <li>Attempt to gain unauthorized access to any portion or feature of the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. Disclaimer</h2>
              <p className="text-gray-700">
                The materials on Laverdi.tech are provided on an 'as is' basis. Laverdi.tech makes no
                warranties, expressed or implied, and hereby disclaims and negates all other warranties
                including, without limitation, implied warranties or conditions of merchantability,
                fitness for a particular purpose, or non-infringement of intellectual property or
                other violation of rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Limitations</h2>
              <p className="text-gray-700">
                In no event shall Laverdi.tech or its suppliers be liable for any damages (including,
                without limitation, damages for loss of data or profit, or due to business interruption)
                arising out of the use or inability to use the materials on Laverdi.tech.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Accuracy of Materials</h2>
              <p className="text-gray-700">
                The materials appearing on Laverdi.tech website could include technical, typographical,
                or photographic errors. Laverdi.tech does not warrant that any of the materials on its
                website are accurate, complete, or current.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Modifications</h2>
              <p className="text-gray-700">
                Laverdi.tech may revise these terms of service for its website at any time without notice.
                By using this website, you are agreeing to be bound by the then current version of these
                terms of service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Governing Law</h2>
              <p className="text-gray-700">
                These terms and conditions are governed by and construed in accordance with the laws of
                the United States, and you irrevocably submit to the exclusive jurisdiction of the courts
                located in this location.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Contact Information</h2>
              <p className="text-gray-700">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <p className="text-gray-700 mt-4">
                Email: legal@laverdi.tech
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}
