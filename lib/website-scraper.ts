// Advanced website scraping utilities

export interface ScrapedContent {
  title: string
  description: string
  content: string
  metadata: {
    scrapedAt: string
    url: string
    wordCount: number
    headings: number
    paragraphs: number
    links: number
    hasContactInfo: boolean
    contentType: 'business' | 'blog' | 'ecommerce' | 'portfolio' | 'unknown'
  }
}

export interface StructuredContent {
  title: string
  description: string
  headings: string[]
  paragraphs: string[]
  links: string[]
  contactInfo: string[]
  services: string[]
  products: string[]
  faq: { question: string; answer: string }[]
  pricing: string[]
  testimonials: string[]
}

// Enhanced content extraction with better parsing
export function extractStructuredContent(html: string, url: string): StructuredContent {
  const content: StructuredContent = {
    title: '',
    description: '',
    headings: [],
    paragraphs: [],
    links: [],
    contactInfo: [],
    services: [],
    products: [],
    faq: [],
    pricing: [],
    testimonials: []
  }

  // Extract title
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i)
  if (titleMatch) {
    content.title = cleanText(titleMatch[1])
  }

  // Extract meta description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)
  if (descMatch) {
    content.description = cleanText(descMatch[1])
  }

  // Extract headings (h1-h6) with priority
  const headingMatches = html.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi)
  if (headingMatches) {
    content.headings = headingMatches.map(h => cleanText(h)).filter(h => h.length > 0)
  }

  // Extract paragraphs with better filtering
  const paragraphMatches = html.match(/<p[^>]*>(.*?)<\/p>/gi)
  if (paragraphMatches) {
    content.paragraphs = paragraphMatches
      .map(p => cleanText(p))
      .filter(p => p.length > 30 && !isNavigationText(p))
  }

  // Extract links with context
  const linkMatches = html.match(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi)
  if (linkMatches) {
    content.links = linkMatches.map(link => {
      const hrefMatch = link.match(/href=["']([^"']*)["']/i)
      const textMatch = link.match(/>([^<]*)</i)
      const href = hrefMatch ? hrefMatch[1] : ''
      const text = textMatch ? cleanText(textMatch[1]) : ''
      
      if (text && href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        return `${text} (${href})`
      }
      return ''
    }).filter(link => link.length > 0)
  }

  // Enhanced contact information extraction
  const emailMatches = html.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g)
  if (emailMatches) {
    content.contactInfo.push(...emailMatches.map(email => `Email: ${email}`))
  }

  // Phone numbers (various formats)
  const phonePatterns = [
    /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
    /(\+\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g
  ]
  
  phonePatterns.forEach(pattern => {
    const phoneMatches = html.match(pattern)
    if (phoneMatches) {
      content.contactInfo.push(...phoneMatches.map(phone => `Phone: ${phone}`))
    }
  })

  // Extract services (look for service-related content)
  const serviceKeywords = [
    'service', 'solution', 'development', 'design', 'consulting', 'support',
    'consulting', 'implementation', 'integration', 'maintenance', 'training'
  ]
  
  const serviceMatches = content.paragraphs.filter(p => 
    serviceKeywords.some(keyword => p.toLowerCase().includes(keyword))
  )
  content.services = serviceMatches.slice(0, 15)

  // Extract products (look for product-related content)
  const productKeywords = ['product', 'software', 'app', 'tool', 'platform', 'system']
  const productMatches = content.paragraphs.filter(p => 
    productKeywords.some(keyword => p.toLowerCase().includes(keyword))
  )
  content.products = productMatches.slice(0, 10)

  // Extract FAQ (look for question-answer patterns)
  const faqPatterns = [
    /<h[1-6][^>]*>(.*\?.*)<\/h[1-6]>/gi,
    /<strong[^>]*>(.*\?.*)<\/strong>/gi,
    /<b[^>]*>(.*\?.*)<\/b>/gi
  ]
  
  faqPatterns.forEach(pattern => {
    const faqMatches = html.match(pattern)
    if (faqMatches) {
      faqMatches.forEach(match => {
        const question = cleanText(match)
        if (question.includes('?')) {
          content.faq.push({ question, answer: '' })
        }
      })
    }
  })

  // Extract pricing information
  const pricingKeywords = ['price', 'cost', 'fee', 'plan', 'subscription', '$', '€', '£']
  const pricingMatches = content.paragraphs.filter(p => 
    pricingKeywords.some(keyword => p.toLowerCase().includes(keyword))
  )
  content.pricing = pricingMatches.slice(0, 10)

  // Extract testimonials
  const testimonialKeywords = ['testimonial', 'review', 'feedback', 'customer says', 'client says']
  const testimonialMatches = content.paragraphs.filter(p => 
    testimonialKeywords.some(keyword => p.toLowerCase().includes(keyword))
  )
  content.testimonials = testimonialMatches.slice(0, 5)

  return content
}

// Clean text content
function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, ' ') // Remove HTML tags
    .replace(/&[^;]+;/g, ' ') // Remove HTML entities
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

// Check if text is navigation-related
function isNavigationText(text: string): boolean {
  const navKeywords = ['home', 'about', 'contact', 'menu', 'login', 'register', 'search']
  return navKeywords.some(keyword => text.toLowerCase().includes(keyword)) && text.length < 50
}

// Determine content type based on extracted content
export function determineContentType(content: StructuredContent): 'business' | 'blog' | 'ecommerce' | 'portfolio' | 'unknown' {
  const text = `${content.title} ${content.description} ${content.headings.join(' ')} ${content.paragraphs.join(' ')}`.toLowerCase()
  
  if (text.includes('shop') || text.includes('buy') || text.includes('cart') || text.includes('product')) {
    return 'ecommerce'
  }
  
  if (text.includes('blog') || text.includes('article') || text.includes('post') || text.includes('news')) {
    return 'blog'
  }
  
  if (text.includes('portfolio') || text.includes('gallery') || text.includes('work') || text.includes('project')) {
    return 'portfolio'
  }
  
  if (text.includes('service') || text.includes('company') || text.includes('business') || text.includes('about')) {
    return 'business'
  }
  
  return 'unknown'
}

// Generate comprehensive content summary
export function generateContentSummary(content: StructuredContent, url: string): string {
  const contentType = determineContentType(content)
  
  let summary = `Website: ${url}\n\n`
  
  if (content.title) {
    summary += `Title: ${content.title}\n\n`
  }
  
  if (content.description) {
    summary += `Description: ${content.description}\n\n`
  }
  
  if (content.headings.length > 0) {
    summary += `Main Sections:\n${content.headings.map(h => `- ${h}`).join('\n')}\n\n`
  }
  
  if (content.paragraphs.length > 0) {
    summary += `About Us:\n${content.paragraphs.slice(0, 5).join('\n\n')}\n\n`
  }
  
  if (content.services.length > 0) {
    summary += `Services:\n${content.services.map(s => `- ${s}`).join('\n')}\n\n`
  }
  
  if (content.products.length > 0) {
    summary += `Products:\n${content.products.map(p => `- ${p}`).join('\n')}\n\n`
  }
  
  if (content.contactInfo.length > 0) {
    summary += `Contact Information:\n${content.contactInfo.join('\n')}\n\n`
  }
  
  if (content.faq.length > 0) {
    summary += `Frequently Asked Questions:\n${content.faq.map(f => `Q: ${f.question}`).join('\n')}\n\n`
  }
  
  if (content.pricing.length > 0) {
    summary += `Pricing Information:\n${content.pricing.map(p => `- ${p}`).join('\n')}\n\n`
  }
  
  if (content.testimonials.length > 0) {
    summary += `Customer Testimonials:\n${content.testimonials.map(t => `- ${t}`).join('\n')}\n\n`
  }
  
  if (content.links.length > 0) {
    summary += `Important Links:\n${content.links.slice(0, 10).join('\n')}\n\n`
  }
  
  return summary.trim()
}
