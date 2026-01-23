export const getScreenshotUrl = (screenshotPath: string | null | undefined): string => {
  if (!screenshotPath) return "";
  
  // If it's already a data URL or HTTP URL, return as-is
  if (screenshotPath.startsWith('data:') || screenshotPath.startsWith('http')) {
    return screenshotPath;
  }
  
  // For relative paths, prepend /Agile/ for production deployment
  return `/Agile/${screenshotPath}`;
};