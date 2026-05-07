import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

def add_rounded_corners(im, rad):
    circle = Image.new('L', (rad * 2, rad * 2), 0)
    draw = ImageDraw.Draw(circle)
    draw.ellipse((0, 0, rad * 2 - 1, rad * 2 - 1), fill=255)
    alpha = Image.new('L', im.size, 255)
    w, h = im.size
    alpha.paste(circle.crop((0, 0, rad, rad)), (0, 0))
    alpha.paste(circle.crop((rad, 0, rad * 2, rad)), (w - rad, 0))
    alpha.paste(circle.crop((0, rad, rad, rad * 2)), (0, h - rad))
    alpha.paste(circle.crop((rad, rad, rad * 2, rad * 2)), (w - rad, h - rad))
    im.putalpha(alpha)
    return im

def add_top_rounded_corners(im, rad):
    circle = Image.new('L', (rad * 2, rad * 2), 0)
    draw = ImageDraw.Draw(circle)
    draw.ellipse((0, 0, rad * 2 - 1, rad * 2 - 1), fill=255)
    alpha = Image.new('L', im.size, 255)
    w, h = im.size
    alpha.paste(circle.crop((0, 0, rad, rad)), (0, 0))
    alpha.paste(circle.crop((rad, 0, rad * 2, rad)), (w - rad, 0))
    # Bottom corners remain square (full alpha)
    im.putalpha(alpha)
    return im

def add_premium_shadow(im, shadow_blur=40, offset=(0, 15), alpha=60):
    w, h = im.size
    total_width = w + shadow_blur * 2 + abs(offset[0])
    total_height = h + shadow_blur * 2 + abs(offset[1])
    
    shadow = Image.new('RGBA', (total_width, total_height), (0,0,0,0))
    draw = ImageDraw.Draw(shadow)
    
    shadow_box = (
        shadow_blur + max(0, offset[0]), 
        shadow_blur + max(0, offset[1]), 
        shadow_blur + max(0, offset[0]) + w, 
        shadow_blur + max(0, offset[1]) + h
    )
    # Shrink the shadow base slightly to make it look more like a diffuse glow
    shrink = 4
    shrunk_box = (shadow_box[0]+shrink, shadow_box[1]+shrink, shadow_box[2]-shrink, shadow_box[3]-shrink)
    draw.rectangle(shrunk_box, fill=(0, 0, 0, alpha))
    shadow = shadow.filter(ImageFilter.GaussianBlur(shadow_blur))
    shadow.paste(im, (shadow_blur + max(0, -offset[0]), shadow_blur + max(0, -offset[1])), im)
    return shadow

def resize_and_crop(im, target_size):
    target_w, target_h = target_size
    target_ratio = target_w / target_h
    im_ratio = im.width / im.height
    
    if im_ratio > target_ratio:
        new_w = int(im.height * target_ratio)
        offset = (im.width - new_w) // 2
        im = im.crop((offset, 0, offset + new_w, im.height))
    else:
        new_h = int(im.width / target_ratio)
        offset = (im.height - new_h) // 2
        im = im.crop((0, offset, im.width, offset + new_h))
    
    return im.resize(target_size, Image.Resampling.LANCZOS)

def generate_promo(bg_path, icon_path, ui_path, title_text, subtitle_text, output_path, font_title_path, font_sub_path, font_title_index=0, font_sub_index=0, spacing=22, title_offset_y=0):
    # 1. Background
    bg = Image.open(bg_path).convert("RGBA")
    bg = resize_and_crop(bg, (1280, 800))
    bg_w, bg_h = bg.size
    
    # 2. Icon
    icon = Image.open(icon_path).convert("RGBA")
    icon_size = 140
    icon = icon.resize((icon_size, icon_size), Image.Resampling.LANCZOS)
    icon = add_rounded_corners(icon, 30)
    # Removing shadow for icon as requested
    icon_shadowed = icon
    
    # 3. UI Screenshot
    ui = Image.open(ui_path).convert("RGBA")
    target_ui_width = 960
    ui_ratio = ui.height / ui.width
    target_ui_height = int(target_ui_width * ui_ratio)
    ui = ui.resize((target_ui_width, target_ui_height), Image.Resampling.LANCZOS)
    ui = add_top_rounded_corners(ui, 12)
    # Removing shadow as requested by the user
    ui_shadowed = ui
    
    # Positioning
    icon_x = (bg_w - icon_shadowed.width) // 2
    icon_y = 40
    
    final_img = Image.new("RGBA", (bg_w, bg_h))
    final_img.paste(bg, (0, 0))
    final_img.paste(icon_shadowed, (icon_x, icon_y), icon_shadowed)
    
    # Text
    draw = ImageDraw.Draw(final_img)
    try:
        # Load the provided fonts, fallback to default if missing
        font_title = ImageFont.truetype(font_title_path, 52, index=font_title_index)
        font_sub = ImageFont.truetype(font_sub_path, 28, index=font_sub_index)
    except:
        font_title = ImageFont.load_default()
        font_sub = ImageFont.load_default()
            
    # UI screenshot pushed down to exactly touch the bottom edge
    ui_y = bg_h - ui_shadowed.height
    ui_x = (bg_w - ui_shadowed.width) // 2

    # Calculate text block height to center it between icon and UI
    icon_bottom = icon_y + icon_shadowed.height
    available_space = ui_y - icon_bottom
    
    title_bbox = draw.textbbox((0, 0), title_text, font=font_title)
    title_w = title_bbox[2] - title_bbox[0]
    title_h = title_bbox[3] - title_bbox[1]
    
    if subtitle_text:
        sub_bbox = draw.textbbox((0, 0), subtitle_text, font=font_sub)
        sub_w = sub_bbox[2] - sub_bbox[0]
        sub_h = sub_bbox[3] - sub_bbox[1]
        total_text_h = title_h + spacing + sub_h
    else:
        total_text_h = title_h
        
    # Perfectly center the text block in the available space mathematically
    vertical_nudge = 0
    title_y = icon_bottom + (available_space - total_text_h) // 2 - vertical_nudge
    title_x = (bg_w - title_w) // 2
    
    # Clean text rendering (boldness comes from the font itself)
    # title_offset_y is subtracted so positive values move the title UP
    draw.text((title_x, title_y - title_offset_y), title_text, font=font_title, fill=(20, 20, 20, 255))
    
    if subtitle_text:
        sub_x = (bg_w - sub_w) // 2
        sub_y = title_y + title_h + spacing
        
        # Draw a subtle grey pill (mask) behind the subtitle
        pill_pad_x = 24
        pill_pad_y = 12
        pill_box = (
            sub_x - pill_pad_x, 
            sub_y + sub_bbox[1] - pill_pad_y, 
            sub_x + sub_w + pill_pad_x, 
            sub_y + sub_bbox[3] + pill_pad_y
        )
        # To draw transparent shapes properly in PIL, we need an overlay layer
        overlay = Image.new('RGBA', final_img.size, (0, 0, 0, 0))
        overlay_draw = ImageDraw.Draw(overlay)
        try:
            overlay_draw.rounded_rectangle(pill_box, radius=(sub_bbox[3] - sub_bbox[1] + pill_pad_y * 2) // 2, fill=(0, 0, 0, 25))
        except AttributeError:
            # Fallback for older Pillow versions
            overlay_draw.rectangle(pill_box, fill=(0, 0, 0, 25))
            
        final_img = Image.alpha_composite(final_img, overlay)
        
        # We need to re-bind the draw object since final_img is a new composited instance
        draw = ImageDraw.Draw(final_img)
        draw.text((sub_x, sub_y), subtitle_text, font=font_sub, fill=(35, 35, 35, 255))
        
    final_img.paste(ui_shadowed, (ui_x, ui_y), ui_shadowed)
    
    final_img.convert("RGB").save(output_path, quality=95)
    print(f"Saved {output_path}")

if __name__ == '__main__':
    bg_path = "/Users/kk/Desktop/ChatGPT Image 2026年5月6日 23_34_05.png"
    icon_path = "/Users/kk/Desktop/B.jpg"
    
    out_dir = "/Users/kk/Desktop/store_assets"
    
    # English Version
    generate_promo(
        bg_path=bg_path,
        icon_path=icon_path,
        ui_path="/Users/kk/Desktop/主UI en.png",
        title_text="Main View",
        subtitle_text="Your primary interface to access and manage everything quickly",
        output_path=os.path.join(out_dir, "Bookmark-Backup-EN.jpg"),
        font_title_path="/System/Library/Fonts/HelveticaNeue.ttc",
        font_sub_path="/System/Library/Fonts/HelveticaNeue.ttc",
        font_title_index=1, # Helvetica Neue Bold
        font_sub_index=0,   # Helvetica Neue Regular
        spacing=35,         # Larger spacing for English
        title_offset_y=8    # Nudge English title UP slightly
    )
    
    # Chinese Version
    generate_promo(
        bg_path=bg_path,
        icon_path=icon_path,
        ui_path="/Users/kk/Desktop/主UI zh.png",
        title_text="主视图",
        subtitle_text="主要操作界面，在这里快速直达您的所有内容",
        output_path=os.path.join(out_dir, "Bookmark-Backup-ZH.jpg"),
        font_title_path="/System/Library/Fonts/Hiragino Sans GB.ttc",
        font_sub_path="/System/Library/Fonts/Hiragino Sans GB.ttc",
        font_title_index=2, # Hiragino Sans GB W6 (Bold)
        font_sub_index=0,   # Hiragino Sans GB W3 (Regular)
        spacing=22          # Normal spacing for Chinese
    )

    # English Version (Sync Page)
    generate_promo(
        bg_path=bg_path,
        icon_path=icon_path,
        ui_path="/Users/kk/Desktop/多端串行备份 en.png",
        title_text="Sequential Backup",
        subtitle_text="Supports both local and cloud environments for multi-device backup",
        output_path=os.path.join(out_dir, "Bookmark-Backup-Sync-EN.jpg"),
        font_title_path="/System/Library/Fonts/HelveticaNeue.ttc",
        font_sub_path="/System/Library/Fonts/HelveticaNeue.ttc",
        font_title_index=1, # Helvetica Neue Bold
        font_sub_index=0,   # Helvetica Neue Regular
        spacing=35,         # Larger spacing for English
        title_offset_y=16   # Nudge English title UP slightly more
    )
    
    # Chinese Version (Sync Page)
    generate_promo(
        bg_path=bg_path,
        icon_path=icon_path,
        ui_path="/Users/kk/Desktop/多端串行备份 zh.png",
        title_text="多端串行备份",
        subtitle_text="支持本地与云端双环境，实现多端备份",
        output_path=os.path.join(out_dir, "Bookmark-Backup-Sync-ZH.jpg"),
        font_title_path="/System/Library/Fonts/Hiragino Sans GB.ttc",
        font_sub_path="/System/Library/Fonts/Hiragino Sans GB.ttc",
        font_title_index=2, # Hiragino Sans GB W6 (Bold)
        font_sub_index=0,   # Hiragino Sans GB W3 (Regular)
        spacing=22,         # Normal spacing for Chinese
        title_offset_y=8    # Nudge Chinese title UP slightly
    )

    # English Version (Current Changes)
    generate_promo(
        bg_path=bg_path,
        icon_path=icon_path,
        ui_path="/Users/kk/Desktop/当前变化html en.png",
        title_text="Current Changes",
        subtitle_text="Clearly compare bookmark additions, deletions, moves, and modifications at a glance",
        output_path=os.path.join(out_dir, "Bookmark-Backup-Changes-EN.jpg"),
        font_title_path="/System/Library/Fonts/HelveticaNeue.ttc",
        font_sub_path="/System/Library/Fonts/HelveticaNeue.ttc",
        font_title_index=1,
        font_sub_index=0,
        spacing=35,
        title_offset_y=8
    )

    # Chinese Version (Current Changes)
    generate_promo(
        bg_path=bg_path,
        icon_path=icon_path,
        ui_path="/Users/kk/Desktop/当前变化html zh.png",
        title_text="当前变化",
        subtitle_text="清晰对比书签的增删移改，所有变化一目了然",
        output_path=os.path.join(out_dir, "Bookmark-Backup-Changes-ZH.jpg"),
        font_title_path="/System/Library/Fonts/Hiragino Sans GB.ttc",
        font_sub_path="/System/Library/Fonts/Hiragino Sans GB.ttc",
        font_title_index=2,
        font_sub_index=0,
        spacing=22
    )
