"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useAccount } from 'wagmi';
import { use0GBroker } from '../../shared/hooks/use0GBroker';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StateDisplay } from '@/components/ui/state-display';
import { BalanceCard, AddFundsForm, WithdrawDialog, FundDistribution } from './components';
import { TransactionHistory, useTransactionHistory } from './components/TransactionHistory';
import { Loader2 } from 'lucide-react';

function LedgerContent() {
  const { isConnected } = useAccount();
  const searchParams = useSearchParams();
  const {
    broker,
    isInitializing,
    ledgerInfo,
    refreshLedgerInfo,
    depositFund,
  } = use0GBroker();

  const [activeTab, setActiveTab] = useState<'overview' | 'detail' | 'history'>('overview');
  const [expandedRefunds, setExpandedRefunds] = useState<{ [key: string]: boolean }>({});
  const { transactions, isLoading: txLoading, refreshTransactions, addTransaction } = useTransactionHistory();
  const [refundDetails, setRefundDetails] = useState<{ [key: string]: { amount: bigint, remainTime: bigint }[] }>({});
  const [loadingRefunds, setLoadingRefunds] = useState<{ [key: string]: boolean }>({});
  const [isRetrieving, setIsRetrieving] = useState<{ [key: string]: boolean }>({});
  const [isRetrievingAll, setIsRetrievingAll] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState<{ message: string, show: boolean }>({ message: '', show: false });
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle tab parameter from URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'transactions') {
      setActiveTab('detail');
    } else if (tab === 'history') {
      setActiveTab('history');
    } else {
      setActiveTab('overview');
    }
  }, [searchParams]);

  // Auto-refresh ledger info when component mounts and when wallet connection changes
  useEffect(() => {
    if (isConnected && refreshLedgerInfo) {
      refreshLedgerInfo();
    }
  }, [isConnected, refreshLedgerInfo]);

  // Helper function to format numbers and avoid scientific notation
  const formatNumber = (value: string | number) => {
    if (!value || value === "0" || value === 0) return "0";
    const num = parseFloat(value.toString());
    if (isNaN(num)) return "0";
    return num.toLocaleString('en-US', {
      useGrouping: false,
      minimumFractionDigits: 0,
      maximumFractionDigits: 20
    });
  };

  // Helper function to format time from seconds
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours}h ${minutes}min ${secs}s`;
  };

  // Function to fetch refund details
  const fetchRefundDetails = async (provider: string, type: 'inference' | 'fine-tuning') => {
    if (!broker) return;

    const key = `${type}-${provider}`;
    setLoadingRefunds(prev => ({ ...prev, [key]: true }));

    try {
      let refunds: { amount: bigint, remainTime: bigint }[] = [];

      if (type === 'inference') {
        const [, refundData] = await broker.inference.getAccountWithDetail(provider);
        refunds = refundData;
      } else {
        if (!broker.fineTuning) {
          throw new Error('Fine-tuning broker is not available');
        }
        const { refunds: refundData } = await broker.fineTuning.getAccountWithDetail(provider);
        refunds = refundData;
      }

      setRefundDetails(prev => ({ ...prev, [key]: refunds }));
    } catch {
      // Silently handle refund details fetching errors
    } finally {
      setLoadingRefunds(prev => ({ ...prev, [key]: false }));
    }
  };

  // Function to toggle refund details expansion
  const toggleRefundDetails = async (provider: string, type: 'inference' | 'fine-tuning') => {
    const key = `${type}-${provider}`;
    const isCurrentlyExpanded = expandedRefunds[key];

    if (!isCurrentlyExpanded && !refundDetails[key]) {
      await fetchRefundDetails(provider, type);
    }

    setExpandedRefunds(prev => ({ ...prev, [key]: !isCurrentlyExpanded }));
  };

  // Use real ledger info if available, otherwise show placeholder
  const displayLedgerInfo = ledgerInfo || {
    totalBalance: "0.000000",
    availableBalance: "0.000000",
    locked: "0.000000",
    inferences: [],
    fineTunings: [],
  };

  const handleRetrieveAll = async () => {
    if (!broker) return;
    setIsRetrievingAll(true);
    setError(null);
    try {
      await Promise.all([
        broker.ledger.retrieveFund('inference'),
        broker.ledger.retrieveFund('fine-tuning')
      ]);
      setShowSuccessAlert({
        message: 'All provider fund retrieval has been requested successfully, please wait for <strong>lock period</strong>. Check the Distributed Provider Funds details section for wait times.<br/>Funds that have passed the lock period have been retrieved to your Available Balance.',
        show: true
      });
      setTimeout(() => setShowSuccessAlert({ message: '', show: false }), 8000);
      await refreshLedgerInfo();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to retrieve all funds';
      setError(errorMessage);
    } finally {
      setIsRetrievingAll(false);
    }
  };

  const handleRetrieveInference = async () => {
    if (!broker) return;
    setIsRetrieving(prev => ({ ...prev, inference: true }));
    setError(null);
    try {
      await broker.ledger.retrieveFund('inference');
      setShowSuccessAlert({ message: 'Inference funds retrieve request submitted', show: true });
      setTimeout(() => setShowSuccessAlert({ message: '', show: false }), 3000);
      await refreshLedgerInfo();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to retrieve inference funds';
      setError(errorMessage);
    } finally {
      setIsRetrieving(prev => ({ ...prev, inference: false }));
    }
  };

  const handleRetrieveFineTuning = async () => {
    if (!broker) return;
    setIsRetrieving(prev => ({ ...prev, 'fine-tuning': true }));
    setError(null);
    try {
      await broker.ledger.retrieveFund('fine-tuning');
      setShowSuccessAlert({ message: 'Fine-tuning funds retrieve request submitted', show: true });
      setTimeout(() => setShowSuccessAlert({ message: '', show: false }), 3000);
      await refreshLedgerInfo();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to retrieve fine-tuning funds';
      setError(errorMessage);
    } finally {
      setIsRetrieving(prev => ({ ...prev, 'fine-tuning': false }));
    }
  };

  if (!isConnected) {
    return (
      <div className="w-full">
        <StateDisplay type="wallet-disconnected" />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Account</h1>
            <p className="text-sm text-muted-foreground">Manage your balance and funds</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'overview' | 'detail' | 'history')}>
        <div className="bg-card rounded-t-xl border border-border">
          <div className="flex border-b border-border">
            <TabsList className="bg-transparent p-0 h-auto">
              <TabsTrigger
                value="overview"
                className="px-6 py-4 font-medium text-sm rounded-none border-b-2 border-transparent transition-all relative data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-card data-[state=active]:shadow-none text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="detail"
                className="px-6 py-4 font-medium text-sm rounded-none border-b-2 border-transparent transition-all relative data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-card data-[state=active]:shadow-none text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                Fund Distribution
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="px-6 py-4 font-medium text-sm rounded-none border-b-2 border-transparent transition-all relative data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-card data-[state=active]:shadow-none text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                History
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="bg-card rounded-b-xl border border-border border-t-0 p-6">
            <TabsContent value="overview" className="mt-0 space-y-6">
              {/* Total Balance Section */}
              <BalanceCard
                title="Total Balance"
                amount={formatNumber(displayLedgerInfo.totalBalance)}
                isLoading={isInitializing}
              />

              {/* Add Funds Section - Now self-contained */}
              <AddFundsForm
                depositFund={depositFund}
                onSuccess={refreshLedgerInfo}
              />
            </TabsContent>

            <TabsContent value="detail" className="mt-0">
              <FundDistribution
                ledgerInfo={displayLedgerInfo}
                onWithdraw={() => setShowWithdrawModal(true)}
                onRetrieveAll={handleRetrieveAll}
                onRetrieveInference={handleRetrieveInference}
                onRetrieveFineTuning={handleRetrieveFineTuning}
                isRetrievingAll={isRetrievingAll}
                isRetrievingInference={isRetrieving.inference || false}
                isRetrievingFineTuning={isRetrieving['fine-tuning'] || false}
                expandedRefunds={expandedRefunds}
                onToggleRefund={toggleRefundDetails}
                refundDetails={refundDetails}
                loadingRefunds={loadingRefunds}
                onRefreshRefund={fetchRefundDetails}
                showSuccessAlert={showSuccessAlert}
                error={error}
                formatNumber={formatNumber}
                formatTime={formatTime}
              />
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <TransactionHistory
                transactions={transactions}
                isLoading={txLoading}
                onRefresh={refreshTransactions}
                formatNumber={formatNumber}
                explorerBaseUrl="https://chainscan-newton.0g.ai"
              />
            </TabsContent>
        </div>
      </Tabs>

      {/* Withdraw Dialog - Now self-contained */}
      <WithdrawDialog
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        availableBalance={displayLedgerInfo.availableBalance}
        totalBalance={displayLedgerInfo.totalBalance}
        lockedBalance={displayLedgerInfo.locked}
        refund={(amount) => broker!.ledger.refund(amount)}
        onSuccess={refreshLedgerInfo}
        onDeleteSuccess={() => window.location.href = '/'}
      />
    </div>
  );
}

export default function LedgerPage() {
  return (
    <Suspense fallback={
      <div className="w-full flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <LedgerContent />
    </Suspense>
  );
}
