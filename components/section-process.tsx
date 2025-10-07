import { Button } from "@/components/ui/button"

export function SectionProcess() {
  return (
    <section aria-labelledby="process-title" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-block rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
            How It Work
          </span>
          <h2 id="process-title" className="mt-4 text-balance text-3xl font-semibold tracking-tight md:text-5xl">
          Create AI-powered chatbots in minutes 
          
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
          Customize & Launch.
          </p>
        </div>





        

        {/* Content */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {/* Left Gradient Card */}
          <div
            className="relative rounded-3xl  text-background shadow-xl ring-1 ring-black/5"
            style={{
              background:
                "linear-gradient(135deg, color-mix(in oklch, hsl(var(--primary)) 85%, white) 0%, color-mix(in oklch, hsl(var(--primary)) 35%, white) 55%, color-mix(in oklch, hsl(var(--primary)) 0%, white) 100%)",
            }}
          >
            <div className="flex h-full">
              {/* Left side - Image */}
              <div className="w-full ">
                <img 
                  src="signup-screengif.gif" 
                  alt="Signup Screen Demo" 
                  className="w-full h-full object-cover rounded-2xl shadow-lg"
                />
              </div>
              
            
            </div>
          </div>

          {/* Steps grid (spans two columns) */}
          <div className="md:col-span-2">
            <div className="grid gap-10 md:grid-cols-2">
              <Step
                number="01"
                title="Create Your Account"
                copy="Sign up in seconds and access your all-in-one dashboard to start building your AI assistant."
              />
              <Step
                number="02"
                title="Train With Your Content"
                copy="Upload FAQs, documents, or knowledge base articles. Our AI learns instantly no manual setup needed."
                accent
              />
              <Step
                number="03"
                title="Customize & Connect"
                copy="Choose your tone, add branding, and integrate with your website, app, or CRM seamlessly."
              />
              <Step
                number="04"
                title="Launch & Improve"
                copy="Deploy your bot live, monitor performance, and optimize with built-in analytics for continuous improvement."
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Step({
  number,
  title,
  copy,
  accent = false,
}: {
  number: string
  title: string
  copy: string
  accent?: boolean
}) {
  return (
    <div>
      <div className={["text-4xl font-semibold tracking-tight md:text-5xl", accent ? "text-primary" : ""].join(" ")}>
        {number}
      </div>
      <h3 className="mt-3 text-xl font-semibold">{title}</h3>
      <p className="mt-2 max-w-prose text-sm text-muted-foreground">{copy}</p>
    </div>
  )
}
