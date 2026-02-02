-- Function to add a task between two users
CREATE OR REPLACE FUNCTION add_test_task(
  assigner_email TEXT,
  assignee_email TEXT,
  title TEXT,
  description TEXT DEFAULT 'This is a sample task description',
  status TEXT DEFAULT 'PENDING',
  priority TEXT DEFAULT 'MEDIUM',
  due_days_from_now INTEGER DEFAULT 7,
  estimated_time_minutes INTEGER DEFAULT NULL,
  actual_time_minutes INTEGER DEFAULT NULL,
  quality_rating INTEGER DEFAULT NULL,
  feedback TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  assigner_id UUID;
  assignee_id UUID;
  task_id UUID;
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT NULL;
BEGIN
  -- Get user IDs from their emails
  SELECT id INTO assigner_id FROM public.users WHERE public.users.email = add_test_task.assigner_email;
  SELECT id INTO assignee_id FROM public.users WHERE public.users.email = add_test_task.assignee_email;
  
  IF assigner_id IS NULL OR assignee_id IS NULL THEN
    RAISE EXCEPTION 'Assigner or assignee not found: % or %', add_test_task.assigner_email, add_test_task.assignee_email;
  END IF;
  
  -- Set completed_at and submission_date if status is COMPLETED
  IF add_test_task.status = 'COMPLETED' THEN
    completed_at := NOW() - (floor(random() * 5)::integer || ' days')::interval;
    submission_date := NOW() - (floor(random() * 3)::integer || ' days')::interval;
  END IF;
  
  -- Insert new task
  INSERT INTO public.tasks (
    id,
    title,
    description,
    created_at,
    due_date,
    assigner_id,
    assignee_id,
    status,
    priority,
    completed_at,
    estimated_time_minutes,
    actual_time_minutes,
    submission_date,
    quality_rating,
    feedback
  ) VALUES (
    uuid_generate_v4(),
    add_test_task.title,
    add_test_task.description,
    NOW() - (floor(random() * 10)::integer || ' days')::interval,
    NOW() + (add_test_task.due_days_from_now || ' days')::interval,
    add_test_task.assigner_id,
    add_test_task.assignee_id,
    add_test_task.status,
    add_test_task.priority,
    completed_at,
    add_test_task.estimated_time_minutes,
    add_test_task.actual_time_minutes,
    submission_date,
    add_test_task.quality_rating,
    add_test_task.feedback
  ) RETURNING id INTO task_id;

  RETURN task_id;
END;
$$ LANGUAGE plpgsql; 