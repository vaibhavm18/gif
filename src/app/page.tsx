"use client";
import React, { useState, useRef, ChangeEvent } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Camera, X, GripVertical } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
// @ts-ignore
import gifshot from 'gifshot';

type TransitionEffect = "normal" | "fade-in" | "fade-out";

const ImageUploadDisplay: React.FC = () => {
  const [images, setImages] = useState<string[]>([]);
  const [transitionEffect, setTransitionEffect] =
    useState<TransitionEffect>("normal");
  const [sliderValue, setSliderValue] = useState(3);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewGifUrl, setPreviewGifUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false)

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newImages = files.map((file) => URL.createObjectURL(file));
      setImages((prev) => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
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
    progress: number
  ) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    if (transitionEffect === "normal") {
      ctx.drawImage(img2, 0, 0, width, height);
    } else if (transitionEffect === "fade-in") {
      ctx.drawImage(img1, 0, 0, width, height);
      ctx.globalAlpha = progress;
      ctx.drawImage(img2, 0, 0, width, height);
      ctx.globalAlpha = 1;
    } else if (transitionEffect === "fade-out") {
      ctx.drawImage(img2, 0, 0, width, height);
      ctx.globalAlpha = 1 - progress;
      ctx.drawImage(img1, 0, 0, width, height);
      ctx.globalAlpha = 1;
    }
  };

  const createFrames = async (images: string[]): Promise<string[]> => {
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
    const transitionFrameCount = 10; 
    const fps = 10; 

    for (let i = 0; i < images.length; i++) {
      const currentImage = await loadImage(images[i]);
      const nextImage = await loadImage(images[(i + 1) % images.length]);

      if (i === 0) {
        canvas.width = currentImage.width;
        canvas.height = currentImage.height;
      }

      for (let j = 0; j < (sliderValue - 1) * fps; j++) {
        ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);
        frames.push(canvas.toDataURL());
      }

      for (let j = 0; j < transitionFrameCount; j++) {
        const progress = j / (transitionFrameCount - 1);
        applyTransitionEffect(ctx, currentImage, nextImage, progress);
        frames.push(canvas.toDataURL());
      }
    }

    return frames;
  };


  const createGif = async (isPreview: boolean) => {
    if (images.length <= 0) {
      return ""
    }

    const frames = await createFrames(images);

    return new Promise<string>((resolve, reject) => {
      gifshot.createGIF(
        {
          images: frames,
          gifWidth: 400,
          gifHeight: 300,
          interval: 0.1,
          // @ts-ignore
          progressCallback: (captureProgress) => {
            console.log('Progress:', captureProgress);
          },
          // @ts-ignore
          completeCallback: (obj) => {
            if (!obj.error) {
              resolve(obj.image);
            } else {
              reject(new Error('GIF creation failed'));
            }
          },
        },
        // @ts-ignore
        (obj) => {
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
    setIsLoading(true)
    try {
      const gifUrl = await createGif(true);
      if (!gifUrl) {
        throw new Error("Please provide images")
      }
      setPreviewGifUrl(gifUrl);
    } catch (error) {
      console.error('Failed to create preview GIF:', error);
    }
    setIsLoading(false)
  };

  const handleExportGif = async () => {
    setIsLoading(true)
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
    }
    setIsLoading(false)
  };


  return (
    <Card className="my-4 lg:my-8 max-w-6xl mx-auto p-4 flex flex-col justify-center gap-4">
      <div className="mx-auto">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
          ref={fileInputRef}
        />
        <Button onClick={triggerFileInput} className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Upload Images
        </Button>
      </div>
      <div className="space-y-2">
        <Label htmlFor="effect" className="text-lg font-medium">Transition Effect:</Label>
        <Select
          onValueChange={(value) =>
            setTransitionEffect(value as TransitionEffect)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue
              defaultValue={transitionEffect}
              placeholder="Select effect"
              className="outline-none focus:outline-none"
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="fade-in">Fade In</SelectItem>
            <SelectItem value="fade-out">Fade Out</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Select a transition effect
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="rotation" className="text-lg font-medium">
          Images:
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
                  <Draggable key={image} draggableId={image} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`relative group flex-shrink-0 w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.667rem)] md:w-[calc(25%-0.75rem)] ${snapshot.isDragging ? "z-50" : ""
                          }`}
                        style={{
                          ...provided.draggableProps.style,
                        }}
                      >
                        <img
                          src={image}
                          alt={`Uploaded image ${index + 1}`}
                          className="w-full h-48 object-cover rounded-md"
                        />
                        <span
                          className="absolute top-2 right-2 bg-gray-50 opacity-0 p-1 rounded-full group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </span>
                        <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <GripVertical className="h-5 w-5 text-white" />
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
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label htmlFor="rotation" className="text-lg font-medium">
            Time for each frame:
          </Label>
          <span className="text-sm font-medium bg-secondary text-secondary-foreground px-3 py-1 rounded-full">
            {sliderValue}
          </span>
        </div>
        <Slider
          id="slider-value"
          min={1}
          max={10}
          step={1}
          value={[sliderValue]}
          onValueChange={(value) => setSliderValue(value[0])}
          className=""
        />
        <p className="text-sm text-muted-foreground">
          Time frame for each image
        </p>
      </div>
      {images.length > 0 && (
        <p className="text-lg">
          {images.length} images takes total {images.length * sliderValue} second
        </p>
      )}
      {previewGifUrl && (
        <div className="my-4 mx-auto">
          <h3 className="text-lg font-medium mb-2">Preview:</h3>
          <img src={previewGifUrl} alt="Preview GIF" className="max-w-full h-auto rounded-xl" />
        </div>
      )}

      <div className="w-full flex justify-around mt-4">
        <Button onClick={handlePreviewGif} disabled={images.length <= 0 || isLoading}>Preview Gif</Button>
        <Button onClick={handleExportGif} disabled={images.length <= 0 || isLoading}>Export Gif</Button>
      </div>
    </Card>

  );
};

export default ImageUploadDisplay;