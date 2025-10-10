"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft, ArrowRight, CheckCircle, Bot, Settings, Palette, FileText, Zap } from "lucide-react"
import { StepOne } from "../../../components/dashboard/create-chatbot/step-one"
import { StepTwo } from "../../../components/dashboard/create-chatbot/step-two"
import { StepThree } from "../../../components/dashboard/create-chatbot/step-three"
import { StepFour } from "../../../components/dashboard/create-chatbot/step-four"
import type { Bot as BotType, KnowledgeDocument } from "@/lib/types"

const steps = [
  {
    id: 1,
    title: "Basic Information",
    description: "Set up your bot's name and description",
    icon: Bot,
  },
  {
    id: 2,
    title: "Knowledge Base",
    description: "Add documents and knowledge sources",
    icon: FileText,
  },
  {
    id: 3,
    title: "Personality & Behavior",
    description: "Configure personality and response settings",
    icon: Palette,
  },
  {
    id: 4,
    title: "Deployment",
    description: "Choose deployment options and finalize",
    icon: Zap,
  },
]

export default function CreateChatbotPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState<Partial<BotType>>({})
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth")
      return
    }
  }, [user, isLoading, router])

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepClick = (stepNumber: number) => {
    if (stepNumber <= currentStep) {
      setCurrentStep(stepNumber)
    }
  }

  const handleFormDataChange = (data: Partial<BotType>) => {
    setFormData(prev => ({ ...prev, ...data }))
  }

  const handleDocumentsChange = (docs: KnowledgeDocument[]) => {
    setDocuments(docs)
  }

  const handleCreateBot = async () => {
    if (!user) return

    setIsCreating(true)
    try {
      console.log(`[CreateChatbot] 🚀 Starting bot creation for user: ${user.id}`)
      console.log(`[CreateChatbot] Bot data:`, formData)
      
      // Create the bot
      const response = await fetch('/api/bots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          ...formData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || 'Failed to create bot')
      }

      const result = await response.json()
      const newBot = result.data
      
      console.log(`[CreateChatbot] ✅ Bot created successfully with ID: ${newBot.id}`)

      // If documents were uploaded, save them to the database
      if (documents && documents.length > 0) {
        try {
          const documentPromises = documents.map(async doc => {
            const response = await fetch('/api/knowledge-documents', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                bot_id: newBot.id,
                title: doc.title,
                content: doc.content,
                file_url: doc.file_url,
                file_type: doc.file_type,
                file_size: doc.file_size,
                status: 'processing'
              })
            })
            
            if (response.ok) {
              const result = await response.json()
              const savedDoc = result.data
              
              // Process the document if it has a file URL
              if (savedDoc.file_url && savedDoc.file_url !== '') {
                try {
                  await fetch('/api/documents/process', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      documentId: savedDoc.id
                    })
                  })
                } catch (processError) {
                  console.error('Error processing document:', processError)
                }
              }
            }
          })

          await Promise.all(documentPromises)
          console.log('All documents saved and processed successfully')
        } catch (docError) {
          console.error('Error saving documents:', docError)
        }
      }

      // Handle website scraping if website_url is provided
      if ((formData as any).website_url && (formData as any).website_content) {
        try {
          console.log(`[CreateChatbot] 🌐 Starting website scraping for bot ${newBot.id}`)
          
          const scrapeResponse = await fetch('/api/scrape-website', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: (formData as any).website_url,
              botId: newBot.id
            })
          })

          if (scrapeResponse.ok) {
            const scrapeResult = await scrapeResponse.json()
            console.log(`[CreateChatbot] ✅ Website scraping completed for bot ${newBot.id}`)
          } else {
            console.error('Failed to scrape and store website:', await scrapeResponse.text())
          }
        } catch (scrapeError) {
          console.error('Error scraping website:', scrapeError)
        }
      }

      // Navigate back to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('[CreateChatbot] ❌ Error creating bot:', error)
      throw error
    } finally {
      setIsCreating(false)
    }
  }

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.name && formData.description)
      case 2:
        return true // Knowledge base is optional
      case 3:
        return true // Personality settings are optional
      case 4:
        return true // Deployment options are optional
      default:
        return false
    }
  }

  const canProceed = isStepValid(currentStep)
  const progress = (currentStep / steps.length) * 100

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="flex justify-center items-center p-6 mx-auto mb-6 w-20 h-20 bg-blue-100 rounded-3xl">
            <div className="w-8 h-8 rounded-full border-2 border-blue-500 animate-spin border-t-transparent"></div>
          </div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-4xl">
          <div className="flex gap-4 items-center mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back to Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Chatbot</h1>
          <p className="mt-2 text-gray-600">Follow the steps below to create your AI chatbot</p>
        </div>
      </div>

      <div className="p-6 mx-auto max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Steps Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-2">
              {steps.map((step) => {
                const Icon = step.icon
                const isCompleted = currentStep > step.id
                const isCurrent = currentStep === step.id
                const isValid = isStepValid(step.id)

                return (
                  <button
                    key={step.id}
                    onClick={() => handleStepClick(step.id)}
                    disabled={step.id > currentStep}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      isCurrent
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : isCompleted
                        ? 'border-green-500 bg-green-50 text-green-900'
                        : step.id < currentStep
                        ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex gap-3 items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? 'text-white bg-green-500'
                          : isCurrent
                          ? 'text-white bg-blue-500'
                          : 'text-gray-600 bg-gray-300'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{step.title}</div>
                        <div className="text-xs opacity-75">{step.description}</div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex gap-2 items-center">
                  {React.createElement(steps[currentStep - 1].icon, { className: "h-5 w-5" })}
                  {steps[currentStep - 1].title}
                </CardTitle>
                <CardDescription>
                  {steps[currentStep - 1].description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentStep === 1 && (
                  <StepOne
                    formData={formData}
                    onChange={handleFormDataChange}
                  />
                )}
                {currentStep === 2 && (
                  <StepTwo
                    documents={documents}
                    onChange={handleDocumentsChange}
                    formData={formData}
                    onFormDataChange={handleFormDataChange}
                  />
                )}
                {currentStep === 3 && (
                  <StepThree
                    formData={formData}
                    onChange={handleFormDataChange}
                  />
                )}
                {currentStep === 4 && (
                  <StepFour
                    formData={formData}
                    onChange={handleFormDataChange}
                  />
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6 mt-8 border-t">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 1}
                  >
                    <ArrowLeft className="mr-2 w-4 h-4" />
                    Previous
                  </Button>

                  <div className="flex gap-2">
                    {currentStep === steps.length ? (
                      <Button
                        onClick={handleCreateBot}
                        disabled={!canProceed || isCreating}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isCreating ? (
                          <>
                            <div className="mr-2 w-4 h-4 rounded-full border-b-2 border-white animate-spin"></div>
                            Creating Bot...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 w-4 h-4" />
                            Create Bot
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleNext}
                        disabled={!canProceed}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Next
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
