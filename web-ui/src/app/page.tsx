"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cpu, Wrench, Wallet } from "lucide-react";

export default function Home() {
  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-12">
      {/* Hero Section */}
      <div className="text-center mb-8 sm:mb-16">
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter mb-4 sm:mb-6 text-gray-900">
          Discover Decentralized AI
        </h1>
        <p className="max-w-2xl mx-auto text-sm sm:text-lg text-gray-600 mb-6 sm:mb-8 px-2">
          Explore the future of AI with the 0G Compute Network. Run inference, fine-tune models, and manage your account seamlessly.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
          <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-sm sm:text-base" asChild>
            <Link href="/inference">Quick Start</Link>
          </Button>
          <Button size="lg" variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50 text-sm sm:text-base" asChild>
            <a href="https://docs.0g.ai/concepts/compute" target="_blank" rel="noopener noreferrer">
              Learn Concepts
            </a>
          </Button>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-4 sm:gap-8">
        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center gap-3 sm:gap-4 p-4 sm:p-6">
            <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 flex-shrink-0" />
            <CardTitle className="text-gray-900 text-base sm:text-lg">Account Management</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-2">
            <CardDescription className="text-gray-600 text-sm">
              Manage your account balance and add funds for AI services.
            </CardDescription>
          </CardContent>
          <CardFooter className="p-4 sm:p-6 pt-2">
            <Button variant="secondary" className="w-full bg-purple-50 text-purple-600 hover:bg-purple-100 text-sm" asChild>
              <Link href="/wallet">Go to Account</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center gap-3 sm:gap-4 p-4 sm:p-6">
            <Cpu className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 flex-shrink-0" />
            <CardTitle className="text-gray-900 text-base sm:text-lg">AI Inference</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-2">
            <CardDescription className="text-gray-600 text-sm">
              Chat with various AI models and experience decentralized AI.
            </CardDescription>
          </CardContent>
          <CardFooter className="p-4 sm:p-6 pt-2">
            <Button variant="secondary" className="w-full bg-purple-50 text-purple-600 hover:bg-purple-100 text-sm" asChild>
              <Link href="/inference">Go to Inference</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center gap-3 sm:gap-4 p-4 sm:p-6">
            <Wrench className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 flex-shrink-0" />
            <CardTitle className="text-gray-900 text-base sm:text-lg">Fine-tuning</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-2">
            <CardDescription className="text-gray-600 text-sm">
              Customize AI models with your own data for personalized use cases.
            </CardDescription>
          </CardContent>
          <CardFooter className="p-4 sm:p-6 pt-2">
            <Button variant="secondary" className="w-full bg-purple-50 text-purple-600 hover:bg-purple-100 text-sm" asChild>
              <Link href="/fine-tuning">Go to Fine-tuning</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
