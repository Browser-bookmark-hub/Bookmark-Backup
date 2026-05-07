from PIL import Image, ImageFilter
import os

input_path = "/Users/kk/Downloads/chrome download/Bookmark-Backup/Screenshots and icons/v3.0/store_assets/bookmark_backup_440x280_original_1572x1001.png"
output_path = "/Users/kk/Downloads/chrome download/Bookmark-Backup/Screenshots and icons/v3.0/store_assets/bookmark_backup_440x280.png"

# Target size
target_width = 440
target_height = 280

if os.path.exists(input_path):
    with Image.open(input_path) as img:
        # 1. High quality downscaling
        resized_img = img.resize((target_width, target_height), Image.Resampling.LANCZOS)
        
        # 2. Apply UnsharpMask to remove the "foggy" look
        # radius=1, percent=150, threshold=3 is a common setting for UI sharping
        sharpened_img = resized_img.filter(ImageFilter.UnsharpMask(radius=1, percent=120, threshold=3))
        
        # 3. Save with maximum quality settings
        sharpened_img.save(output_path, "PNG", compress_level=1) # Lower compress_level = faster/less filtering, but more importantly ensures no artifacts
    print(f"Successfully sharpened and saved to: {output_path}")
else:
    print(f"Error: Input file not found")
