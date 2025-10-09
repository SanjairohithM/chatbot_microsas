'use client';

import CardSwap, { Card } from '../../components/why-choose-us-cards';

export default function CardSwapDemo() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Why Choose Our AI Chatbot - Card Swap Demo</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left side - Text content */}
          <div className="flex flex-col justify-center px-4 lg:px-0">
            <h2 className="text-pretty text-3xl font-semibold tracking-tight md:text-4xl">
              Why Choose Our 
              <br/>AI Chatbot
            </h2>
            <p className="mt-4 text-sm text-muted-foreground md:text-base max-w-lg">
              Discover the key benefits that make our AI chatbot<br/> the perfect solution for your business
            </p>
            <a
              href="#"
              className="mt-6 inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-fit"
            >
              Learn more..
            </a>
          </div>

          {/* Right side - Card Swap Container */}
          <div className="relative h-[500px] md:h-[600px] w-full">
          <CardSwap
            width={800}
            height={400}
            cardDistance={80}
            verticalDistance={60}
            delay={2000}
            pauseOnHover={true}
            skewAmount={4}
            easing="elastic"
          >
            {/* Card 1 - 24/7 Support (Image on right, content on left) */}
            <Card
              category="24/7 Support"
              readTime="Always Available"
              title="Never Miss a Lead Again"
              description="AI bots work around the clock, engaging visitors even after business hours. Every inquiry is answered instantly, turning missed opportunities into qualified leads."
              image="/laptop-dashboard-on-desk.jpg"
              imageAlt="AI chatbot working 24/7 on laptop screen"
              linkText="Read more"
              linkHref="#"
              isReversed={false}
            />
            
            {/* Card 2 - Cost Savings (Image on left, content on right) */}
            <Card
              category="Cost Savings"
              readTime="Automated Support"
              title="Cut Support Costs, Not Quality"
              description="Handle FAQs, order updates automatically. Free up your team for complex, high-value tasks without sacrificing response speed or accuracy."
              image="/team-collaboration-ui-screens.jpg"
              imageAlt="Team collaborating with AI chatbot interface"
              linkText="Read more"
              linkHref="#"
              isReversed={true}
            />
            
            {/* Card 3 - Scalability (Image on right, content on left) */}
            <Card
              category="Scalability"
              readTime="Growth Ready"
              title="Scale Engagement As You Grow"
              description="Transform your website into a dynamic, conversational experience with multilingual, emotion-aware support that scales effortlessly as your business expands."
              image="/sticky-notes-planning-board.jpg"
              imageAlt="Planning board with AI chatbot growth strategy"
              linkText="Read more"
              linkHref="#"
              isReversed={false}
            />
          </CardSwap>
          </div>
        </div>
      </div>
    </div>
  );
}
