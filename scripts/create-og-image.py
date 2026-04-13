from PIL import Image
import os

base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
img = Image.open(os.path.join(base, "images", "preview.jpg"))
w, h = img.size

target_ratio = 1.91
# Use full width, crop height to match ratio
crop_w = w
crop_h = int(crop_w / target_ratio)

# Shift center slightly down to cut a bit more from the top (sky) than bottom
center_y = h // 2 + 160
top = center_y - crop_h // 2
bottom = top + crop_h

top = max(0, top)
bottom = min(h, top + crop_h)

print(f"Original: {w}x{h}")
print(f"Crop box: (0, {top}, {w}, {bottom}) = {w}x{bottom-top}")

cropped = img.crop((0, top, w, bottom))
resized = cropped.resize((1200, 630), Image.LANCZOS)

output_path = os.path.join(base, "images", "og-image.jpg")
resized.save(output_path, "JPEG", quality=85, optimize=True)

result = Image.open(output_path)
file_size = os.path.getsize(output_path)
print(f"Output: {result.size[0]}x{result.size[1]}, file size: {file_size / 1024:.0f} KB")
