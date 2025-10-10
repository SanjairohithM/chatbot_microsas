import { Button } from "@/components/ui/button"
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid"
import { UserPlus, Upload, Settings, Rocket } from "lucide-react"

export function SectionProcess() {
  return (
    <section aria-labelledby="process-title" className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mx-auto max-w-4xl text-center mb-16">
          <span className="inline-block rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
            How It Works
          </span>
          <h2 id="process-title" className="mt-4 text-balance text-3xl font-semibold tracking-tight md:text-5xl" style={{ fontFamily: 'var(--font-heading)' }}>
            Create AI-powered chatbots in minutes
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground text-lg">
            Customize & Launch.
          </p>
        </div>

        {/* Bento Grid */}
        <BentoGrid className="max-w-7xl mx-auto">
          {/* Large Demo Card - Spans 2 columns */}
          <BentoGridItem
            className="md:col-span-2 md:row-span-2 border-2 border-gray-200 hover:border-gray-300 transition-colors duration-300 rounded-xl overflow-hidden"
            header={
              <div className="relative h-full min-h-[400px] rounded-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-blue-50 to-cyan-100"></div>
                <div className="relative h-full flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
                      <UserPlus className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Signup Screen Demo</h3>
                    <p className="text-gray-600 mb-4">Experience the seamless onboarding process</p>
                    <img 
                      src="signup-screengif.gif" 
                      alt="Signup Screen Demo" 
                      className="w-full max-w-md mx-auto rounded-xl shadow-lg"
                    />
                  </div>
                </div>
              </div>
            }
          />

          {/* Step 1 */}
          <div className="md:col-span-1 border-2 border-gray-200 hover:border-gray-300 transition-colors duration-300 relative overflow-hidden rounded-xl shadow-sm group/bento">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <img 
                src="/images/gradient-black-background-with-wavy-lines_23-2149151738.jpg" 
                alt="Background" 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Content */}
            <div className="relative z-10 p-6 h-full flex flex-col">
              {/* Header with icons */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">01</span>
                </div>
                <UserPlus className="w-6 h-6 text-purple-600" />
              </div>
              
              {/* Title and Description */}
              <div className="transition duration-200 group-hover/bento:translate-x-2">
                <h3 className="text-xl font-semibold text-white mb-2 drop-shadow-lg">Create Your Account</h3>
                <p className="text-sm text-white/90 leading-relaxed drop-shadow-md">Sign up in seconds and access your all-in-one dashboard to start building your AI assistant.</p>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="md:col-span-1 border-2 border-gray-200 hover:border-gray-300 transition-colors duration-300 relative overflow-hidden rounded-xl shadow-sm group/bento">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <img 
                src="/images/gradient-black-background-with-wavy-lines_23-2149151738.jpg" 
                alt="Background" 
                className="w-full h-full object-cover opacity-30"
              />
            </div>
            
            {/* Content */}
            <div className="relative z-10 p-6 h-full flex flex-col">
              {/* Header with icons */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">02</span>
                </div>
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              
              {/* Title and Description */}
              <div className="transition duration-200 group-hover/bento:translate-x-2">
                <h3 className="text-xl font-semibold text-white mb-2 drop-shadow-lg">Train With Your Content</h3>
                <p className="text-sm text-white/90 leading-relaxed drop-shadow-md">Upload FAQs, documents, or knowledge base articles. Our AI learns instantly no manual setup needed.</p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="md:col-span-1 border-2 border-gray-200 hover:border-gray-300 transition-colors duration-300 relative overflow-hidden rounded-xl shadow-sm group/bento">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <img 
                src="/images/gradient-black-background-with-wavy-lines_23-2149151738.jpg" 
                alt="Background" 
                className="w-full h-full object-cover opacity-30"
              />
            </div>
            
            {/* Content */}
            <div className="relative z-10 p-6 h-full flex flex-col">
              {/* Header with icons */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">03</span>
                </div>
                <Settings className="w-6 h-6 text-green-600" />
              </div>
              
              {/* Title and Description */}
              <div className="transition duration-200 group-hover/bento:translate-x-2">
                <h3 className="text-xl font-semibold text-white mb-2 drop-shadow-lg">Customize & Connect</h3>
                <p className="text-sm text-white/90 leading-relaxed drop-shadow-md">Choose your tone, add branding, and integrate with your website, app, or CRM seamlessly.</p>
              </div>
            </div>
          </div>

          {/* Step 4 - Centered with black video background */}
          <div className="md:col-span-2 border-2 border-gray-200 hover:border-gray-300 transition-colors duration-300 relative overflow-hidden rounded-xl shadow-sm group/bento">
            {/* Video Background */}
            <div className="absolute inset-0 z-0">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              >
                <source src="/0_Audio_Audio_Signal_4096x2304.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-black/40"></div>
            </div>
            
            {/* Content */}
            <div className="relative z-20 p-6 h-full flex flex-col justify-center items-center text-center">
              {/* Header with icons */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">04</span>
                </div>
                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg border-2 border-white">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
              </div>
              
              {/* Title and Description */}
              <div className="transition duration-200 group-hover/bento:translate-x-2">
                <h3 className="text-xl font-semibold text-white mb-2 drop-shadow-lg">Launch & Improve</h3>
                <p className="text-sm text-white/90 leading-relaxed drop-shadow-md">Deploy your bot live, monitor performance, and optimize with built-in analytics for continuous improvement.</p>
              </div>
            </div>
          </div>
        </BentoGrid>
      </div>
    </section>
  )
}