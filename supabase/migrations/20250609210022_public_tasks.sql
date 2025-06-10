-- Public Tasks Feature Migration
-- Run this in your Supabase SQL Editor

-- Create enum types for better data integrity
CREATE TYPE task_completion_type AS ENUM ('APPLICATION_BASED', 'PROOF_BASED');
CREATE TYPE task_location_type AS ENUM ('REMOTE', 'ONSITE', 'HYBRID');
CREATE TYPE payout_method AS ENUM ('CRYPTO', 'CASH', 'WIRE_TRANSFER', 'VENMO', 'ZELLE', 'PAYPAL', 'WESTERN_UNION', 'MONEYGRAM', 'WISE', 'REMITLY', 'XOOM');
CREATE TYPE grading_method AS ENUM ('CREATOR_ONLY', 'COMMUNITY_VOTING', 'BOTH');
CREATE TYPE application_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'GRADED');

-- Create public_tasks table
CREATE TABLE IF NOT EXISTS public_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Task details
  completion_type task_completion_type NOT NULL DEFAULT 'APPLICATION_BASED',
  location_type task_location_type NOT NULL DEFAULT 'REMOTE',
  location_address TEXT,
  location_lat FLOAT,
  location_lng FLOAT,
  location_city TEXT,
  location_country TEXT,
  language TEXT NOT NULL DEFAULT 'English',
  
  -- Payment information
  payment_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_currency TEXT NOT NULL DEFAULT 'USD',
  supported_payout_methods payout_method[] NOT NULL DEFAULT '{}',
  
  -- Task management
  max_applicants INTEGER,
  deadline TIMESTAMP WITH TIME ZONE,
  grading_method grading_method NOT NULL DEFAULT 'CREATOR_ONLY',
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Submission requirements
  submission_instructions TEXT,
  
  -- Stats
  application_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0
);

-- Create public_task_tags table for user-created categories
CREATE TABLE IF NOT EXISTS public_task_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public_tasks(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, tag_name)
);

-- Create public_task_media table for attachments
CREATE TABLE IF NOT EXISTS public_task_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public_tasks(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'image' or 'video'
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create public_task_applications table
CREATE TABLE IF NOT EXISTS public_task_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public_tasks(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status application_status DEFAULT 'PENDING',
  
  -- Application details
  application_message TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  
  -- For proof-based tasks
  submission_content TEXT,
  submission_media_urls TEXT[],
  submitted_at TIMESTAMP WITH TIME ZONE,
  
  -- Grading
  creator_rating INTEGER CHECK (creator_rating BETWEEN 1 AND 5),
  creator_feedback TEXT,
  community_rating FLOAT,
  community_votes INTEGER DEFAULT 0,
  graded_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(task_id, applicant_id)
);

-- Create public_task_comments table for anonymous commenting
CREATE TABLE IF NOT EXISTS public_task_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public_tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for anonymous
  commenter_name TEXT NOT NULL, -- Display name (can be anonymous)
  comment_text TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create public_task_votes table for community voting
CREATE TABLE IF NOT EXISTS public_task_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES public_task_applications(id) ON DELETE CASCADE,
  voter_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for anonymous
  voter_ip TEXT, -- For anonymous voting limits
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(application_id, voter_id), -- Prevent duplicate votes from registered users
  UNIQUE(application_id, voter_ip) -- Prevent duplicate votes from same IP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_public_tasks_creator_id ON public_tasks(creator_id);
CREATE INDEX IF NOT EXISTS idx_public_tasks_location_type ON public_tasks(location_type);
CREATE INDEX IF NOT EXISTS idx_public_tasks_is_active ON public_tasks(is_active);
CREATE INDEX IF NOT EXISTS idx_public_tasks_created_at ON public_tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_public_tasks_deadline ON public_tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_public_tasks_payment_amount ON public_tasks(payment_amount);

CREATE INDEX IF NOT EXISTS idx_public_task_tags_task_id ON public_task_tags(task_id);
CREATE INDEX IF NOT EXISTS idx_public_task_tags_tag_name ON public_task_tags(tag_name);

CREATE INDEX IF NOT EXISTS idx_public_task_media_task_id ON public_task_media(task_id);

CREATE INDEX IF NOT EXISTS idx_public_task_applications_task_id ON public_task_applications(task_id);
CREATE INDEX IF NOT EXISTS idx_public_task_applications_applicant_id ON public_task_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_public_task_applications_status ON public_task_applications(status);

CREATE INDEX IF NOT EXISTS idx_public_task_comments_task_id ON public_task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_public_task_comments_created_at ON public_task_comments(created_at);

CREATE INDEX IF NOT EXISTS idx_public_task_votes_application_id ON public_task_votes(application_id);

-- Add RLS policies
ALTER TABLE public_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_task_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_task_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_task_votes ENABLE ROW LEVEL SECURITY;

-- RLS policies for public_tasks (viewable by all, editable by creator)
CREATE POLICY "Public tasks are viewable by everyone"
  ON public_tasks
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create public tasks"
  ON public_tasks
  FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their public tasks"
  ON public_tasks
  FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their public tasks"
  ON public_tasks
  FOR DELETE
  USING (auth.uid() = creator_id);

-- RLS policies for public_task_tags
CREATE POLICY "Public task tags are viewable by everyone"
  ON public_task_tags
  FOR SELECT
  USING (true);

CREATE POLICY "Task creators can manage tags"
  ON public_task_tags
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public_tasks
      WHERE public_tasks.id = public_task_tags.task_id
      AND public_tasks.creator_id = auth.uid()
    )
  );

-- RLS policies for public_task_media
CREATE POLICY "Public task media are viewable by everyone"
  ON public_task_media
  FOR SELECT
  USING (true);

CREATE POLICY "Task creators can manage media"
  ON public_task_media
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public_tasks
      WHERE public_tasks.id = public_task_media.task_id
      AND public_tasks.creator_id = auth.uid()
    )
  );

-- RLS policies for public_task_applications
CREATE POLICY "Users can view applications for their tasks"
  ON public_task_applications
  FOR SELECT
  USING (
    auth.uid() = applicant_id OR
    EXISTS (
      SELECT 1 FROM public_tasks
      WHERE public_tasks.id = public_task_applications.task_id
      AND public_tasks.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can create applications"
  ON public_task_applications
  FOR INSERT
  WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Users can update their own applications"
  ON public_task_applications
  FOR UPDATE
  USING (auth.uid() = applicant_id);

CREATE POLICY "Task creators can update application status"
  ON public_task_applications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public_tasks
      WHERE public_tasks.id = public_task_applications.task_id
      AND public_tasks.creator_id = auth.uid()
    )
  );

-- RLS policies for public_task_comments (viewable by all)
CREATE POLICY "Public task comments are viewable by everyone"
  ON public_task_comments
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create comments"
  ON public_task_comments
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own comments"
  ON public_task_comments
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS policies for public_task_votes
CREATE POLICY "Votes are viewable by task creators and voters"
  ON public_task_votes
  FOR SELECT
  USING (
    auth.uid() = voter_id OR
    EXISTS (
      SELECT 1 FROM public_task_applications pta
      JOIN public_tasks pt ON pt.id = pta.task_id
      WHERE pta.id = public_task_votes.application_id
      AND pt.creator_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create votes"
  ON public_task_votes
  FOR INSERT
  WITH CHECK (true);

-- Functions for updating statistics
CREATE OR REPLACE FUNCTION update_application_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public_tasks 
    SET application_count = application_count + 1 
    WHERE id = NEW.task_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public_tasks 
    SET application_count = application_count - 1 
    WHERE id = OLD.task_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_community_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public_task_applications
  SET 
    community_rating = (
      SELECT AVG(rating)::FLOAT
      FROM public_task_votes
      WHERE application_id = NEW.application_id
    ),
    community_votes = (
      SELECT COUNT(*)
      FROM public_task_votes
      WHERE application_id = NEW.application_id
    )
  WHERE id = NEW.application_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_application_count
  AFTER INSERT OR DELETE ON public_task_applications
  FOR EACH ROW EXECUTE FUNCTION update_application_count();

CREATE TRIGGER trigger_update_community_rating
  AFTER INSERT OR UPDATE OR DELETE ON public_task_votes
  FOR EACH ROW EXECUTE FUNCTION update_community_rating();

-- Function to get public tasks with filters
CREATE OR REPLACE FUNCTION get_public_tasks(
  p_location_type task_location_type DEFAULT NULL,
  p_min_payment DECIMAL DEFAULT NULL,
  p_max_payment DECIMAL DEFAULT NULL,
  p_tags TEXT[] DEFAULT NULL,
  p_language TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  creator_name TEXT,
  creator_avatar TEXT,
  completion_type task_completion_type,
  location_type task_location_type,
  location_city TEXT,
  location_country TEXT,
  language TEXT,
  payment_amount DECIMAL,
  payment_currency TEXT,
  supported_payout_methods payout_method[],
  deadline TIMESTAMP WITH TIME ZONE,
  application_count INTEGER,
  view_count INTEGER,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pt.id,
    pt.title,
    pt.description,
    u.name as creator_name,
    u.avatar_url as creator_avatar,
    pt.completion_type,
    pt.location_type,
    pt.location_city,
    pt.location_country,
    pt.language,
    pt.payment_amount,
    pt.payment_currency,
    pt.supported_payout_methods,
    pt.deadline,
    pt.application_count,
    pt.view_count,
    COALESCE(
      ARRAY_AGG(ptt.tag_name) FILTER (WHERE ptt.tag_name IS NOT NULL),
      '{}'::TEXT[]
    ) as tags,
    pt.created_at
  FROM public_tasks pt
  JOIN users u ON u.id = pt.creator_id
  LEFT JOIN public_task_tags ptt ON ptt.task_id = pt.id
  WHERE 
    pt.is_active = true
    AND (p_location_type IS NULL OR pt.location_type = p_location_type)
    AND (p_min_payment IS NULL OR pt.payment_amount >= p_min_payment)
    AND (p_max_payment IS NULL OR pt.payment_amount <= p_max_payment)
    AND (p_language IS NULL OR pt.language = p_language)
    AND (
      p_tags IS NULL OR 
      EXISTS (
        SELECT 1 FROM public_task_tags ptt2 
        WHERE ptt2.task_id = pt.id 
        AND ptt2.tag_name = ANY(p_tags)
      )
    )
  GROUP BY pt.id, u.name, u.avatar_url
  ORDER BY pt.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger for public_tasks
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_public_tasks_updated_at
  BEFORE UPDATE ON public_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public_tasks IS 'Public tasks that can be viewed and applied to by any user';
COMMENT ON TABLE public_task_applications IS 'Applications and submissions for public tasks';
COMMENT ON TABLE public_task_comments IS 'Comments on public tasks, supports anonymous commenting';
COMMENT ON TABLE public_task_votes IS 'Community voting on task submissions'; 