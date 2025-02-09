import sharp from "sharp";
import { promises as fs } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconDir = join(dirname(__dirname), "public/icons");

async function generateIcons() {
  try {
    // Create icons directory if it doesn't exist
    await fs.mkdir(iconDir, { recursive: true });

    // Read the base SVG file
    const svgBuffer = await fs.readFile(join(iconDir, "base-icon.svg"));

    // Generate each size
    for (const size of sizes) {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(join(iconDir, `icon-${size}x${size}.png`));

      console.log(`Generated ${size}x${size} icon`);
    }

    console.log("All icons generated successfully!");
  } catch (error) {
    console.error("Error generating icons:", error);
  }
}

generateIcons();
