"use client"

import React, { useState, useEffect } from 'react'
import { X, ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TourStep {
  target: string
  title: string
  content: string
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

const TOUR_STORAGE_KEY = 'escrowkit_tour_completed'

export function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const steps: TourStep[] = [
    {
      target: 'none',
      title: 'Welcome to EscrowKit!',
      content: 'Let\'s take a quick 1-minute tour of your new dashboard to get you started with trustless payments.',
      position: 'center'
    },
    {
      target: 'metrics-grid',
      title: 'Performance At A Glance',
      content: 'Monitor your total volume, active escrows, and pending actions in real-time. Everything is synced directly from the blockchain.',
      position: 'bottom'
    },
    {
      target: 'quick-launch',
      title: 'Quick Launch Templates',
      content: 'Start a new escrow in seconds. Choose from Milestone, Service, or Rental templates to get moving fast.',
      position: 'bottom'
    },
    {
      target: 'recent-activity',
      title: 'Activity Feed',
      content: 'Track every state change, deposit, and release here. Perfect for keeping an audit trail of your deals.',
      position: 'top'
    },
    {
      target: 'sidebar-docs',
      title: 'Developer Hub',
      content: 'Looking to integrate? Access our SDK and API references directly from the sidebar anytime.',
      position: 'right'
    }
  ]

  useEffect(() => {
    const isCompleted = localStorage.getItem(TOUR_STORAGE_KEY)
    const isAuthenticated = localStorage.getItem('auth_token')
    
    if (!isCompleted && isAuthenticated) {
      const timer = setTimeout(() => setIsOpen(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleComplete = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true')
    setIsOpen(false)
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1)
    } else {
      handleComplete()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1)
    }
  }

  if (!isOpen) return null

  const step = steps[currentStep]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      {/* Spotlight effect would normally go here, but for now we use a centered premium card */}
      <div className={cn(
        "relative w-full max-w-md bg-neutral-900 border border-emerald-500/30 rounded-[2rem] p-8 shadow-[0_0_80px_rgba(16,185,129,0.15)] transition-all duration-500",
        currentStep === 0 ? "scale-110" : "scale-100"
      )}>
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 shadow-2xl animate-pulse">
           <Sparkles className="w-10 h-10 text-emerald-500" />
        </div>

        <button 
          onClick={handleComplete}
          className="absolute top-6 right-6 text-neutral-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="space-y-6 pt-6">
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-500">
            Step {currentStep + 1} of {steps.length}
          </div>
          
          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-white tracking-tight">{step.title}</h3>
            <p className="text-neutral-400 leading-relaxed">
              {step.content}
            </p>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button 
              onClick={prevStep}
              className={cn(
                "flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-white transition-colors",
                currentStep === 0 && "invisible"
              )}
            >
              <ArrowLeft size={16} /> Previous
            </button>
            <button 
              onClick={nextStep}
              className="bg-emerald-500 text-black px-6 py-3 rounded-full font-bold text-sm hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              {currentStep === steps.length - 1 ? (
                <>Finish Tour <Check size={16} /></>
              ) : (
                <>Next Step <ArrowRight size={16} /></>
              )}
            </button>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-8">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === currentStep ? "w-6 bg-emerald-500" : "w-1.5 bg-neutral-800"
              )} 
            />
          ))}
        </div>
      </div>
    </div>
  )
}
