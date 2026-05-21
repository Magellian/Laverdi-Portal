      {/* ============================================
          6. PRICING (UPDATED WITH NEW MODELS & TOKENS)
          ============================================ */}
      <section id="pricing" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-4">
              Smart Pricing. Powerful AI.
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to run your own AI assistant. Your VPS is always included.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* TRIAL */}
            <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <h3 className="text-2xl font-bold text-black mb-1">Trial</h3>
              <p className="text-sm text-gray-600 mb-6">14 days free</p>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-black">$0</span>
                <span className="text-gray-600">/month</span>
              </div>
              
              <Link
                href="/auth/signup"
                className="w-full px-6 py-3 border-2 border-black text-black rounded-lg font-bold hover:bg-black hover:text-white transition-colors duration-200 text-center block mb-8"
              >
                Start Free
              </Link>
              
              <div className="space-y-4 mb-8">
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">AI Model</h4>
                  <p className="text-gray-700">DeepSeek V3</p>
                </div>
                
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Monthly Tokens</h4>
                  <p className="text-2xl font-bold text-red-600">1M</p>
                  <p className="text-xs text-gray-600">~1,000 requests/month</p>
                </div>
                
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Request Limits</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Max 1,000 tokens/request</li>
                    <li>• Max 1,000 requests/month</li>
                    <li>• 128K context window</li>
                  </ul>
                </div>
              </div>
              
              <div className="border-t border-gray-300 pt-4">
                <h4 className="font-bold text-gray-900 mb-3">Includes</h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">Your own VPS</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">Web chat + apps</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">Email support</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* STARTER (Most Popular) */}
            <div className="bg-black text-white rounded-2xl p-8 relative transform md:scale-105 md:-my-4 shadow-2xl">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600 px-4 py-1 rounded-full">
                <span className="font-bold text-sm">Most Popular</span>
              </div>
              
              <h3 className="text-2xl font-bold mb-1">Starter</h3>
              <p className="text-sm text-gray-400 mb-6">Best for individuals</p>
              
              <div className="mb-6">
                <span className="text-4xl font-bold">$29</span>
                <span className="text-gray-400">/month</span>
              </div>
              
              <Link
                href="/auth/signup"
                className="w-full px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors duration-200 text-center block mb-8"
              >
                Get Started
              </Link>
              
              <div className="space-y-4 mb-8">
                <div>
                  <h4 className="font-bold text-white mb-2">AI Model</h4>
                  <p className="text-gray-200">DeepSeek V3</p>
                  <p className="text-xs text-gray-400 mt-1">Fast, accurate, multilingual</p>
                </div>
                
                <div>
                  <h4 className="font-bold text-white mb-2">Monthly Tokens</h4>
                  <p className="text-2xl font-bold text-green-400">10M</p>
                  <p className="text-xs text-gray-400">~10,000 requests/month</p>
                </div>
                
                <div>
                  <h4 className="font-bold text-white mb-2">Request Limits</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Max 2,000 tokens/request</li>
                    <li>• Max 10,000 requests/month</li>
                    <li>• 128K context window</li>
                  </ul>
                </div>
              </div>
              
              <div className="border-t border-gray-700 pt-4">
                <h4 className="font-bold text-white mb-3">Includes</h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-200 text-sm">Your own VPS</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-200 text-sm">All chat platforms</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-200 text-sm">Priority support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-200 text-sm">Custom automations</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* PROFESSIONAL */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <h3 className="text-2xl font-bold text-black mb-1">Professional</h3>
              <p className="text-sm text-gray-600 mb-6">For power users</p>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-black">$99</span>
                <span className="text-gray-600">/month</span>
              </div>
              
              <Link
                href="/auth/signup"
                className="w-full px-6 py-3 border-2 border-black text-black rounded-lg font-bold hover:bg-black hover:text-white transition-colors duration-200 text-center block mb-8"
              >
                Get Started
              </Link>
              
              <div className="space-y-4 mb-8">
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">AI Model</h4>
                  <p className="text-gray-700">DeepSeek R1 (Reasoning)</p>
                  <p className="text-xs text-gray-600 mt-1">Advanced reasoning & analysis</p>
                </div>
                
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Monthly Tokens</h4>
                  <p className="text-2xl font-bold text-red-600">50M</p>
                  <p className="text-xs text-gray-600">~50,000 requests/month</p>
                </div>
                
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Request Limits</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Max 4,000 tokens/request</li>
                    <li>• Max 50,000 requests/month</li>
                    <li>• 64K context window</li>
                  </ul>
                </div>
              </div>
              
              <div className="border-t border-gray-300 pt-4">
                <h4 className="font-bold text-gray-900 mb-3">Includes</h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">Your own VPS</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">All platforms + API</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">Dedicated support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">Custom integrations</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* AGENCY */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-400 rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="mb-6">
                <span className="inline-block bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-2">
                  Coming Soon
                </span>
              </div>
              
              <h3 className="text-2xl font-bold text-black mb-1">Agency</h3>
              <p className="text-sm text-gray-600 mb-6">For teams & agencies</p>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-black">$299</span>
                <span className="text-gray-600">/month</span>
              </div>
              
              <button
                disabled
                className="w-full px-6 py-3 border-2 border-purple-400 text-purple-600 rounded-lg font-bold cursor-not-allowed opacity-50 text-center block mb-8"
              >
                Coming Soon
              </button>
              
              <div className="space-y-4 mb-8">
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">AI Model</h4>
                  <p className="text-gray-700">Qwen 2.5-72B (Advanced)</p>
                  <p className="text-xs text-gray-600 mt-1">Multilingual, high-performance</p>
                </div>
                
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Monthly Tokens</h4>
                  <p className="text-2xl font-bold text-purple-600">100M</p>
                  <p className="text-xs text-gray-600">~100,000 requests/month</p>
                </div>
                
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Request Limits</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Max 4,000 tokens/request</li>
                    <li>• Max 100,000 requests/month</li>
                    <li>• 128K context window</li>
                  </ul>
                </div>
              </div>
              
              <div className="border-t border-purple-300 pt-4">
                <h4 className="font-bold text-gray-900 mb-3">Includes</h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">Your own VPS</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">Unlimited platforms</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">Account manager</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">Custom everything</span>
                  </li>
                </ul>
              </div>
            </div>

          </div>

          {/* Token Explanation */}
          <div className="mt-16 pt-12 border-t border-gray-200">
            <h3 className="text-2xl font-bold text-black mb-8 text-center">Understanding Token Usage</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-red-600" />
                  What are tokens?
                </h4>
                <p className="text-sm text-gray-700">
                  Tokens are the building blocks of AI responses. On average:
                  • Short message: 50-200 tokens
                  • Paragraph: 200-500 tokens  
                  • Code snippet: 100-300 tokens
                  • Long form: 500-2000 tokens
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Code className="w-5 h-5 text-red-600" />
                  Monthly to Daily
                </h4>
                <p className="text-sm text-gray-700">
                  <strong>Trial:</strong> 1M ≈ 33K/day
                  <br />
                  <strong>Starter:</strong> 10M ≈ 333K/day
                  <br />
                  <strong>Professional:</strong> 50M ≈ 1.67M/day
                  <br />
                  <strong>Agency:</strong> 100M ≈ 3.33M/day
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Server className="w-5 h-5 text-red-600" />
                  Overage?
                </h4>
                <p className="text-sm text-gray-700">
                  Exceeding monthly limits:
                  • Trial: Upgrade required (no overage)
                  • Starter: $0.00275 per 1K tokens
                  • Professional: $0.01 per 1K tokens
                  • Agency: Custom pricing
                </p>
              </div>

            </div>
          </div>

        </div>
      </section>
