const STYLE_INSTRUCTIONS =
  "clean flat 3D illustration, minimal, white background, soft shadows, blue accent colors, educational infographic, high quality";

function buildPrompt(scene: {
  scene: number;
  narration: string;
  visual: string;
}): string {
  const needsHumans =
    /people|person|man|woman|child|student|teacher|audience|host|narrator|expert/i.test(
      scene.narration
    );

  const subject = needsHumans ? "" : "No humans. ";

  return `${subject}${STYLE_INSTRUCTIONS}. Scene ${scene.scene}: ${scene.visual}. Narration context: "${scene.narration}"`;
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
}): Array<{ scene: number; prompt: string }> {
  console.log("[IMAGEPROMPT] Generating image prompts");
  const imagePrompts = overview.scenes.map((scene) => ({
    scene: scene.scene,
    prompt: buildPrompt(scene),
  }));

  console.log(`[IMAGEPROMPT] Generated ${imagePrompts.length} image prompts`);

  return imagePrompts;
}
