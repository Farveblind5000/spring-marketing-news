export type Topic = 'ai' | 'marketing' | 'both'

export interface Source {
  id: string
  name: string
  url: string
  feed_url: string | null
  topic: Topic
  active: boolean
  last_scraped: string | null
  created_at: string
}

export interface Article {
  id: string
  source_id: string
  title: string
  url: string
  topic: Topic
  published_at: string | null
  scraped_at: string
  summary: string | null
  relevance_score: number | null
  read_time_min: number | null
  full_content: string | null
  // joined
  source?: Pick<Source, 'name' | 'url'>
}

export interface UserSave {
  id: string
  user_id: string
  article_id: string
  saved_at: string
  article?: Article
}

export interface Digest {
  id: string
  user_id: string
  week_number: number
  year: number
  content: string
  article_count: number | null
  source_count: number | null
  created_at: string
}
