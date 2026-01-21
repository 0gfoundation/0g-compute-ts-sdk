'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { use0GBroker } from '@/shared/hooks/use0GBroker'
import { useServiceProviders } from '../hooks/useServiceProviders'
import { useSpeechToText } from '@/shared/hooks/useSpeechToText'
import { StateDisplay } from '@/components/ui/state-display'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { TopUpModal } from '../chat/components/TopUpModal'
import {
    Upload,
    Mic,
    Square,
    Play,
    Pause,
    Copy,
    Trash2,
    History,
    X,
    AlertCircle,
    CheckCircle2,
    Loader2,
    ChevronDown,
    Plus,
    FileAudio,
} from 'lucide-react'
import { cn, copyToClipboard } from '@/lib/utils'

export default function SpeechToTextPage() {
    const { isConnected } = useAccount()
    const { broker, isInitializing: brokerInitializing, ledgerInfo, refreshLedgerInfo } = use0GBroker()

    // Provider management
    const {
        providers,
        selectedProvider,
        setSelectedProvider,
        serviceMetadata,
        providerBalance,
        providerPendingRefund,
        isInitializing: providersInitializing,
        refreshProviderBalance,
    } = useServiceProviders(broker, 'speech-to-text')

    // Transcription state
    const [transcriptionError, setTranscriptionError] = useState<string | null>(null)

    const {
        isTranscribing,
        currentTranscription,
        transcriptions,
        transcribeAudio,
        stopTranscription,
        loadHistory,
        clearHistory,
    } = useSpeechToText({
        broker,
        selectedProvider,
        serviceMetadata,
        onError: setTranscriptionError,
    })

    // UI state
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [showTopUpModal, setShowTopUpModal] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const [topUpAmount, setTopUpAmount] = useState('')
    const [isTopping, setIsTopping] = useState(false)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    // Recording state
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

    // Audio player ref
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    // Provider dropdown state
    const [isProviderDropdownOpen, setIsProviderDropdownOpen] = useState(false)

    // Load history on mount
    useEffect(() => {
        loadHistory()
    }, [loadHistory])

    // Clear error after timeout
    useEffect(() => {
        if (transcriptionError) {
            const timeout = setTimeout(() => setTranscriptionError(null), 8000)
            return () => clearTimeout(timeout)
        }
    }, [transcriptionError])

    // Cleanup audio URL on unmount
    useEffect(() => {
        return () => {
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl)
            }
        }
    }, [audioUrl])

    // Handle file selection
    const handleFileSelect = useCallback((file: File) => {
        // Validate file type
        const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/m4a', 'audio/flac']
        if (!validTypes.some(type => file.type.includes(type.split('/')[1]))) {
            setTranscriptionError('Please select a valid audio file (MP3, WAV, OGG, WebM, M4A, FLAC)')
            return
        }

        // Revoke previous URL
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl)
        }

        setSelectedFile(file)
        setAudioUrl(URL.createObjectURL(file))
    }, [audioUrl])

    // Handle drag and drop
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        const file = e.dataTransfer.files[0]
        if (file) {
            handleFileSelect(file)
        }
    }, [handleFileSelect])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
    }, [])

    // Handle file input change
    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            handleFileSelect(file)
        }
    }, [handleFileSelect])

    // Start recording
    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
            })

            audioChunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data)
                }
            }

            mediaRecorder.onstop = () => {
                const mimeType = mediaRecorder.mimeType
                const blob = new Blob(audioChunksRef.current, { type: mimeType })
                const extension = mimeType.includes('webm') ? 'webm' : 'm4a'
                const file = new File([blob], `recording-${Date.now()}.${extension}`, { type: mimeType })

                handleFileSelect(file)

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorderRef.current = mediaRecorder
            mediaRecorder.start(1000) // Collect data every second

            setIsRecording(true)
            setRecordingTime(0)

            // Start timer
            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1)
            }, 1000)
        } catch (err) {
            setTranscriptionError('Failed to access microphone. Please check permissions.')
        }
    }, [handleFileSelect])

    // Stop recording
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)

            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current)
                recordingIntervalRef.current = null
            }
        }
    }, [isRecording])

    // Format recording time
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    // Handle transcription
    const handleTranscribe = useCallback(async () => {
        if (!selectedFile) {
            setTranscriptionError('Please select or record an audio file first')
            return
        }

        if (!selectedProvider) {
            setTranscriptionError('Please select a provider first')
            return
        }

        if (providerBalance === null || providerBalance <= 0) {
            setShowTopUpModal(true)
            return
        }

        await transcribeAudio({ file: selectedFile })
    }, [selectedFile, selectedProvider, providerBalance, transcribeAudio])

    // Copy transcription text
    const handleCopyText = useCallback(async (text: string, id: string) => {
        await copyToClipboard(text)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }, [])

    // Toggle audio playback
    const togglePlayback = useCallback(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause()
            } else {
                audioRef.current.play()
            }
            setIsPlaying(!isPlaying)
        }
    }, [isPlaying])

    // Clear selected file
    const clearFile = useCallback(() => {
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl)
        }
        setSelectedFile(null)
        setAudioUrl(null)
        setIsPlaying(false)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }, [audioUrl])

    // Wallet not connected
    if (!isConnected) {
        return (
            <div className="w-full">
                <StateDisplay
                    type="wallet-disconnected"
                    description="Please connect your wallet to access speech-to-text features."
                />
            </div>
        )
    }

    const isLoading = brokerInitializing || providersInitializing

    // No providers available
    if (!isLoading && providers.length === 0) {
        return (
            <div className="w-full">
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center">
                            <Mic className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-foreground">Speech to Text</h1>
                            <p className="text-sm text-muted-foreground">
                                Transcribe audio using decentralized AI
                            </p>
                        </div>
                    </div>
                </div>
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mb-4">
                            <Mic className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">No Providers Available</h3>
                        <p className="text-sm text-muted-foreground text-center max-w-md">
                            There are currently no speech-to-text providers available. Please try again later.
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="w-full">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center">
                        <Mic className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-foreground">Speech to Text</h1>
                        <p className="text-sm text-muted-foreground">
                            Transcribe audio using decentralized AI
                        </p>
                    </div>
                </div>
            </div>

            {/* Loading state */}
            {isLoading ? (
                <StateDisplay type="loading" />
            ) : (
                <div className="space-y-4">
                    {/* Provider selector and balance */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                {/* Provider dropdown */}
                                <div className="flex-1">
                                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                                        Provider
                                    </label>
                                    <div className="relative">
                                        <button
                                            onClick={() => setIsProviderDropdownOpen(!isProviderDropdownOpen)}
                                            className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-sm"
                                        >
                                            <span className="truncate">
                                                {selectedProvider?.name || 'Select provider'}
                                            </span>
                                            <ChevronDown className="h-4 w-4 text-gray-400 ml-2" />
                                        </button>

                                        {isProviderDropdownOpen && providers.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                                                {providers.map((provider) => (
                                                    <div
                                                        key={provider.address}
                                                        onClick={() => {
                                                            setSelectedProvider(provider)
                                                            setIsProviderDropdownOpen(false)
                                                        }}
                                                        className={cn(
                                                            "px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm",
                                                            selectedProvider?.address === provider.address && "bg-purple-50"
                                                        )}
                                                    >
                                                        <div className="font-medium">{provider.name}</div>
                                                        <div className="text-xs text-gray-500 truncate">
                                                            {provider.address}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Balance */}
                                <div className="sm:w-48">
                                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                                        Provider Balance
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm">
                                            {providerBalance !== null ? (
                                                <span className="font-medium">{providerBalance.toFixed(4)} 0G</span>
                                            ) : (
                                                <span className="text-gray-400">--</span>
                                            )}
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="default"
                                            onClick={() => setShowTopUpModal(true)}
                                            disabled={!selectedProvider}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Error display */}
                    {transcriptionError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-700">{transcriptionError}</p>
                        </div>
                    )}

                    {/* Main content */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Upload / Record section */}
                        <Card>
                            <CardContent className="p-4">
                                <h3 className="font-medium text-gray-900 mb-3">Audio Input</h3>

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    {/* Upload area */}
                                    <div
                                        onDrop={handleDrop}
                                        onDragOver={handleDragOver}
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors"
                                    >
                                        <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                        <p className="text-sm font-medium text-gray-700">Upload File</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            MP3, WAV, OGG, WebM
                                        </p>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="audio/*"
                                            onChange={handleFileInputChange}
                                            className="hidden"
                                        />
                                    </div>

                                    {/* Record area */}
                                    <div
                                        onClick={isRecording ? stopRecording : startRecording}
                                        className={cn(
                                            "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
                                            isRecording
                                                ? "border-red-400 bg-red-50"
                                                : "border-gray-300 hover:border-purple-400 hover:bg-purple-50"
                                        )}
                                    >
                                        {isRecording ? (
                                            <>
                                                <div className="relative w-8 h-8 mx-auto mb-2">
                                                    <Square className="h-8 w-8 text-red-500" />
                                                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                                                </div>
                                                <p className="text-sm font-medium text-red-700">Recording...</p>
                                                <p className="text-xs text-red-500 mt-1 font-mono">
                                                    {formatTime(recordingTime)}
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <Mic className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                                <p className="text-sm font-medium text-gray-700">Record Audio</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Click to start
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Selected file preview */}
                                {selectedFile && (
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <FileAudio className="h-5 w-5 text-purple-600 flex-shrink-0" />
                                                <span className="text-sm font-medium text-gray-900 truncate">
                                                    {selectedFile.name}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                                </span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={clearFile}
                                                className="h-7 w-7 p-0"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        {/* Audio player */}
                                        {audioUrl && (
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={togglePlayback}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    {isPlaying ? (
                                                        <Pause className="h-4 w-4" />
                                                    ) : (
                                                        <Play className="h-4 w-4" />
                                                    )}
                                                </Button>
                                                <audio
                                                    ref={audioRef}
                                                    src={audioUrl}
                                                    onEnded={() => setIsPlaying(false)}
                                                    className="flex-1 h-8"
                                                    controls
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Transcribe button */}
                                <Button
                                    onClick={handleTranscribe}
                                    disabled={!selectedFile || !selectedProvider || isTranscribing}
                                    variant="gradient"
                                    className="w-full mt-4"
                                >
                                    {isTranscribing ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Transcribing...
                                        </>
                                    ) : (
                                        <>
                                            <Mic className="h-4 w-4 mr-2" />
                                            Transcribe
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Transcription result */}
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-medium text-gray-900">Transcription</h3>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowHistory(!showHistory)}
                                        className="h-8 px-2"
                                    >
                                        <History className="h-4 w-4 mr-1.5" />
                                        History
                                    </Button>
                                </div>

                                {currentTranscription ? (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <p className="text-xs text-gray-500">
                                                {new Date(currentTranscription.timestamp).toLocaleString()}
                                            </p>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleCopyText(currentTranscription.text, currentTranscription.id)}
                                                className="h-7 w-7 p-0"
                                            >
                                                {copiedId === currentTranscription.id ? (
                                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <Copy className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                            {currentTranscription.text}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-3">
                                            Source: {currentTranscription.fileName}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                                        <Mic className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                                        <p className="text-sm text-gray-500">
                                            {isTranscribing
                                                ? 'Transcribing your audio...'
                                                : 'Upload or record audio to get started'}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* History panel */}
                    {showHistory && transcriptions.length > 0 && (
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-medium text-gray-900">
                                        Transcription History ({transcriptions.length})
                                    </h3>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearHistory}
                                        className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4 mr-1.5" />
                                        Clear All
                                    </Button>
                                </div>

                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {transcriptions.map((item) => (
                                        <div
                                            key={item.id}
                                            className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <FileAudio className="h-3.5 w-3.5" />
                                                    <span className="truncate max-w-[150px]">{item.fileName}</span>
                                                    <span>|</span>
                                                    <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleCopyText(item.text, item.id)}
                                                    className="h-6 w-6 p-0"
                                                >
                                                    {copiedId === item.id ? (
                                                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                                    ) : (
                                                        <Copy className="h-3.5 w-3.5" />
                                                    )}
                                                </Button>
                                            </div>
                                            <p className="text-sm text-gray-700 line-clamp-2">
                                                {item.text}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Top Up Modal */}
            <TopUpModal
                isOpen={showTopUpModal}
                onClose={() => setShowTopUpModal(false)}
                broker={broker}
                selectedProvider={selectedProvider}
                topUpAmount={topUpAmount}
                setTopUpAmount={setTopUpAmount}
                isTopping={isTopping}
                setIsTopping={setIsTopping}
                providerBalance={providerBalance}
                providerPendingRefund={providerPendingRefund}
                ledgerInfo={ledgerInfo}
                refreshLedgerInfo={refreshLedgerInfo}
                refreshProviderBalance={refreshProviderBalance}
                setErrorWithTimeout={(err) => setTranscriptionError(err)}
            />
        </div>
    )
}
