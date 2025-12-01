"use client";

import React from "react";
import { useAccount, useChainId } from 'wagmi';
import { AlertTriangle, Lightbulb, Terminal, CheckCircle } from 'lucide-react';
import { StateDisplay } from '@/components/ui/state-display';
import { Card, CardContent } from '@/components/ui/card';
import { ResourceCard } from '@/app/inference/components/drawer-components';

export default function FineTuningPage() {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  // Check if on mainnet (chain ID 16661)
  if (chainId === 16661) {
    return (
      <div className="w-full">
        <StateDisplay
          type="custom"
          icon={AlertTriangle}
          title="Fine-tuning Not Available on Mainnet"
          description="Fine-tuning features are currently only available on the testnet. Please switch to the testnet to access fine-tuning capabilities."
        >
          <p className="text-sm text-gray-500 mt-2">
            You can use the network switcher in your wallet to change to the 0G Testnet.
          </p>
        </StateDisplay>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="w-full">
        <StateDisplay type="wallet-disconnected" />
      </div>
    );
  }

  const comingSoonFeatures = [
    { title: "Upload Training Data", description: "Upload your custom datasets to train AI models" },
    { title: "Configure Training", description: "Set hyperparameters and training configurations" },
    { title: "Monitor Progress", description: "Track training progress and model performance" },
    { title: "Deploy Models", description: "Deploy your fine-tuned models for inference" },
  ];

  return (
    <div className="w-full">
      <div className="mb-3">
        <h1 className="text-lg font-semibold text-gray-900">
          Fine-tuning
        </h1>
        <p className="text-xs text-gray-500">
          Customize AI models with your own data
        </p>
      </div>

      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center border border-purple-200">
              <Lightbulb className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Fine-tuning on 0G Compute Network
          </h2>

          {/* Current Status Card - Using ResourceCard */}
          <div className="max-w-2xl mx-auto mb-8">
            <ResourceCard
              icon={Terminal}
              title="Currently Available via CLI"
              description="Fine-tuning is currently supported through the 0G CLI tools. You can start fine-tuning models today using the command-line interface."
              href="https://docs.0g.ai/developer-hub/building-on-0g/compute-network/fine-tuning"
              buttonText="View CLI Documentation"
            />
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
            Coming Soon: Web Interface
          </h3>

          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {comingSoonFeatures.map((feature, index) => (
              <Card key={index} className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">{feature.title}</h4>
                      <p className="text-sm text-gray-600">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
