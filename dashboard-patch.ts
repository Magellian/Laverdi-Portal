// This patch replaces the download buttons with a direct HTTPS launch button
// Apply to: /root/laverdi-portal/pages/dashboard/index.tsx (lines ~127-155)

// OLD CODE (remove):
/*
              {/* Download Buttons */}
              <div className="space-y-3">
                  <p className="text-xs sm:text-sm text-gray-600 font-semibold mb-3">
                    Choose your operating system to download the connector:
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <a
                      href="/api/openclaw/download-connector?os=windows"
                      download="laverdi-openclaw-connect.bat"
                      className="block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors text-center"
                    >
                      💻 Windows
                    </a>
                    <a
                      href="/api/openclaw/download-connector?os=mac"
                      download="laverdi-openclaw-connect.sh"
                      className="block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors text-center"
                    >
                      🍎 Mac
                    </a>
                    <a
                      href="/api/openclaw/download-connector?os=linux"
                      download="laverdi-openclaw-connect.sh"
                      className="block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors text-center"
                    >
                      🐧 Linux
                    </a>
                  </div>

                  <p className="text-xs text-gray-500 mt-3">
                    ↓ Download the script for your OS above, then run it. It will automatically open your OpenClaw instance.
                  </p>
              </div>
*/

// NEW CODE (replace with):
/*
              {/* Launch OpenClaw - Direct HTTPS Link */}
              <div className="space-y-3 mt-6">
                  <p className="text-sm text-gray-700 font-semibold mb-3">
                    🚀 Ready to use your AI Agent?
                  </p>
                  
                  {user.instanceToken ? (
                    <a
                      href={`https://agent.laverdi.tech/?token=${user.instanceToken}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-lg transition-all text-center text-lg shadow-lg"
                    >
                      ✨ Launch OpenClaw Agent
                    </a>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        Your agent container is being provisioned... This usually takes 1-2 minutes after signup. Please refresh this page in a moment.
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 mt-3">
                    Opens in a new window. Your AI agent is running on our secure servers and ready to help.
                  </p>
              </div>
*/
