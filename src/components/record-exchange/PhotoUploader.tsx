
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Trash } from 'lucide-react';

interface PhotoUploaderProps {
  photos: string[];
  setPhotos: React.Dispatch<React.SetStateAction<string[]>>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removePhoto: (index: number) => void;
}

const PhotoUploader: React.FC<PhotoUploaderProps> = ({ 
  photos, 
  setPhotos, 
  handleFileChange, 
  removePhoto 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        Fotos
      </label>
      <div className="border rounded-md p-4">
        {photos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {photos.map((photo, index) => (
              <div 
                key={index} 
                className="relative aspect-square rounded-md overflow-hidden border"
              >
                <img 
                  src={photo} 
                  alt={`Foto ${index + 1}`} 
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1"
                  aria-label="Remover foto"
                >
                  <Trash size={14} />
                </button>
              </div>
            ))}
            <label
              htmlFor="photo-upload"
              className="flex items-center justify-center aspect-square rounded-md border border-dashed cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <Camera className="h-8 w-8 text-muted-foreground" />
              <input
                id="photo-upload"
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </label>
          </div>
        ) : (
          <label
            htmlFor="photo-upload"
            className="flex flex-col items-center justify-center p-6 border-dashed border-2 rounded-md cursor-pointer hover:bg-accent/50 transition-colors"
          >
            <Camera className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              Clique para selecionar fotos
            </p>
            <input
              id="photo-upload"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </label>
        )}
      </div>
    </div>
  );
};

export default PhotoUploader;
