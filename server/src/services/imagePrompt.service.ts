const STYLE_INSTRUCTIONS =
  "clean flat 3D illustration, minimal, white background, soft shadows, blue accent colors, educational infographic, high quality";

function buildPrompt(scene: {
  scene: number;
  narration: string;
  visual: string;
}, settings?: { imageStyle?: string; audience?: string; aspectRatio?: string }): string {
  const needsHumans =
    /people|person|man|woman|child|student|teacher|audience|host|narrator|expert/i.test(
      scene.narration
    );

  const subject = needsHumans ? "" : "No humans. ";

  const style = settings?.imageStyle?.trim() || STYLE_INSTRUCTIONS;
  return `${subject}${style}. Designed for ${settings?.audience ?? "College Students"}, ${settings?.aspectRatio ?? "16:9"} composition. Scene ${scene.scene}: ${scene.visual}. Narration context: "${scene.narration}"`;
}

export function generateImagePrompts(overview: {
  title: string;
  duration: string;
  scenes: Array<{
    scene: number;
    duration: string;
    narration: string;
    visual: string;
  }>;
}, settings?: { imageStyle?: string; audience?: string; aspectRatio?: string }): Array<{ scene: number; prompt: string }> {
  console.log("[IMAGEPROMPT] Generating image prompts");
  const imagePrompts = overview.scenes.map((scene) => ({
    scene: scene.scene,
    prompt: buildPrompt(scene, settings),
  }));

  console.log(`[IMAGEPROMPT] Generated ${imagePrompts.length} image prompts`);

  return imagePrompts;
}
