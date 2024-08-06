"use client"
import React from 'react';
import { DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';

interface TextStyleOptions {
  fontSize: number;
  fontWeight: string;
  fontFamily: string;
  fillStyle: string;
  strokeStyle: string;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
}

type TransitionEffect = "normal" | "fade-in" | "fade-out";

interface TextStyleDialogProps {
  textStyleOptions: TextStyleOptions;
  effect: TransitionEffect;
  duration: number;
  text: string;
  onTextStyleChange: (key: keyof TextStyleOptions, value: string | number) => void;
  onEffectChange: (value: TransitionEffect) => void;
  onDurationChange: (value: number) => void;
  onTextChange: (value: string) => void;
}

const TextStyleDialog: React.FC<TextStyleDialogProps> = ({
  textStyleOptions,
  effect,
  duration,
  text,
  onTextStyleChange,
  onEffectChange,
  onDurationChange,
  onTextChange
}) => {
  return (
    <DialogContent className="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>Image and Text Style Options</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="text" className="text-right">
            Text:
          </Label>
          <Textarea
            id="text"
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            className="resize-none"
            placeholder="Enter text to overlay on the image"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="effect" className="text-right">
            Effect
          </Label>
          <Select
            value={effect}
            onValueChange={(value) => onEffectChange(value as TransitionEffect)}
          >
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select effect" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="fade-in">Fade In</SelectItem>
              <SelectItem value="fade-out">Fade Out</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration" className="text-right">
            Duration
          </Label>
          <Select
            value={duration.toString()}
            onValueChange={(value) => onDurationChange(parseInt(value))}
          >
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((d) => (
                <SelectItem key={d} value={d.toString()}>
                  {d}s
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fontSize" className="text-right">
            Font Size
          </Label>
          <Input
            id="fontSize"
            type="number"
            value={textStyleOptions.fontSize}
            onChange={(e) => onTextStyleChange('fontSize', parseInt(e.target.value))}
            className="col-span-3"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fontWeight" className="text-right">
            Font Weight
          </Label>
          <Select
            value={textStyleOptions.fontWeight}
            onValueChange={(value) => onTextStyleChange('fontWeight', value)}
          >
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select font weight" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="bold">Bold</SelectItem>
              <SelectItem value="bolder">Bolder</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fontFamily" className="text-right">
            Font Family
          </Label>
          <Select
            value={textStyleOptions.fontFamily}
            onValueChange={(value) => onTextStyleChange('fontFamily', value)}
          >
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select font family" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Arial">Arial</SelectItem>
              <SelectItem value="Helvetica">Helvetica</SelectItem>
              <SelectItem value="Times New Roman">Times New Roman</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full flex justify-center space-x-4">
          <div className="space-y-2 flex flex-col items-center">
            <Label htmlFor="fillStyle" className="text-center">
              Fill Color
            </Label>
            <div className="relative inline-block">
              <Input
                id="fillStyle"
                type="color"
                value={textStyleOptions.fillStyle}
                onChange={(e) => onTextStyleChange('fillStyle', e.target.value)}
                className="sr-only"
              />
              <div
                className="w-12 h-12 rounded-full border-2 border-gray-300 overflow-hidden cursor-pointer"
                style={{ backgroundColor: textStyleOptions.fillStyle }}
                onClick={() => document.getElementById('fillStyle')?.click()}
              />
            </div>
          </div>
          <div className="space-y-2 flex flex-col items-center">
            <Label htmlFor="strokeStyle" className="text-center">
              Stroke Color
            </Label>
            <div className="relative inline-block">
              <Input
                id="strokeStyle"
                type="color"
                value={textStyleOptions.strokeStyle}
                onChange={(e) => onTextStyleChange('strokeStyle', e.target.value)}
                className="sr-only"
              />
              <div
                className="w-12 h-12 rounded-full border-2 border-gray-300 overflow-hidden cursor-pointer"
                style={{ backgroundColor: textStyleOptions.strokeStyle }}
                onClick={() => document.getElementById('strokeStyle')?.click()}
              />
            </div>
          </div>
        </div>
        <DialogClose className='w-full'>
          <Button>
            Save Changes
          </Button>
        </DialogClose>
      </div>
    </DialogContent>
  );
};

export default TextStyleDialog;