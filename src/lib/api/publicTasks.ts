import { supabase } from './supabase';
import {
  PublicTask,
  PublicTaskApplication,
  PublicTaskComment,
  CreatePublicTaskData,
  PublicTaskFilters,
  PublicTaskListResponse,
  TaskCompletionType,
  TaskLocationType,
  PayoutMethod,
  GradingMethod,
  ApplicationStatus,
  MediaFile
} from '../../types';

// Public Tasks CRUD Operations

export async function createPublicTask(data: CreatePublicTaskData, creatorId: string, mediaFiles: MediaFile[] = []): Promise<PublicTask> {
  try {
    const { data: task, error: taskError } = await supabase
      .from('public_tasks')
      .insert({
        title: data.title,
        description: data.description,
        creator_id: creatorId,
        completion_type: data.completionType,
        location_type: data.locationType,
        location_address: data.locationAddress,
        location_lat: data.locationLat,
        location_lng: data.locationLng,
        location_city: data.locationCity,
        location_country: data.locationCountry,
        language: data.language,
        payment_amount: data.paymentAmount,
        payment_currency: data.paymentCurrency,
        supported_payout_methods: data.supportedPayoutMethods,
        max_applicants: data.maxApplicants,
        deadline: data.deadline?.toISOString(),
        grading_method: data.gradingMethod,
        submission_instructions: data.submissionInstructions
      })
      .select()
      .single();

    if (taskError) throw taskError;

    if (data.tags.length > 0) {
      const tagInserts = data.tags.map(tag => ({
        task_id: task.id,
        tag_name: tag.trim()
      }));

      const { error: tagError } = await supabase
        .from('public_task_tags')
        .insert(tagInserts);

      if (tagError) throw tagError;
    }

    if (mediaFiles.length > 0) {
      for (const mediaFile of mediaFiles) {
        try {
          await uploadTaskMedia(task.id, mediaFile.file);
        } catch (mediaError) {
          console.error('Error uploading media file:', mediaError);
        }
      }
    }

    return transformDbPublicTask(task);
  } catch (error) {
    console.error('Error creating public task:', error);
    throw error;
  }
}

export async function getPublicTasks(
  filters: PublicTaskFilters = {},
  page: number = 1,
  pageSize: number = 20
): Promise<PublicTaskListResponse> {
  try {
    let query = supabase
      .from('public_tasks')
      .select(`
        *,
        creator:users!creator_id (
          id,
          name,
          avatar_url
        ),
        tags:public_task_tags (
          id,
          tag_name
        ),
        media:public_task_media (
          id,
          file_url,
          file_type,
          file_name
        )
      `)
      .eq('is_active', true);

    // Apply filters
    if (filters.locationType) {
      query = query.eq('location_type', filters.locationType);
    }
    if (filters.minPayment !== undefined) {
      query = query.gte('payment_amount', filters.minPayment);
    }
    if (filters.maxPayment !== undefined) {
      query = query.lte('payment_amount', filters.maxPayment);
    }
    if (filters.language) {
      query = query.eq('language', filters.language);
    }
    if (filters.completionType) {
      query = query.eq('completion_type', filters.completionType);
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Create separate count query with same filters
    let countQuery = supabase
      .from('public_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (filters.locationType) {
      countQuery = countQuery.eq('location_type', filters.locationType);
    }
    if (filters.minPayment !== undefined) {
      countQuery = countQuery.gte('payment_amount', filters.minPayment);
    }
    if (filters.maxPayment !== undefined) {
      countQuery = countQuery.lte('payment_amount', filters.maxPayment);
    }
    if (filters.language) {
      countQuery = countQuery.eq('language', filters.language);
    }
    if (filters.completionType) {
      countQuery = countQuery.eq('completion_type', filters.completionType);
    }
    if (filters.search) {
      countQuery = countQuery.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Execute count query
    const { count, error: countError } = await countQuery;
    if (countError) throw countError;

    // Get paginated results
    const offset = (page - 1) * pageSize;
    const { data: tasks, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    // Filter by tags if specified (done in JavaScript since it's a complex join)
    let filteredTasks = tasks || [];
    if (filters.tags && filters.tags.length > 0) {
      filteredTasks = filteredTasks.filter(task => 
        task.tags?.some((tag: any) => filters.tags!.includes(tag.tag_name))
      );
    }

    return {
      tasks: filteredTasks.map(transformDbPublicTask),
      totalCount: count || 0,
      hasMore: (offset + pageSize) < (count || 0)
    };
  } catch (error) {
    console.error('Error fetching public tasks:', error);
    throw error;
  }
}

export async function getPublicTaskById(taskId: string): Promise<PublicTask | null> {
  try {
    const { data: task, error } = await supabase
      .from('public_tasks')
      .select(`
        *,
        creator:users!creator_id (
          id,
          name,
          avatar_url
        ),
        tags:public_task_tags (
          id,
          tag_name
        ),
        media:public_task_media (
          id,
          file_url,
          file_type,
          file_name,
          file_size,
          mime_type,
          created_at
        )
      `)
      .eq('id', taskId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    // Increment view count
    await supabase
      .from('public_tasks')
      .update({ view_count: (task.view_count || 0) + 1 })
      .eq('id', taskId);

    return transformDbPublicTask(task);
  } catch (error) {
    console.error('Error fetching public task:', error);
    throw error;
  }
}

export async function getUserPublicTasks(userId: string): Promise<PublicTask[]> {
  try {
    const { data: tasks, error } = await supabase
      .from('public_tasks')
      .select(`
        *,
        tags:public_task_tags (
          id,
          tag_name
        ),
        media:public_task_media (
          id,
          file_url,
          file_type,
          file_name
        )
      `)
      .eq('creator_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (tasks || []).map(transformDbPublicTask);
  } catch (error) {
    console.error('Error fetching user public tasks:', error);
    throw error;
  }
}

export async function updatePublicTask(taskId: string, updates: Partial<CreatePublicTaskData>): Promise<PublicTask> {
  try {
    const updateData: any = {};
    
    if (updates.title) updateData.title = updates.title;
    if (updates.description) updateData.description = updates.description;
    if (updates.completionType) updateData.completion_type = updates.completionType;
    if (updates.locationType) updateData.location_type = updates.locationType;
    if (updates.locationAddress !== undefined) updateData.location_address = updates.locationAddress;
    if (updates.locationLat !== undefined) updateData.location_lat = updates.locationLat;
    if (updates.locationLng !== undefined) updateData.location_lng = updates.locationLng;
    if (updates.locationCity !== undefined) updateData.location_city = updates.locationCity;
    if (updates.locationCountry !== undefined) updateData.location_country = updates.locationCountry;
    if (updates.language) updateData.language = updates.language;
    if (updates.paymentAmount !== undefined) updateData.payment_amount = updates.paymentAmount;
    if (updates.paymentCurrency) updateData.payment_currency = updates.paymentCurrency;
    if (updates.supportedPayoutMethods) updateData.supported_payout_methods = updates.supportedPayoutMethods;
    if (updates.maxApplicants !== undefined) updateData.max_applicants = updates.maxApplicants;
    if (updates.deadline !== undefined) updateData.deadline = updates.deadline?.toISOString();
    if (updates.gradingMethod) updateData.grading_method = updates.gradingMethod;
    if (updates.submissionInstructions !== undefined) updateData.submission_instructions = updates.submissionInstructions;

    const { data: task, error } = await supabase
      .from('public_tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;

    // Update tags if provided
    if (updates.tags) {
      // Delete existing tags
      await supabase
        .from('public_task_tags')
        .delete()
        .eq('task_id', taskId);

      // Insert new tags
      if (updates.tags.length > 0) {
        const tagInserts = updates.tags.map(tag => ({
          task_id: taskId,
          tag_name: tag.trim()
        }));

        await supabase
          .from('public_task_tags')
          .insert(tagInserts);
      }
    }

    return transformDbPublicTask(task);
  } catch (error) {
    console.error('Error updating public task:', error);
    throw error;
  }
}

export async function deletePublicTask(taskId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('public_tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting public task:', error);
    throw error;
  }
}

// Applications

export async function createApplication(
  taskId: string,
  applicantId: string,
  applicationData: {
    applicationMessage?: string;
    contactEmail?: string;
    contactPhone?: string;
    submissionContent?: string; // For proof-based tasks
  }
): Promise<PublicTaskApplication> {
  try {
    const { data: application, error } = await supabase
      .from('public_task_applications')
      .insert({
        task_id: taskId,
        applicant_id: applicantId,
        application_message: applicationData.applicationMessage,
        contact_email: applicationData.contactEmail,
        contact_phone: applicationData.contactPhone,
        submission_content: applicationData.submissionContent,
        submitted_at: applicationData.submissionContent ? new Date().toISOString() : null
      })
      .select(`
        *,
        applicant:users!applicant_id (
          id,
          name,
          avatar_url,
          email
        )
      `)
      .single();

    if (error) throw error;

    return transformDbApplication(application);
  } catch (error) {
    console.error('Error creating application:', error);
    throw error;
  }
}

export async function getTaskApplications(taskId: string): Promise<PublicTaskApplication[]> {
  try {
    const { data: applications, error } = await supabase
      .from('public_task_applications')
      .select(`
        *,
        applicant:users!applicant_id (
          id,
          name,
          avatar_url,
          email
        )
      `)
      .eq('task_id', taskId)
      .order('applied_at', { ascending: false });

    if (error) throw error;

    return (applications || []).map(transformDbApplication);
  } catch (error) {
    console.error('Error fetching task applications:', error);
    throw error;
  }
}

export async function getUserApplicationForTask(taskId: string, userId: string): Promise<PublicTaskApplication | null> {
  try {
    const { data: application, error } = await supabase
      .from('public_task_applications')
      .select(`
        *,
        applicant:users!applicant_id (
          id,
          name,
          avatar_url,
          email
        )
      `)
      .eq('task_id', taskId)
      .eq('applicant_id', userId)
      .maybeSingle();

    if (error) throw error;

    return application ? transformDbApplication(application) : null;
  } catch (error) {
    console.error('Error fetching user application:', error);
    throw error;
  }
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
  feedback?: string
): Promise<void> {
  try {
    const updateData: any = { status };
    if (feedback) updateData.creator_feedback = feedback;

    const { error } = await supabase
      .from('public_task_applications')
      .update(updateData)
      .eq('id', applicationId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating application status:', error);
    throw error;
  }
}

// Comments

export async function createComment(
  taskId: string,
  commentText: string,
  commenterName: string,
  userId?: string
): Promise<PublicTaskComment> {
  try {
    const { data: comment, error } = await supabase
      .from('public_task_comments')
      .insert({
        task_id: taskId,
        user_id: userId || null,
        commenter_name: commenterName,
        comment_text: commentText,
        is_anonymous: !userId
      })
      .select(`
        *,
        user:users (
          id,
          name,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;

    return transformDbComment(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
}

export async function getTaskComments(taskId: string): Promise<PublicTaskComment[]> {
  try {
    const { data: comments, error } = await supabase
      .from('public_task_comments')
      .select(`
        *,
        user:users (
          id,
          name,
          avatar_url
        )
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (comments || []).map(transformDbComment);
  } catch (error) {
    console.error('Error fetching task comments:', error);
    throw error;
  }
}

// Media Upload

export async function uploadTaskMedia(
  taskId: string,
  file: File
): Promise<{ url: string; publicUrl: string }> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${taskId}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('public-task-media')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('public-task-media')
      .getPublicUrl(fileName);

    // Save media record to database
    await supabase
      .from('public_task_media')
      .insert({
        task_id: taskId,
        file_url: publicUrl,
        file_type: file.type.startsWith('image/') ? 'image' : 'video',
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type
      });

    return { url: data.path, publicUrl };
  } catch (error) {
    console.error('Error uploading task media:', error);
    throw error;
  }
}

// Utility Functions

function transformDbPublicTask(dbTask: any): PublicTask {
  return {
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description,
    creatorId: dbTask.creator_id,
    createdAt: new Date(dbTask.created_at),
    updatedAt: new Date(dbTask.updated_at),
    completionType: dbTask.completion_type as TaskCompletionType,
    locationType: dbTask.location_type as TaskLocationType,
    locationAddress: dbTask.location_address,
    locationLat: dbTask.location_lat,
    locationLng: dbTask.location_lng,
    locationCity: dbTask.location_city,
    locationCountry: dbTask.location_country,
    language: dbTask.language,
    paymentAmount: parseFloat(dbTask.payment_amount),
    paymentCurrency: dbTask.payment_currency,
    supportedPayoutMethods: dbTask.supported_payout_methods as PayoutMethod[],
    maxApplicants: dbTask.max_applicants,
    deadline: dbTask.deadline ? new Date(dbTask.deadline) : undefined,
    gradingMethod: dbTask.grading_method as GradingMethod,
    isActive: dbTask.is_active,
    submissionInstructions: dbTask.submission_instructions,
    applicationCount: dbTask.application_count,
    viewCount: dbTask.view_count,
    creator: dbTask.creator ? {
      id: dbTask.creator.id,
      name: dbTask.creator.name,
      email: '',
      avatarUrl: dbTask.creator.avatar_url,
      createdAt: new Date(),
      stats: {
        rank: 0,
        tasksCompleted: 0,
        completionRate: 0,
        averageCompletionTime: 0
      }
    } : undefined,
    tags: dbTask.tags?.map((tag: any) => ({
      id: tag.id,
      taskId: dbTask.id,
      tagName: tag.tag_name,
      createdAt: new Date()
    })),
    media: dbTask.media?.map((media: any) => ({
      id: media.id,
      taskId: dbTask.id,
      fileUrl: media.file_url,
      fileType: media.file_type,
      fileName: media.file_name,
      fileSize: media.file_size,
      mimeType: media.mime_type,
      createdAt: new Date(media.created_at)
    }))
  };
}

function transformDbApplication(dbApp: any): PublicTaskApplication {
  return {
    id: dbApp.id,
    taskId: dbApp.task_id,
    applicantId: dbApp.applicant_id,
    appliedAt: new Date(dbApp.applied_at),
    status: dbApp.status as ApplicationStatus,
    applicationMessage: dbApp.application_message,
    contactEmail: dbApp.contact_email,
    contactPhone: dbApp.contact_phone,
    submissionContent: dbApp.submission_content,
    submissionMediaUrls: dbApp.submission_media_urls,
    submittedAt: dbApp.submitted_at ? new Date(dbApp.submitted_at) : undefined,
    creatorRating: dbApp.creator_rating,
    creatorFeedback: dbApp.creator_feedback,
    communityRating: dbApp.community_rating,
    communityVotes: dbApp.community_votes,
    gradedAt: dbApp.graded_at ? new Date(dbApp.graded_at) : undefined,
    applicant: dbApp.applicant ? {
      id: dbApp.applicant.id,
      name: dbApp.applicant.name,
      email: dbApp.applicant.email,
      avatarUrl: dbApp.applicant.avatar_url,
      createdAt: new Date(),
      stats: {
        rank: 0,
        tasksCompleted: 0,
        completionRate: 0,
        averageCompletionTime: 0
      }
    } : undefined
  };
}

function transformDbComment(dbComment: any): PublicTaskComment {
  return {
    id: dbComment.id,
    taskId: dbComment.task_id,
    userId: dbComment.user_id,
    commenterName: dbComment.commenter_name,
    commentText: dbComment.comment_text,
    isAnonymous: dbComment.is_anonymous,
    createdAt: new Date(dbComment.created_at),
    updatedAt: new Date(dbComment.updated_at),
    user: dbComment.user ? {
      id: dbComment.user.id,
      name: dbComment.user.name,
      email: '',
      avatarUrl: dbComment.user.avatar_url,
      createdAt: new Date(),
      stats: {
        rank: 0,
        tasksCompleted: 0,
        completionRate: 0,
        averageCompletionTime: 0
      }
    } : undefined
  };
} 