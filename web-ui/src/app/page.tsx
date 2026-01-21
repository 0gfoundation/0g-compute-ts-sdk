"use client";

import React from "react";
import { useAccount } from 'wagmi';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Wallet, Image, Mic, ArrowRight, Sparkles } from "lucide-react";
import { OnboardingFlow } from "@/components/ui/onboarding-flow";
import { use0GBroker } from "../shared/hooks/use0GBroker";

// Use native <a> tag instead of Next.js Link to avoid RSC .txt navigation issues in static export
export default function Home() {
  const { isConnected } = useAccount();
  const { ledgerInfo } = use0GBroker();

  // Check if user has balance (more than 0)
  const hasBalance = ledgerInfo && parseFloat(ledgerInfo.totalBalance) > 0;

  // Navigation handlers
  const handleDepositClick = () => {
    window.location.href = '/wallet';
  };

  const handleSelectProviderClick = () => {
    window.location.href = '/inference';
  };

  const handleStartChatClick = () => {
    window.location.href = '/inference/chat';
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-12">
      {/* Hero Section */}
      <div className="text-center mb-10 sm:mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-primary/20 mb-6">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Decentralized AI Infrastructure</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
          <span className="text-foreground">The Future of </span>
          <span className="bg-gradient-brand bg-clip-text text-transparent">AI Computing</span>
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground mb-8 px-2">
          Access powerful AI models through a decentralized network.
          Chat, generate images, and transcribe audio with complete privacy and control.
        </p>

        {/* Only show these buttons if user has completed onboarding */}
        {isConnected && hasBalance && (
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
            <Button variant="gradient" size="xl" asChild>
              <a href="/inference/chat" className="gap-2">
                <MessageSquare className="w-5 h-5" />
                Start Chatting
                <ArrowRight className="w-5 h-5" />
              </a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="https://docs.0g.ai/concepts/compute" target="_blank" rel="noopener noreferrer">
                Learn More
              </a>
            </Button>
          </div>
        )}
      </div>

      {/* Onboarding Flow - Show for users who haven't completed setup */}
      {(!isConnected || !hasBalance) && (
        <div className="max-w-3xl mx-auto mb-12">
          <OnboardingFlow
            hasBalance={hasBalance ?? false}
            hasProvider={false}
            onDepositClick={handleDepositClick}
            onSelectProviderClick={handleSelectProviderClick}
            onStartChatClick={handleStartChatClick}
          />
        </div>
      )}

      {/* Feature Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
        <Card className="group cursor-pointer hover:shadow-glow transition-all duration-300" onClick={() => window.location.href = '/inference/chat'}>
          <CardContent className="p-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">AI Chat</h3>
            <p className="text-sm text-muted-foreground">
              Conversational AI with multiple models
            </p>
          </CardContent>
        </Card>

        <Card className="group cursor-pointer hover:shadow-glow transition-all duration-300" onClick={() => window.location.href = '/inference/image-gen'}>
          <CardContent className="p-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Image className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Image Generation</h3>
            <p className="text-sm text-muted-foreground">
              Create images from text prompts
            </p>
          </CardContent>
        </Card>

        <Card className="group cursor-pointer hover:shadow-glow transition-all duration-300" onClick={() => window.location.href = '/inference/speech-to-text'}>
          <CardContent className="p-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Speech to Text</h3>
            <p className="text-sm text-muted-foreground">
              Transcribe audio with high accuracy
            </p>
          </CardContent>
        </Card>

        <Card className="group cursor-pointer hover:shadow-glow transition-all duration-300" onClick={() => window.location.href = '/wallet'}>
          <CardContent className="p-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Account</h3>
            <p className="text-sm text-muted-foreground">
              Manage funds and track usage
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
