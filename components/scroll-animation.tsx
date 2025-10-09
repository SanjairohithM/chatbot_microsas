"use client"

import { useEffect, useRef, useState } from 'react'

interface ScrollAnimationProps {
  children: React.ReactNode
  animation?: 'fadeIn' | 'slideUp' | 'slideInLeft' | 'slideInRight' | 'bounceIn' | 'scaleIn'
  delay?: number
  threshold?: number
  className?: string
}

export function ScrollAnimation({ 
  children, 
  animation = 'fadeIn', 
  delay = 0,
  threshold = 0.1,
  className = ''
}: ScrollAnimationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true)
          }, delay)
        }
      },
      { threshold }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [delay, threshold])

  const animationClass = isVisible ? `animate-${animation}` : 'opacity-0'

  return (
    <div ref={ref} className={`${animationClass} ${className}`}>
      {children}
    </div>
  )
}
