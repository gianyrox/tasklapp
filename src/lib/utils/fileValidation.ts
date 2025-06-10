export const FILE_SIZE_LIMITS = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB in bytes
  MAX_FILE_SIZE_MB: 50
} as const;

export function validateFileSize(file: File): { isValid: boolean; error?: string } {
  if (file.size > FILE_SIZE_LIMITS.MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size must be less than ${FILE_SIZE_LIMITS.MAX_FILE_SIZE_MB}MB`
    };
  }
  
  return { isValid: true };
}

export function validateMediaFileType(file: File): { isValid: boolean; error?: string } {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  
  if (!isImage && !isVideo) {
    return {
      isValid: false,
      error: 'Only image and video files are allowed'
    };
  }
  
  return { isValid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 