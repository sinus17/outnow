export interface TikTokVideo {
  id: string;
  description: string;
  view_count: number;
  like_count: number;
  share_count: number;
  comment_count: number;
  author: {
    id: string;
    unique_id: string;
    nickname: string;
  };
}

export interface Hot50Track {
  id: string;
  title: string;
  artist: string;
  album_cover_url?: string;
  sound_page_url?: string;
  videos: TikTokVideo[];
  hot50?: Array<{
    position: number;
    previous_position: number | null;
    weeks_on_chart: number;
  }>;
}