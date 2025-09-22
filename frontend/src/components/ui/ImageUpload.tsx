import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  Upload, 
  X, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Move, 
  Crop,
  Check,
  AlertCircle
} from 'lucide-react';

interface ImageUploadProps {
  onImageChange: (file: File | null) => void;
  currentImage?: string;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageChange,
  currentImage,
  maxSize = 5, // 5MB default
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  className
}) => {
  const [image, setImage] = useState<string | null>(currentImage || null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });
  const [isCropping, setIsCropping] = useState(false);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Validar arquivo
  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `Tipo de arquivo não suportado. Use: ${acceptedTypes.join(', ')}`;
    }
    
    if (file.size > maxSize * 1024 * 1024) {
      return `Arquivo muito grande. Máximo: ${maxSize}MB`;
    }
    
    return null;
  };

  // Processar arquivo
  const processFile = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImage(result);
      setOriginalImage(result);
      setIsEditing(true);
      setIsProcessing(false);
      onImageChange(file);
    };
    reader.readAsDataURL(file);
  }, [maxSize, acceptedTypes, onImageChange]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  // File input handler
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  // Redimensionar imagem
  const resizeImage = (img: HTMLImageElement, maxWidth: number, maxHeight: number): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    let { width, height } = img;
    
    // Calcular novas dimensões mantendo proporção
    if (width > height) {
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
    } else {
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
    }
    
    canvas.width = width;
    canvas.height = height;
    
    ctx.drawImage(img, 0, 0, width, height);
    return canvas;
  };

  // Aplicar transformações
  const applyTransformations = useCallback(() => {
    if (!imageRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const img = imageRef.current;
    
    // Redimensionar para 400x400 máximo
    const resizedCanvas = resizeImage(img, 400, 400);
    
    canvas.width = resizedCanvas.width;
    canvas.height = resizedCanvas.height;
    
    ctx.save();
    
    // Aplicar rotação
    if (rotation !== 0) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }
    
    // Aplicar escala
    if (scale !== 1) {
      ctx.scale(scale, scale);
    }
    
    // Desenhar imagem
    ctx.drawImage(resizedCanvas, 0, 0);
    
    ctx.restore();
  }, [scale, rotation]);

  // Iniciar crop
  const startCrop = useCallback(() => {
    if (!canvasRef.current) return;
    
    setIsCropping(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Área de crop centralizada
    const cropSize = Math.min(canvas.width, canvas.height) * 0.8;
    setCropArea({
      x: (canvas.width - cropSize) / 2,
      y: (canvas.height - cropSize) / 2,
      width: cropSize,
      height: cropSize
    });
  }, []);

  // Aplicar crop
  const applyCrop = useCallback(() => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const img = imageRef.current;
    
    // Criar novo canvas com dimensões do crop
    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d')!;
    
    croppedCanvas.width = cropArea.width;
    croppedCanvas.height = cropArea.height;
    
    // Desenhar área cortada
    croppedCtx.drawImage(
      canvas,
      cropArea.x, cropArea.y, cropArea.width, cropArea.height,
      0, 0, cropArea.width, cropArea.height
    );
    
    // Converter para blob e atualizar imagem
    croppedCanvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
        const url = URL.createObjectURL(blob);
        setImage(url);
        onImageChange(file);
      }
    }, 'image/jpeg', 0.9);
    
    setIsCropping(false);
  }, [cropArea, onImageChange]);

  // Salvar imagem final
  const saveImage = useCallback(() => {
    if (!canvasRef.current) return;

    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'profile-image.jpg', { type: 'image/jpeg' });
        onImageChange(file);
        setIsEditing(false);
      }
    }, 'image/jpeg', 0.9);
  }, [onImageChange]);

  // Cancelar edição
  const cancelEdit = useCallback(() => {
    if (originalImage) {
      setImage(originalImage);
    }
    setIsEditing(false);
    setIsCropping(false);
    setScale(1);
    setRotation(0);
  }, [originalImage]);

  // Remover imagem
  const removeImage = useCallback(() => {
    setImage(null);
    setOriginalImage(null);
    setIsEditing(false);
    setIsCropping(false);
    onImageChange(null);
  }, [onImageChange]);

  // Renderizar área de upload
  const renderUploadArea = () => (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
        isDragging 
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
          : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        Arraste uma foto aqui ou clique para selecionar
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        PNG, JPG, WEBP até {maxSize}MB
      </p>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileInput}
        className="hidden"
      />
    </div>
  );

  // Renderizar editor de imagem
  const renderImageEditor = () => (
    <div className="space-y-4">
      {/* Canvas de edição */}
      <div className="relative border rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
        <canvas
          ref={canvasRef}
          className="max-w-full h-auto"
          style={{ maxHeight: '400px' }}
        />
        {isCropping && (
          <div
            className="absolute border-2 border-blue-500 bg-blue-500/20 cursor-move"
            style={{
              left: cropArea.x,
              top: cropArea.y,
              width: cropArea.width,
              height: cropArea.height,
            }}
          />
        )}
      </div>

      {/* Controles de edição */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setScale(Math.max(0.5, scale - 0.1))}
        >
          <ZoomOut className="h-4 w-4 mr-1" />
          Zoom Out
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setScale(Math.min(2, scale + 0.1))}
        >
          <ZoomIn className="h-4 w-4 mr-1" />
          Zoom In
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRotation((rotation + 90) % 360)}
        >
          <RotateCw className="h-4 w-4 mr-1" />
          Rotate
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={startCrop}
          disabled={isCropping}
        >
          <Crop className="h-4 w-4 mr-1" />
          Crop
        </Button>
      </div>

      {/* Botões de ação */}
      <div className="flex gap-2 justify-center">
        <Button onClick={saveImage} disabled={isProcessing}>
          <Check className="h-4 w-4 mr-1" />
          {isProcessing ? 'Processando...' : 'Salvar'}
        </Button>
        
        <Button variant="outline" onClick={cancelEdit}>
          <X className="h-4 w-4 mr-1" />
          Cancelar
        </Button>
        
        <Button variant="destructive" onClick={removeImage}>
          <X className="h-4 w-4 mr-1" />
          Remover
        </Button>
      </div>

      {isCropping && (
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Arraste para ajustar a área de corte
          </p>
          <Button onClick={applyCrop} size="sm">
            Aplicar Crop
          </Button>
        </div>
      )}
    </div>
  );

  // Renderizar preview da imagem
  const renderImagePreview = () => (
    <div className="space-y-4">
      <div className="relative inline-block">
        <img
          src={image}
          alt="Preview"
          className="w-32 h-32 object-cover rounded-lg border"
        />
        <Button
          variant="destructive"
          size="sm"
          className="absolute -top-2 -right-2 rounded-full w-6 h-6 p-0"
          onClick={removeImage}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="flex gap-2">
        <Button onClick={() => setIsEditing(true)} size="sm">
          <Crop className="h-4 w-4 mr-1" />
          Editar
        </Button>
        <Button variant="outline" onClick={removeImage} size="sm">
          <X className="h-4 w-4 mr-1" />
          Remover
        </Button>
      </div>
    </div>
  );

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {!image && renderUploadArea()}
        
        {image && !isEditing && renderImagePreview()}
        
        {image && isEditing && (
          <>
            <img
              ref={imageRef}
              src={image}
              alt="Editing"
              className="hidden"
              onLoad={applyTransformations}
            />
            {renderImageEditor()}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageUpload;
