import Head from 'next/head'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function Docs() {
  return (
    <>
      <Head>
        <title>API Documentation - Laverdi.tech</title>
      </Head>

      <Navbar />

      <div className="min-h-screen bg-gray-50">
        <div className="container-max py-12">
          <h1 className="text-4xl font-bold mb-8">API Documentation</h1>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <nav className="sticky top-4 space-y-2">
                <a
                  href="#getting-started"
                  className="block px-4 py-2 text-blue-600 bg-blue-50 rounded-lg"
                >
                  Getting Started
                </a>
                <a
                  href="#authentication"
                  className="block px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Authentication
                </a>
                <a
                  href="#endpoints"
                  className="block px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Endpoints
                </a>
                <a
                  href="#errors"
                  className="block px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Error Handling
                </a>
                <a
                  href="#examples"
                  className="block px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Examples
                </a>
              </nav>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              <section id="getting-started" className="mb-12">
                <h2 className="text-3xl font-bold mb-4">Getting Started</h2>
                <p className="text-gray-700 mb-4">
                  Welcome to the Laverdi.tech OpenClaw API. This documentation covers all available endpoints and features.
                </p>
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="font-bold mb-2">Base URL</h3>
                  <code className="block bg-gray-100 p-3 rounded text-sm mb-4">
                    https://api.laverdi.tech/v1
                  </code>
                  <h3 className="font-bold mb-2">Authentication</h3>
                  <p className="text-gray-700 text-sm">
                    All requests require an API key sent in the Authorization header.
                  </p>
                </div>
              </section>

              <section id="authentication" className="mb-12">
                <h2 className="text-3xl font-bold mb-4">Authentication</h2>
                <p className="text-gray-700 mb-4">
                  Include your API key in every request using the Authorization header:
                </p>
                <div className="bg-gray-900 text-gray-100 rounded-lg p-6 overflow-x-auto mb-4">
                  <pre className="text-sm">
                    {`Authorization: Bearer YOUR_API_KEY

curl -H "Authorization: Bearer lav_..." \\
  https://api.laverdi.tech/v1/status`}
                  </pre>
                </div>
              </section>

              <section id="endpoints" className="mb-12">
                <h2 className="text-3xl font-bold mb-4">API Endpoints</h2>

                <div className="space-y-6">
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded font-bold text-sm">
                        GET
                      </span>
                      <code className="font-mono text-sm">/status</code>
                    </div>
                    <p className="text-gray-700 mb-4">
                      Check API status and your current usage.
                    </p>
                    <details>
                      <summary className="cursor-pointer font-semibold">
                        Response Example
                      </summary>
                      <pre className="mt-4 bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                        {`{
  "status": "ok",
  "usage": {
    "requests": 1234,
    "limit": 50000,
    "reset_at": "2024-04-30T00:00:00Z"
  }
}`}
                      </pre>
                    </details>
                  </div>

                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded font-bold text-sm">
                        POST
                      </span>
                      <code className="font-mono text-sm">/agents</code>
                    </div>
                    <p className="text-gray-700 mb-4">
                      Create a new AI agent. Enterprise feature.
                    </p>
                    <details>
                      <summary className="cursor-pointer font-semibold">
                        Request Body
                      </summary>
                      <pre className="mt-4 bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                        {`{
  "name": "Customer Support Bot",
  "model": "gpt-4",
  "system_prompt": "You are...",
  "temperature": 0.7
}`}
                      </pre>
                    </details>
                  </div>
                </div>
              </section>

              <section id="errors" className="mb-12">
                <h2 className="text-3xl font-bold mb-4">Error Handling</h2>
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <p className="text-gray-700 mb-4">
                    The API uses standard HTTP status codes. Error responses include a message:
                  </p>
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto mb-4">
                    {`{
  "error": "Invalid API key",
  "status": 401
}`}
                  </pre>

                  <h3 className="font-bold mb-2">Common Status Codes</h3>
                  <ul className="space-y-2">
                    <li className="text-gray-700">
                      <strong>200:</strong> Success
                    </li>
                    <li className="text-gray-700">
                      <strong>400:</strong> Bad Request
                    </li>
                    <li className="text-gray-700">
                      <strong>401:</strong> Unauthorized
                    </li>
                    <li className="text-gray-700">
                      <strong>429:</strong> Rate Limited
                    </li>
                    <li className="text-gray-700">
                      <strong>500:</strong> Server Error
                    </li>
                  </ul>
                </div>
              </section>

              <section id="examples">
                <h2 className="text-3xl font-bold mb-4">Code Examples</h2>

                <div className="space-y-6">
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="font-bold mb-4">JavaScript/Node.js</h3>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
                      {`const api = require('laverdi-sdk');

const client = new api.Client({
  apiKey: 'lav_...'
});

const status = await client.getStatus();
console.log(status.usage);`}
                    </pre>
                  </div>

                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="font-bold mb-4">Python</h3>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
                      {`import laverdi

client = laverdi.Client(api_key='lav_...')
status = client.get_status()
print(status.usage)`}
                    </pre>
                  </div>

                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="font-bold mb-4">cURL</h3>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
                      {`curl -X GET https://api.laverdi.tech/v1/status \\
  -H "Authorization: Bearer lav_..." \\
  -H "Content-Type: application/json"`}
                    </pre>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}
