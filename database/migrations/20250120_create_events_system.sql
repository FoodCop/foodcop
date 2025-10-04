-- =====================================================
-- FUZO Living Artifact: Events and Job Queue System
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- =====================================================
-- 1. EVENTS TABLE
-- =====================================================

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Event Details
    kind VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Source Information
    source VARCHAR(100) DEFAULT 'system',
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(100),

    -- Processing Status
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    processing_duration_ms INTEGER,

    -- Error Handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for events table
CREATE INDEX idx_events_kind ON events(kind);
CREATE INDEX idx_events_processed ON events(processed, created_at);
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_created_at ON events(created_at DESC);
CREATE INDEX idx_events_source ON events(source);
CREATE INDEX idx_events_retry_count ON events(retry_count) WHERE processed = FALSE;

-- =====================================================
-- 2. JOBS TABLE
-- =====================================================

CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,

    -- Job Details
    job_type VARCHAR(50) NOT NULL,
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Processing Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    assigned_worker VARCHAR(100),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    processing_duration_ms INTEGER,

    -- Error Handling
    error_message TEXT,
    error_details JSONB,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    next_retry_at TIMESTAMP WITH TIME ZONE,

    -- Scheduling
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for jobs table
CREATE INDEX idx_jobs_status ON jobs(status, priority DESC, created_at);
CREATE INDEX idx_jobs_job_type ON jobs(job_type);
CREATE INDEX idx_jobs_scheduled_for ON jobs(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_jobs_next_retry_at ON jobs(next_retry_at) WHERE status = 'failed' AND retry_count < max_retries;
CREATE INDEX idx_jobs_event_id ON jobs(event_id);
CREATE INDEX idx_jobs_worker ON jobs(assigned_worker) WHERE status = 'processing';
CREATE INDEX idx_jobs_expires_at ON jobs(expires_at) WHERE status = 'pending';

-- =====================================================
-- 3. BOT MEMORY TABLE
-- =====================================================

CREATE TABLE bot_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bot_id VARCHAR(50) NOT NULL,

    -- Memory Details
    memory_type VARCHAR(50) NOT NULL, -- 'user_preference', 'conversation', 'learning', 'context'
    key VARCHAR(255) NOT NULL,
    value JSONB NOT NULL,

    -- Context
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(100),
    conversation_id UUID,

    -- Memory Management
    importance_score DECIMAL(3,2) DEFAULT 0.5 CHECK (importance_score >= 0 AND importance_score <= 1),
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Expiration
    expires_at TIMESTAMP WITH TIME ZONE,
    ttl_seconds INTEGER,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Unique constraint
    UNIQUE(bot_id, memory_type, key, user_id)
);

-- Indexes for bot_memory table
CREATE INDEX idx_bot_memory_bot_id ON bot_memory(bot_id);
CREATE INDEX idx_bot_memory_type ON bot_memory(memory_type);
CREATE INDEX idx_bot_memory_user_id ON bot_memory(user_id);
CREATE INDEX idx_bot_memory_importance ON bot_memory(importance_score DESC);
CREATE INDEX idx_bot_memory_expires_at ON bot_memory(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_bot_memory_last_accessed ON bot_memory(last_accessed_at DESC);

-- =====================================================
-- 4. JOB PROCESSING LOGS
-- =====================================================

CREATE TABLE job_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,

    -- Log Details
    log_level VARCHAR(20) NOT NULL CHECK (log_level IN ('debug', 'info', 'warn', 'error')),
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,

    -- Context
    worker_id VARCHAR(100),
    step VARCHAR(100),
    duration_ms INTEGER,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for job_logs table
CREATE INDEX idx_job_logs_job_id ON job_logs(job_id);
CREATE INDEX idx_job_logs_level ON job_logs(log_level);
CREATE INDEX idx_job_logs_created_at ON job_logs(created_at DESC);
CREATE INDEX idx_job_logs_worker_id ON job_logs(worker_id);

-- =====================================================
-- 5. SYSTEM METRICS TABLE
-- =====================================================

CREATE TABLE system_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Metric Details
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_type VARCHAR(20) NOT NULL CHECK (metric_type IN ('counter', 'gauge', 'histogram', 'summary')),

    -- Context
    labels JSONB DEFAULT '{}'::jsonb,
    worker_id VARCHAR(100),
    job_type VARCHAR(50),

    -- Timestamps
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for system_metrics table
CREATE INDEX idx_system_metrics_name ON system_metrics(metric_name);
CREATE INDEX idx_system_metrics_type ON system_metrics(metric_type);
CREATE INDEX idx_system_metrics_recorded_at ON system_metrics(recorded_at DESC);
CREATE INDEX idx_system_metrics_worker_id ON system_metrics(worker_id);

-- =====================================================
-- 6. FUNCTIONS
-- =====================================================

-- Function to emit events
CREATE OR REPLACE FUNCTION emit_event(
    p_kind VARCHAR(50),
    p_payload JSONB DEFAULT '{}'::jsonb,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_source VARCHAR(100) DEFAULT 'system',
    p_user_id UUID DEFAULT NULL,
    p_session_id VARCHAR(100) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_event_id UUID;
BEGIN
    INSERT INTO events (kind, payload, metadata, source, user_id, session_id)
    VALUES (p_kind, p_payload, p_metadata, p_source, p_user_id, p_session_id)
    RETURNING id INTO new_event_id;

    -- Auto-create jobs based on event kind
    PERFORM create_jobs_for_event(new_event_id, p_kind, p_payload);

    RETURN new_event_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create jobs for events
CREATE OR REPLACE FUNCTION create_jobs_for_event(
    p_event_id UUID,
    p_kind VARCHAR(50),
    p_payload JSONB
)
RETURNS VOID AS $$
BEGIN
    -- Create jobs based on event kind
    CASE p_kind
        WHEN 'save_to_plate' THEN
            INSERT INTO jobs (event_id, job_type, priority, payload, scheduled_for)
            VALUES
                (p_event_id, 'curate.feed', 7, p_payload, NOW()),
                (p_event_id, 'notify.followers', 5, p_payload, NOW() + INTERVAL '1 minute');

        WHEN 'create_post' THEN
            INSERT INTO jobs (event_id, job_type, priority, payload, scheduled_for)
            VALUES
                (p_event_id, 'curate.feed', 8, p_payload, NOW()),
                (p_event_id, 'moderate.content', 6, p_payload, NOW() + INTERVAL '30 seconds');

        WHEN 'image_fetch_failed' THEN
            INSERT INTO jobs (event_id, job_type, priority, payload, scheduled_for)
            VALUES
                (p_event_id, 'retry.image_fetch', 9, p_payload, NOW() + INTERVAL '1 minute'),
                (p_event_id, 'fallback.image', 8, p_payload, NOW() + INTERVAL '2 minutes');

        WHEN 'user_engagement_drop' THEN
            INSERT INTO jobs (event_id, job_type, priority, payload, scheduled_for)
            VALUES
                (p_event_id, 'reengage.user', 6, p_payload, NOW() + INTERVAL '5 minutes');

        ELSE
            -- Default job for unknown event types
            INSERT INTO jobs (event_id, job_type, priority, payload, scheduled_for)
            VALUES (p_event_id, 'process.event', 5, p_payload, NOW());
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to get next job for processing
CREATE OR REPLACE FUNCTION get_next_job(
    p_worker_id VARCHAR(100),
    p_job_types VARCHAR(50)[] DEFAULT NULL
)
RETURNS TABLE (
    job_id UUID,
    job_type VARCHAR(50),
    payload JSONB,
    metadata JSONB,
    priority INTEGER
) AS $$
DECLARE
    job_record RECORD;
BEGIN
    -- Get the next job to process
    SELECT j.id, j.job_type, j.payload, j.metadata, j.priority
    INTO job_record
    FROM jobs j
    WHERE j.status = 'pending'
        AND j.scheduled_for <= NOW()
        AND (j.expires_at IS NULL OR j.expires_at > NOW())
        AND (p_job_types IS NULL OR j.job_type = ANY(p_job_types))
    ORDER BY j.priority DESC, j.created_at ASC
    LIMIT 1;

    -- If job found, mark it as processing
    IF FOUND THEN
        UPDATE jobs
        SET status = 'processing',
            assigned_worker = p_worker_id,
            started_at = NOW(),
            updated_at = NOW()
        WHERE id = job_record.id;

        RETURN QUERY SELECT
            job_record.id,
            job_record.job_type,
            job_record.payload,
            job_record.metadata,
            job_record.priority;
    END IF;

    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to complete a job
CREATE OR REPLACE FUNCTION complete_job(
    p_job_id UUID,
    p_status VARCHAR(20),
    p_result JSONB DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL,
    p_error_details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    job_record RECORD;
BEGIN
    -- Get job details
    SELECT * INTO job_record FROM jobs WHERE id = p_job_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Job not found: %', p_job_id;
    END IF;

    -- Update job status
    UPDATE jobs
    SET status = p_status,
        completed_at = NOW(),
        processing_duration_ms = EXTRACT(EPOCH FROM (NOW() - started_at)) * 1000,
        updated_at = NOW()
    WHERE id = p_job_id;

    -- Add result to metadata if provided
    IF p_result IS NOT NULL THEN
        UPDATE jobs
        SET metadata = metadata || jsonb_build_object('result', p_result)
        WHERE id = p_job_id;
    END IF;

    -- Add error information if provided
    IF p_error_message IS NOT NULL THEN
        UPDATE jobs
        SET error_message = p_error_message,
            error_details = p_error_details
        WHERE id = p_job_id;
    END IF;

    -- Mark associated event as processed if all jobs are complete
    IF p_status IN ('completed', 'failed', 'cancelled') THEN
        UPDATE events
        SET processed = TRUE,
            processed_at = NOW(),
            updated_at = NOW()
        WHERE id = job_record.event_id
        AND NOT EXISTS (
            SELECT 1 FROM jobs
            WHERE event_id = job_record.event_id
            AND status IN ('pending', 'processing')
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to retry failed jobs
CREATE OR REPLACE FUNCTION retry_failed_jobs()
RETURNS INTEGER AS $$
DECLARE
    retry_count INTEGER := 0;
    job_record RECORD;
BEGIN
    -- Get jobs that need retry
    FOR job_record IN
        SELECT * FROM jobs
        WHERE status = 'failed'
        AND retry_count < max_retries
        AND next_retry_at <= NOW()
        ORDER BY created_at ASC
    LOOP
        -- Reset job for retry
        UPDATE jobs
        SET status = 'pending',
            retry_count = retry_count + 1,
            next_retry_at = NOW() + (INTERVAL '1 minute' * POWER(2, retry_count)),
            assigned_worker = NULL,
            started_at = NULL,
            completed_at = NULL,
            error_message = NULL,
            error_details = NULL,
            updated_at = NOW()
        WHERE id = job_record.id;

        retry_count := retry_count + 1;
    END LOOP;

    RETURN retry_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bot_memory_updated_at
    BEFORE UPDATE ON bot_memory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "Users can view their own events" ON events
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view their own bot memory" ON bot_memory
    FOR ALL USING (auth.uid() = user_id);

-- Service role can access all data
CREATE POLICY "Service role full access" ON events
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON jobs
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON bot_memory
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON job_logs
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON system_metrics
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 9. INITIAL DATA
-- =====================================================

-- Insert initial system metrics
INSERT INTO system_metrics (metric_name, metric_value, metric_type, labels) VALUES
('events_created_total', 0, 'counter', '{"source": "system"}'),
('jobs_processed_total', 0, 'counter', '{"status": "completed"}'),
('jobs_failed_total', 0, 'counter', '{"status": "failed"}'),
('active_workers', 0, 'gauge', '{}'),
('queue_length', 0, 'gauge', '{}');

-- =====================================================
-- 10. COMMENTS
-- =====================================================

COMMENT ON TABLE events IS 'System events that trigger automated responses';
COMMENT ON TABLE jobs IS 'Work items queued for processing by workers';
COMMENT ON TABLE bot_memory IS 'Persistent memory for Masterbots';
COMMENT ON TABLE job_logs IS 'Detailed logs for job processing';
COMMENT ON TABLE system_metrics IS 'System performance and health metrics';

COMMENT ON FUNCTION emit_event IS 'Emit a new event and create associated jobs';
COMMENT ON FUNCTION get_next_job IS 'Get the next job for processing by a worker';
COMMENT ON FUNCTION complete_job IS 'Mark a job as completed or failed';
COMMENT ON FUNCTION retry_failed_jobs IS 'Retry jobs that have failed but can be retried';
