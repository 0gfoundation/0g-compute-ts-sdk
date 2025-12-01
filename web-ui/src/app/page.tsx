"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cpu, Wrench, Wallet } from "lucide-react";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter mb-6 text-gray-900">
          Discover Decentralized AI
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-gray-600 mb-8">
          Explore the future of AI with the 0G Compute Network. Run inference, fine-tune models, and manage your account seamlessly.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" className="bg-purple-600 hover:bg-purple-700" asChild>
            <Link href="/inference">Quick Start</Link>
          </Button>
          <Button size="lg" variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50" asChild>
            <a href="https://docs.0g.ai/concepts/compute" target="_blank" rel="noopener noreferrer">
              Learn Concepts
            </a>
          </Button>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-8">
        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center gap-4">
            <Wallet className="w-8 h-8 text-purple-600" />
            <CardTitle className="text-gray-900">Account Management</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-gray-600">
              Manage your account balance and add funds for AI services.
            </CardDescription>
          </CardContent>
          <CardFooter>
            <Button variant="secondary" className="w-full bg-purple-50 text-purple-600 hover:bg-purple-100" asChild>
              <Link href="/wallet">Go to Account</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center gap-4">
            <Cpu className="w-8 h-8 text-purple-600" />
            <CardTitle className="text-gray-900">AI Inference</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-gray-600">
              Chat with various AI models and experience decentralized AI.
            </CardDescription>
          </CardContent>
          <CardFooter>
            <Button variant="secondary" className="w-full bg-purple-50 text-purple-600 hover:bg-purple-100" asChild>
              <Link href="/inference">Go to Inference</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center gap-4">
            <Wrench className="w-8 h-8 text-purple-600" />
            <CardTitle className="text-gray-900">Fine-tuning</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-gray-600">
              Customize AI models with your own data for personalized use cases.
            </CardDescription>
          </CardContent>
          <CardFooter>
            <Button variant="secondary" className="w-full bg-purple-50 text-purple-600 hover:bg-purple-100" asChild>
              <Link href="/fine-tuning">Go to Fine-tuning</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
