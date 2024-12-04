import { useState } from 'react';
import { Search, Loader, AlertTriangle } from 'lucide-react';
import { apifyService } from '../services/apify';
import { supabase } from '../lib/supabase';
import { loggingService } from '../services/logging';

export function ApifyTestSection() {
  const [videoUrl, setVideoUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    if (!videoUrl.trim()) {
      setError('Please enter a video URL');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // First check if video exists in database
      const { data: videoExists } = await supabase
        .from('videos')
        .select('id')
        .eq('video_url', videoUrl)
        .single();

      if (!videoExists) {
        throw new Error('Video URL not found in database');
      }

      // Get video details from Apify
      const videoData = await apifyService.getVideoDetails(videoUrl);
      
      loggingService.addLog({
        type: 'info',
        message: 'Received video data from Apify',
        data: videoData
      });

      // Update video in database
      const { error: updateError } = await supabase
        .from('videos')
        .update(videoData)
        .eq('video_url', videoUrl);

      if (updateError) throw updateError;

      loggingService.addLog({
        type: 'success',
        message: 'Successfully updated video data',
        data: videoData
      });

      setVideoUrl(''); // Clear input after success
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process video';
      setError(errorMessage);
      
      loggingService.addLog({
        type: 'error',
        message: 'Failed to process video',
        data: { error, videoUrl }
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <h3 className="text-lg font-medium text-text-primary mb-4">Test Apify API</h3>
      
      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="Enter video URL from videos table"
            className="w-full px-4 py-2 bg-surface-secondary rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-cream"
            disabled={isProcessing}
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
        </div>

        <button
          onClick={handleTest}
          disabled={isProcessing || !videoUrl.trim()}
          className="w-full px-4 py-2 bg-cream text-stone-dark rounded-lg hover:bg-cream-dark transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          {isProcessing ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>Test Video URL</span>
            </>
          )}
        </button>

        {error && (
          <div className="flex items-center space-x-2 text-red-500 text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}