'use client';
import React, { useState, useRef, ChangeEvent } from "react";
import { createCanvas, loadImage } from 'canvas';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Camera, X, GripVertical, Upload, Download } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
// @ts-ignore
import gifshot from 'gifshot';
import { Progress } from "@/components/ui/progress";
import imageCompression from 'browser-image-compression';

import TextStyleDialog from "@/components/TextStyle";

type TransitionEffect = "normal" | "fade-in" | "fade-out";

interface TextStyleOptions {
  fontSize: number;
  fontWeight: string;
  fontFamily: string;
  fillStyle: string;
  strokeStyle: string;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
}

interface ImageWithTransition {
  src: string;
  effect: TransitionEffect;
  duration: number;
  text: string;
  textStyle: TextStyleOptions;
}


const ImageUploadDisplay: React.FC = () => {
  const [images, setImages] = useState<ImageWithTransition[]>([]);
  const [smallestDimensions, setSmallestDimensions] = useState({ width: 800, height: 800 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewGifUrl, setPreviewGifUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultTextStyle: TextStyleOptions = {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Arial',
    fillStyle: 'white',
    strokeStyle: 'black',
    textAlign: 'center',
    textBaseline: 'bottom',
  };

  const updateImageEffect = (index: number, effect: TransitionEffect) => {
    setImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, effect } : img))
    );
  };

  const updateImageDuration = (index: number, duration: number) => {
    setImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, duration } : img))
    );
  };

  const updateImageText = (index: number, text: string) => {
    setImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, text } : img))
    );
  };

  const updateImageTextStyle = (index: number, textStyle: Partial<TextStyleOptions>) => {
    setImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, textStyle: { ...img.textStyle, ...textStyle } } : img))
    );
  };

  const compressImage = async (file: File): Promise<string> => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };

    let url = ""
    let width = 0;
    let height = 0

    try {
      const compressedFile = await imageCompression(file, options);
      url = URL.createObjectURL(compressedFile);
      const img = await loadImage(url)
      width = img.width
      height = img.height
    } catch (error) {
      console.error("Error compressing image:", error);
      url = URL.createObjectURL(file)
      const img = await loadImage(url)
      width = img.width
      height = img.height
    }

    setSmallestDimensions(prev => ({
      height: Math.min(height, prev.height),
      width: Math.min(width, prev.width)
    }))

    return url
  };

  const addTextToImage = (ctx: CanvasRenderingContext2D, text: string, style: TextStyleOptions) => {
    const { fontSize, fontWeight, fontFamily, fillStyle, strokeStyle, textAlign, textBaseline } = style;
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = fillStyle;
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = fontSize / 8;
    ctx.textAlign = textAlign;
    ctx.textBaseline = textBaseline;

    const maxWidth = ctx.canvas.width * 0.9;
    const words = text.split(' ');
    let line = '';
    const lines: string[] = [];

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && i > 0) {
        lines.push(line);
        line = words[i] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    const lineHeight = fontSize * 1.2;
    let y = ctx.canvas.height - 20;

    lines.reverse().forEach((line) => {
      ctx.strokeText(line, ctx.canvas.width / 2, y, maxWidth);
      ctx.fillText(line, ctx.canvas.width / 2, y, maxWidth);
      y -= lineHeight;
    });
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageLoading(true);
      const files = Array.from(e.target.files);
      setProgress(0);

      const compressedImages = await Promise.all(
        files.map(async (file, index) => {
          const compressedImage = await compressImage(file);
          setProgress(Math.round(((index + 1) / files.length) * 100));
          return {
            src: compressedImage,
            effect: "normal" as TransitionEffect,
            duration: 2,
            text: "",
            textStyle: { ...defaultTextStyle }
          };
        })
      );

      setImages((prev) => [...prev, ...compressedImages]);
      setProgress(0);
      setImageLoading(false);
    }
  };

  const cropImageFromMiddle = async (imageSource: string, targetWidth: number, targetHeight: number): Promise<string> => {
    const img = await loadImage(imageSource);
    const canvas = createCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext('2d');

    const sourceAspectRatio = img.width / img.height;
    const targetAspectRatio = targetWidth / targetHeight;

    let sourceX, sourceY, sourceWidth, sourceHeight;

    if (sourceAspectRatio > targetAspectRatio) {
      sourceHeight = img.height;
      sourceWidth = img.height * targetAspectRatio;
      sourceY = 0;
      sourceX = (img.width - sourceWidth) / 2;
    } else {
      sourceWidth = img.width;
      sourceHeight = img.width / targetAspectRatio;
      sourceX = 0;
      sourceY = (img.height - sourceHeight) / 2;
    }

    ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);
    return canvas.toDataURL();
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const items = Array.from(images);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setImages(items);
  };

  const applyTransitionEffect = (
    ctx: CanvasRenderingContext2D,
    img1: HTMLImageElement,
    img2: HTMLImageElement,
    progress: number,
    effect: TransitionEffect
  ) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    if (effect === "normal") {
      ctx.drawImage(img2, 0, 0, width, height);
    } else if (effect === "fade-in") {
      ctx.drawImage(img1, 0, 0, width, height);
      ctx.globalAlpha = progress;
      ctx.drawImage(img2, 0, 0, width, height);
      ctx.globalAlpha = 1;
    } else if (effect === "fade-out") {
      ctx.drawImage(img2, 0, 0, width, height);
      ctx.globalAlpha = 1 - progress;
      ctx.drawImage(img1, 0, 0, width, height);
      ctx.globalAlpha = 1;
    }
  };

  const createFrames = async (images: ImageWithTransition[]): Promise<string[]> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = src;
      });
    };

    const frames: string[] = [];
    const transitionFrameCount = 3;
    const fps = 10;

    for (let i = 0; i < images.length; i++) {
      const currentImage = await loadImage(images[i].src);
      const nextImage = await loadImage(images[(i + 1) % images.length].src);
      const effect = images[i].effect;
      const duration = images[i].duration;
      const text = images[i].text;

      if (i === 0) {
        canvas.width = currentImage.width;
        canvas.height = currentImage.height;
      }

      // Frames for current image duration
      for (let j = 0; j < (duration - 1) * fps; j++) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);
        addTextToImage(ctx, text, images[i].textStyle);
        frames.push(canvas.toDataURL());
      }

      // Transition frames
      for (let j = 0; j < transitionFrameCount; j++) {
        const progress = j / (transitionFrameCount - 1);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        applyTransitionEffect(ctx, currentImage, nextImage, progress, effect);

        // Fade out text during transition
        const textAlpha = 1 - progress;
        ctx.save();
        ctx.globalAlpha = textAlpha;
        addTextToImage(ctx, text, images[i].textStyle);
        ctx.restore();

        frames.push(canvas.toDataURL());
      }
    }

    return frames;
  };
  const createGif = async (isPreview: boolean) => {
    if (images.length <= 0) {
      return "";
    }

    const gifWidth = smallestDimensions.width;
    const gifHeight = smallestDimensions.height;

    // Crop each frame
    const croppedImages = await Promise.all(
      images.map(async (image) => ({
        src: await cropImageFromMiddle(image.src, gifWidth, gifHeight),
        effect: image.effect,
        duration: image.duration,
        text: image.text,
        textStyle: image.textStyle
      }))
    );

    const frames = await createFrames(croppedImages);

    return new Promise<string>((resolve, reject) => {
      gifshot.createGIF(
        {
          images: frames,
          gifWidth: 400,
          gifHeight: 400,
          interval: 0.1,
          progressCallback: (captureProgress: number) => {
            const roundedProgress = Math.round(captureProgress * 100);
            setProgress(roundedProgress);
          },
          completeCallback: (obj: { error: any; image: string }) => {
            if (!obj.error) {
              resolve(obj.image);
            } else {
              reject(new Error('GIF creation failed'));
            }
          },
        },
        (obj: { error: any; image: string }) => {
          if (!obj.error) {
            resolve(obj.image);
          } else {
            reject(new Error('GIF creation failed'));
          }
        }
      );
    });
  };

  const handlePreviewGif = async () => {
    setIsLoading(true);
    try {
      const gifUrl = await createGif(true);
      if (!gifUrl) {
        throw new Error("Please provide images");
      }
      setPreviewGifUrl(gifUrl);
    } catch (error) {
      console.error('Failed to create preview GIF:', error);
      setError('Failed to create preview GIF. Please try again.');
    }
    setIsLoading(false);
  };

  const handleExportGif = async () => {
    setIsLoading(true);
    try {
      const gifUrl = await createGif(false);
      const link = document.createElement('a');
      link.href = gifUrl;
      link.download = 'exported.gif';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to export GIF:', error);
      setError('Failed to export GIF. Please try again.');
    }
    setIsLoading(false);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <Card className="w-full max-w-6xl mx-auto my-8">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <img
              src='dlogo.png'
              alt="Logo"
              className="w-16 h-16 object-contain"
            />
            <CardTitle className="text-2xl font-bold">
              GIF Creator
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-12 w-full">
          {/* File upload section */}
          <div className="mb-12">
            <h2 className="text-xl font-semibold mb-6">Upload Images</h2>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1 flex flex-col gap-6">
                <p className="text-sm">
                  Upload images to create a GIF.
                </p>
                <div className="w-full h-40 bg-gray-100 rounded-lg flex-1 flex items-center justify-center min-h-40">
                  {images.length > 0 ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img
                        src={images[0].src}
                        alt="First uploaded image"
                        className="h-full w-full object-cover rounded-lg"
                      />
                      <p className="text-sm mt-2 absolute bottom-2 left-2 bg-white px-2 py-1 rounded">
                        {images.length} images uploaded
                      </p>
                    </div>
                  ) : (
                    <Camera className="h-16 w-16 text-gray-400" />
                  )}
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full text-sm"
                  variant="outline"
                  disabled={imageLoading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Choose Images
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  ref={fileInputRef}
                />
              </div>
              {previewGifUrl && (
                <div className="flex-1 flex flex-col gap-6">
                  <h3 className="text-lg font-medium">Preview GIF</h3>
                  <div className="relative w-full h-40 flex-1 flex items-center justify-center bg-gray-100 rounded-lg">
                    <img src={previewGifUrl} alt="Preview GIF" className="max-w-full h-auto rounded-lg" />
                  </div>
                  <Button
                    onClick={handleExportGif}
                    className="w-full text-sm"
                    disabled={isLoading}
                  >
                    <Download className="mr-2 h-4 w-4" /> Export GIF
                  </Button>
                </div>
              )}
            </div>
          </div>


          <div className="space-y-2">
            <Label htmlFor="images" className="text-lg font-medium">
              Uploaded Images:
            </Label>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="images" direction="horizontal">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="flex flex-wrap justify-start items-start gap-4 w-full"
                  >
                    {images.map((image, index) => (
                      <Draggable key={image.src} draggableId={image.src} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`relative group flex-shrink-0 w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.667rem)] md:w-[calc(25%-0.75rem)] ${snapshot.isDragging ? "z-50" : ""
                              }`}
                            style={{
                              ...provided.draggableProps.style,
                            }}
                          >
                            <div className="relative mb-2" {...provided.dragHandleProps}>
                              <img
                                src={image.src}
                                alt={`Uploaded image ${index + 1}`}
                                className="w-full h-48 object-cover rounded-md"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-opacity-40 hover:bg-opacity-100 transition-opacity"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="w-full space-y-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" className="w-full">
                                    Edit Style
                                  </Button>
                                </DialogTrigger>
                                <TextStyleDialog
                                  text={image.text}
                                  onTextChange={(text) => updateImageText(index, text)}
                                  textStyleOptions={image.textStyle}
                                  effect={image.effect}
                                  duration={image.duration}
                                  onTextStyleChange={(key, value) => updateImageTextStyle(index, { [key]: value })}
                                  onEffectChange={(value) => updateImageEffect(index, value)}
                                  onDurationChange={(value) => updateImageDuration(index, value)}
                                />
                              </Dialog>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {/* GIF Creation */}
          <div className="flex flex-col gap-4">
            {isLoading && (
              <div className="w-full space-y-2">
                <Label className="text-sm font-medium">Creating GIF... {progress}%</Label>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            <div className="flex justify-center">
              <Button
                onClick={handlePreviewGif}
                className="px-8 py-4 text-lg font-semibold"
                disabled={images.length <= 0 || isLoading}
              >
                {isLoading ? "Creating..." : "Create GIF"}
              </Button>
            </div>
          </div>

          {error && (
            <div className="mt-8 text-red-500">
              <p>{error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageUploadDisplay;
