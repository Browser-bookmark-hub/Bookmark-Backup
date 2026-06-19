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

def generate_promo(bg_path, icon_path, ui_path, title_text, subtitle_text, output_path, font_title_path, font_sub_path, font_title_index=0, font_sub_index=0, spacing=22, title_offset_y=0, block_offset_y=0):
    # 1. Background
    bg = Image.open(bg_path).convert("RGBA")
    bg = resize_and_crop(bg, (1280, 800))
    bg_w, bg_h = bg.size
    
    # 2. UI Screenshot
    ui = Image.open(ui_path).convert("RGBA")
    ui_ratio = ui.height / ui.width


    # Determine layout parameters dynamically based on screenshot ratio
    if ui_ratio > 0.58:
        # Tall screenshots (like Highlighter UI): scale down, shrink icon, touch bottom edge, shift text up
        target_ui_width = 860
        bottom_margin = 0
        icon_size = 110
        icon_y = 20
        max_ratio = 0.75
        title_font_size = 42
        sub_font_size = 24
        text_y_offset = -15
        spacing = int(spacing * 0.75)
    else:
        # Wide screenshots (like settings/history): full width, touch bottom, regular icon
        target_ui_width = 960
        bottom_margin = 0
        icon_size = 140
        icon_y = 40
        max_ratio = 0.58
        title_font_size = 52
        sub_font_size = 28
        text_y_offset = 0

    # Apply cropping only if the screenshot exceeds the max allowed ratio
    if ui_ratio > max_ratio:
        crop_height = int(ui.width * max_ratio)
        ui = ui.crop((0, 0, ui.width, crop_height))
        ui_ratio = max_ratio

    target_ui_width = target_ui_width
    target_ui_height = int(target_ui_width * ui_ratio)
    ui = ui.resize((target_ui_width, target_ui_height), Image.Resampling.LANCZOS)
    ui = add_top_rounded_corners(ui, 12)
    ui_shadowed = ui

    # 3. Icon
    icon = Image.open(icon_path).convert("RGBA")
    icon = icon.resize((icon_size, icon_size), Image.Resampling.LANCZOS)
    icon = add_rounded_corners(icon, 30)
    icon_shadowed = icon
    
    # Positioning
    # Icon moved to top-left corner
    icon_x = 40
    
    final_img = Image.new("RGBA", (bg_w, bg_h))
    final_img.paste(bg, (0, 0))
    final_img.paste(icon_shadowed, (icon_x, icon_y), icon_shadowed)
    
    # Text
    draw = ImageDraw.Draw(final_img)
    try:
        # Load the provided fonts, fallback to default if missing
        font_title = ImageFont.truetype(font_title_path, title_font_size, index=font_title_index)
        font_sub = ImageFont.truetype(font_sub_path, sub_font_size, index=font_sub_index)
    except:
        font_title = ImageFont.load_default()
        font_sub = ImageFont.load_default()
            
    # UI screenshot pushed down, leaving bottom_margin
    ui_y = bg_h - ui_shadowed.height - bottom_margin
    ui_x = (bg_w - ui_shadowed.width) // 2


    # Calculate text block height to center it vertically above the UI screenshot
    available_space = ui_y
    
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
        
    # Center text block in the space above the screenshot and apply block_offset_y & text_y_offset
    title_y = (available_space - total_text_h) // 2 + block_offset_y + text_y_offset
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
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # 1. Background Image fallback
    bg_path = "/Users/kk/Desktop/ChatGPT Image 2026年5月6日 23_34_05.png"
    if not os.path.exists(bg_path):
        bg_path = os.path.join(script_dir, "背景图.png")
        
    # 2. Icon Image fallback
    icon_path = "/Users/kk/Desktop/B.jpg"
    if not os.path.exists(icon_path):
        icon_path = os.path.join(os.path.dirname(script_dir), "Bookmark-Backup-main", "icons", "icon128.png")
    
    out_dir = os.path.join(script_dir, "v3.5")
    os.makedirs(out_dir, exist_ok=True)


    # ==================== v3.5 NEW FEATURES ====================
    
    # English Version (Web Archive - Batch, using Highlighter screenshot)
    archive_ui_en = os.path.join(script_dir, "v3.5", "高亮工具en.png")
    if os.path.exists(archive_ui_en):
        generate_promo(
            bg_path=bg_path,
            icon_path=icon_path,
            ui_path=archive_ui_en,
            title_text="Web Archive (Batch)",
            subtitle_text="Archive any webpage via scheduled queues or temporary page injection",
            output_path=os.path.join(out_dir, "Bookmark-Backup-Archive-EN.jpg"),
            font_title_path="/System/Library/Fonts/HelveticaNeue.ttc",
            font_sub_path="/System/Library/Fonts/HelveticaNeue.ttc",
            font_title_index=1,
            font_sub_index=0,
            spacing=35,
            title_offset_y=8,
            block_offset_y=20
        )

    # Chinese Version (Web Archive - Batch, using Highlighter screenshot)
    archive_ui_zh = os.path.join(script_dir, "v3.5", "高亮工具zh.png")
    if os.path.exists(archive_ui_zh):
        generate_promo(
            bg_path=bg_path,
            icon_path=icon_path,
            ui_path=archive_ui_zh,
            title_text="快照存档(批量)",
            subtitle_text="以预定队列/临时注入的形式，对任意页面进行网页快照存档",
            output_path=os.path.join(out_dir, "Bookmark-Backup-Archive-ZH.jpg"),
            font_title_path="/System/Library/Fonts/Hiragino Sans GB.ttc",
            font_sub_path="/System/Library/Fonts/Hiragino Sans GB.ttc",
            font_title_index=2,
            font_sub_index=0,
            spacing=22,
            block_offset_y=20
        )




    # ==================== v3.0 EXISTING FEATURES ====================

    # English Version (Settings Page)
    settings_ui_en = "/Users/kk/Desktop/设置与初始化 en.png"
    if os.path.exists(settings_ui_en):
        generate_promo(
            bg_path=bg_path,
            icon_path=icon_path,
            ui_path=settings_ui_en,
            title_text="Preferences",
            subtitle_text="Configure flexible backup strategies and secure data recovery mechanisms",
            output_path=os.path.join(out_dir, "Bookmark-Backup-Settings-EN.jpg"),
            font_title_path="/System/Library/Fonts/HelveticaNeue.ttc",
            font_sub_path="/System/Library/Fonts/HelveticaNeue.ttc",
            font_title_index=1,
            font_sub_index=0,
            spacing=35,
            title_offset_y=8,
            block_offset_y=20
        )
    
    # Chinese Version (Settings Page)
    settings_ui_zh = "/Users/kk/Desktop/设置与初始化 zh.png"
    if os.path.exists(settings_ui_zh):
        generate_promo(
            bg_path=bg_path,
            icon_path=icon_path,
            ui_path=settings_ui_zh,
            title_text="偏好设置",
            subtitle_text="灵活配置多种备份策略，提供安全可靠的恢复机制",
            output_path=os.path.join(out_dir, "Bookmark-Backup-Settings-ZH.jpg"),
            font_title_path="/System/Library/Fonts/Hiragino Sans GB.ttc",
            font_sub_path="/System/Library/Fonts/Hiragino Sans GB.ttc",
            font_title_index=2,
            font_sub_index=0,
            spacing=22
        )

    # English Version (Backup History)
    history_ui_en = "/Users/kk/Desktop/备份历史html en.png"
    if os.path.exists(history_ui_en):
        generate_promo(
            bg_path=bg_path,
            icon_path=icon_path,
            ui_path=history_ui_en,
            title_text="Backup History",
            subtitle_text="Bookmark version management, making every modification fully traceable",
            output_path=os.path.join(out_dir, "Bookmark-Backup-History-EN.jpg"),
            font_title_path="/System/Library/Fonts/HelveticaNeue.ttc",
            font_sub_path="/System/Library/Fonts/HelveticaNeue.ttc",
            font_title_index=1,
            font_sub_index=0,
            spacing=35,
            title_offset_y=8,
            block_offset_y=40
        )

    # Chinese Version (Backup History)
    history_ui_zh = "/Users/kk/Desktop/备份历史html zh.png"
    if os.path.exists(history_ui_zh):
        generate_promo(
            bg_path=bg_path,
            icon_path=icon_path,
            ui_path=history_ui_zh,
            title_text="备份历史",
            subtitle_text="书签版本管理，让一切都有迹可循",
            output_path=os.path.join(out_dir, "Bookmark-Backup-History-ZH.jpg"),
            font_title_path="/System/Library/Fonts/Hiragino Sans GB.ttc",
            font_sub_path="/System/Library/Fonts/Hiragino Sans GB.ttc",
            font_title_index=2,
            font_sub_index=0,
            spacing=22,
            block_offset_y=20
        )

