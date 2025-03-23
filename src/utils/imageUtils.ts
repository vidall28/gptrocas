
import { toast } from '@/lib/toast';

// Handle image file upload and convert to base64
export const handleImageUpload = (
  files: FileList | null, 
  setPhotos: React.Dispatch<React.SetStateAction<string[]>>
) => {
  if (!files || files.length === 0) return;
  
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  // Convert files to base64
  Array.from(files).forEach(file => {
    if (file.size > maxSize) {
      toast.error(`A imagem ${file.name} é muito grande (máx. 5MB)`);
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPhotos(prev => [...prev, e.target!.result as string]);
      }
    };
    reader.readAsDataURL(file);
  });
};

