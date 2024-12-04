import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Music2, Video, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatNumber } from '../lib/utils';
import { HoverVideoPlayer } from '../components/HoverVideoPlayer';

interface Track {
  id: string;
  title: string;
  artist: string;
  sound_page_url: string;
  album_cover_url: string | null;
}

interface TrackVideo {
  id: string;
  video_url: string;
  thumbnail_url: string;
  author: {
    id: string;
    unique_id: string;
    nickname: string;
  };
}

export function TrackDetailsPage() {
  const { position } = useParams();
  const [track, setTrack] = useState<Track | null>(null);
  const [videos, setVideos] = useState<TrackVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrackAndVideos() {
      if (!position) return;

      try {
        // First get track from hot50 table with track details
        const { data: hot50Data, error: hot50Error } = await supabase
          .from('hot50')
          .select(`
            tracks (
              id,
              title,
              artist,
              sound_page_url,
              album_cover_url
            )
          `)
          .eq('rank', parseInt(position))
          .eq('date', new Date().toISOString().split('T')[0])
          .single();

        if (hot50Error) throw hot50Error;
        if (!hot50Data?.tracks) throw new Error('Track not found');

        const trackData = hot50Data.tracks as Track;
        setTrack(trackData);

        // Then get videos from position-specific table
        const tableName = `hot50_videos_${position}`;
        const { data: videosData, error: videosError } = await supabase
          .from(tableName)
          .select(`
            id,
            video_url,
            thumbnail_url,
            author:authors (
              id,
              unique_id,
              nickname
            )
          `)
          .eq('track_id', trackData.id)
          .order('created_at', { ascending: false });

        if (videosError) throw videosError;
        setVideos(videosData || []);
      } catch (error) {
        console.error('Error fetching track data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load track data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTrackAndVideos();
  }, [position]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-text-primary">Loading track details...</div>
        </div>
      </div>
    );
  }

  if (error || !track) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">Error: {error || 'Track not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link 
        to="/"
        className="inline-flex items-center space-x-2 text-text-secondary hover:text-text-primary mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Hot50</span>
      </Link>

      <div className="bg-surface border border-border rounded-lg p-6 mb-8">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0 w-16 h-16 bg-surface-secondary rounded-lg overflow-hidden">
            {track.album_cover_url ? (
              <img
                src={track.album_cover_url}
                alt={`${track.title} cover`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music2 className="w-8 h-8 text-cream" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-semibold text-text-primary truncate">
                {track.title}
              </h1>
              {track.sound_page_url && (
                <a
                  href={track.sound_page_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 px-2 py-1 bg-cream/10 rounded-lg hover:bg-cream/20 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-cream" />
                  <span className="text-sm text-cream">TikTok</span>
                </a>
              )}
            </div>
            <p className="text-text-secondary mt-1">{track.artist}</p>
          </div>

          <div className="flex items-center space-x-2">
            <Video className="w-5 h-5 text-cream" />
            <span className="text-lg font-medium text-cream">
              {videos.length} videos
            </span>
          </div>
        </div>
      </div>

      {videos.length === 0 ? (
        <div className="flex items-center justify-center h-64 bg-surface border border-border rounded-lg">
          <p className="text-text-secondary">No videos found for this track</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div 
              key={video.id}
              className="bg-surface border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              <HoverVideoPlayer
                src={video.video_url}
                poster={video.thumbnail_url}
                className="w-full"
              />
              <div className="p-4">
                <div className="flex items-center justify-between text-text-secondary text-sm">
                  <span>@{video.author.unique_id}</span>
                  <a
                    href={video.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cream hover:text-cream-dark transition-colors"
                  >
                    Watch on TikTok
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}