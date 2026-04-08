const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
const API_KEY = envContent.match(/VITE_GEMINI_API_KEY=(.+)/)[1].trim();

const prompt = `Generate ONE high-resolution app icon (512x512px).

Design: A shield with a magnifying glass inside it. White line art on dark background. Clean, minimal, professional.

Background: Radial gradient — bright blue center (#3B82F6) smoothly fading to very dark navy edges (#0F1629). Spotlight/vignette effect — the center glows softly.

Icon details:
- Shield shape: classic heraldic shield outline, white stroke, medium weight
- Magnifying glass: positioned inside the shield, tilted slightly, white stroke
- The magnifier lens could have a subtle blue glow inside it
- NO text, NO letters anywhere
- Square format with rounded corners (iOS app icon style)
- The white elements should feel crisp and premium against the dark glowing background
- Think Apple-quality icon design

Make it look like a real production app icon for a professional insurance tech company.`;

const body = JSON.stringify({
  contents: [{ parts: [{ text: prompt }] }],
  generationConfig: {
    responseModalities: ["IMAGE", "TEXT"],
    temperature: 1,
  }
});

console.log('Generating icon with Gemini...');

fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${API_KEY}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: body
})
.then(r => r.json())
.then(data => {
  if (data.error) {
    console.error('API Error:', data.error.message);
    return;
  }

  const parts = data.candidates?.[0]?.content?.parts || [];
  let saved = 0;

  parts.forEach((part, i) => {
    if (part.inlineData) {
      const ext = part.inlineData.mimeType.includes('png') ? 'png' : 'jpg';
      const filename = `claimpilot-icon-${saved + 1}.${ext}`;
      const buffer = Buffer.from(part.inlineData.data, 'base64');
      fs.writeFileSync(path.join(__dirname, filename), buffer);
      console.log(`Saved: ${filename} (${buffer.length} bytes)`);
      saved++;
    }
    if (part.text) {
      console.log('AI notes:', part.text.substring(0, 200));
    }
  });

  if (saved === 0) {
    console.log('No images generated. Response:', JSON.stringify(data).substring(0, 1000));
  }
})
.catch(err => console.error('Fetch error:', err));
