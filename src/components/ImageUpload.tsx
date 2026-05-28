import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
}

export function ImageUpload({ images, onImagesChange }: ImageUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const promises = acceptedFiles.map(
      file =>
        new Promise<string>(resolve => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        })
    );
    Promise.all(promises).then(newImages => onImagesChange([...images, ...newImages]));
  }, [images, onImagesChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    maxSize: 5 * 1024 * 1024,
  });

  const removeImage = (index: number) => {
    const next = [...images];
    next.splice(index, 1);
    onImagesChange(next);
  };

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all select-none ${
          isDragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[0.985]'
            : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
        }`}
      >
        <input {...getInputProps()} />
        <div className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center mb-2.5 transition-colors ${isDragActive ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-slate-100 dark:bg-slate-800'}`}>
          {isDragActive
            ? <ImageIcon className="h-5 w-5 text-blue-500" />
            : <Upload className="h-5 w-5 text-slate-400" />
          }
        </div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {isDragActive ? 'Drop to upload' : 'Drag & drop images here'}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          or <span className="text-blue-500 dark:text-blue-400">click to browse</span> · PNG, JPG, GIF, WebP up to 5 MB
        </p>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {images.map((src, index) => (
            <div key={index} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-video">
              <img
                src={src}
                alt={`Screenshot ${index + 1}`}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors rounded-xl" />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1.5 right-1.5 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                aria-label={`Remove screenshot ${index + 1}`}
              >
                <X size={12} />
              </button>
              <span className="absolute bottom-1.5 left-1.5 text-white text-xs bg-black/40 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                {index + 1}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
