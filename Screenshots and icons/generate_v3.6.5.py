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

def generate_promo(bg_path, icon_path, ui_path, title_text, subtitle_text, output_path, font_title_path, font_sub_path, font_title_index=0, font_sub_index=0, spacing=22, title_offset_y=0, block_offset_y=0, layout="center"):
    # 1. Background
    bg = Image.open(bg_path).convert("RGBA")
    bg = resize_and_crop(bg, (1280, 800))
    bg_w, bg_h = bg.size
    
    # 2. UI Screenshot
    ui = Image.open(ui_path).convert("RGBA")
    ui_ratio = ui.height / ui.width

    if layout == "left-icon":
        if ui_ratio > 0.62:
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
            target_ui_width = 960
            bottom_margin = 0
            icon_size = 140
            icon_y = 40
            max_ratio = 0.62
            title_font_size = 52
            sub_font_size = 28
            text_y_offset = 0
    else:  # center layout
        target_ui_width = 960
        bottom_margin = 0
        icon_size = 140
        icon_y = 40
        max_ratio = 0.58
        title_font_size = 52
        sub_font_size = 28
        text_y_offset = 0

    # Apply cropping if the screenshot exceeds the max allowed ratio
    if ui_ratio > max_ratio:
        crop_height = int(ui.width * max_ratio)
        ui = ui.crop((0, 0, ui.width, crop_height))
        ui_ratio = max_ratio

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
    if layout == "left-icon":
        icon_x = 40
    else:
        icon_x = (bg_w - icon_shadowed.width) // 2
    
    final_img = Image.new("RGBA", (bg_w, bg_h))
    final_img.paste(bg, (0, 0))
    final_img.paste(icon_shadowed, (icon_x, icon_y), icon_shadowed)
    
    # Text
    draw = ImageDraw.Draw(final_img)
    try:
        font_title = ImageFont.truetype(font_title_path, title_font_size, index=font_title_index)
        font_sub = ImageFont.truetype(font_sub_path, sub_font_size, index=font_sub_index)
    except Exception as e:
        print(f"Error loading font: {e}, falling back to default")
        font_title = ImageFont.load_default()
        font_sub = ImageFont.load_default()
            
    ui_y = bg_h - ui_shadowed.height - bottom_margin
    ui_x = (bg_w - ui_shadowed.width) // 2

    # Calculate text layout
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
        
    if layout == "left-icon":
        available_space = ui_y
        title_y = (available_space - total_text_h) // 2 + block_offset_y + text_y_offset
    else:
        icon_bottom = icon_y + icon_shadowed.height
        available_space = ui_y - icon_bottom
        title_y = icon_bottom + (available_space - total_text_h) // 2
        
    title_x = (bg_w - title_w) // 2
    
    # Draw Title
    draw.text((title_x, title_y - title_offset_y), title_text, font=font_title, fill=(20, 20, 20, 255))
    
    # Draw Subtitle with pill mask
    if subtitle_text:
        sub_x = (bg_w - sub_w) // 2
        sub_y = title_y + title_h + spacing
        
        pill_pad_x = 24
        pill_pad_y = 12
        pill_box = (
            sub_x - pill_pad_x, 
            sub_y + sub_bbox[1] - pill_pad_y, 
            sub_x + sub_w + pill_pad_x, 
            sub_y + sub_bbox[3] + pill_pad_y
        )
        
        overlay = Image.new('RGBA', final_img.size, (0, 0, 0, 0))
        overlay_draw = ImageDraw.Draw(overlay)
        try:
            overlay_draw.rounded_rectangle(pill_box, radius=(sub_bbox[3] - sub_bbox[1] + pill_pad_y * 2) // 2, fill=(0, 0, 0, 25))
        except AttributeError:
            overlay_draw.rectangle(pill_box, fill=(0, 0, 0, 25))
            
        final_img = Image.alpha_composite(final_img, overlay)
        draw = ImageDraw.Draw(final_img)
        draw.text((sub_x, sub_y), subtitle_text, font=font_sub, fill=(35, 35, 35, 255))
        
    final_img.paste(ui_shadowed, (ui_x, ui_y), ui_shadowed)
    
    final_img.save(output_path, "PNG")
    print(f"Generated successfully: {output_path}")

if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Input/Output folders
    v365_dir = os.path.join(script_dir, "v3.6.5")
    v365_out_dir = os.path.join(v365_dir, "assets")
    os.makedirs(v365_out_dir, exist_ok=True)
    
    # Background Image
    bg_path = os.path.join(script_dir, "背景图.png")
    if not os.path.exists(bg_path):
        bg_path = "/Users/kk/Desktop/ChatGPT Image 2026年5月6日 23_34_05.png"
        
    # Icon Image
    icon_path = "/Users/kk/Desktop/B.jpg"
    if not os.path.exists(icon_path):
        icon_path = os.path.join(os.path.dirname(script_dir), "Bookmark-Backup-main", "icons", "icon128.png")
        
    print(f"Using background: {bg_path}")
    print(f"Using icon: {icon_path}")
    
    # ---------------- 1. Main View (Left-Icon Layout) ----------------
    ui_main_zh = os.path.join(v365_dir, "主UI_v3.6.5 zh.png")
    if os.path.exists(ui_main_zh):
        generate_promo(
            bg_path=bg_path,
            icon_path=icon_path,
            ui_path=ui_main_zh,
            title_text="主视图",
            subtitle_text="主要操作界面在这里，快速直达您的所有内容。",
            output_path=os.path.join(v365_out_dir, "Bookmark-Backup-ZH.png"),
            font_title_path="/System/Library/Fonts/Hiragino Sans GB.ttc",
            font_sub_path="/System/Library/Fonts/Hiragino Sans GB.ttc",
            font_title_index=2,
            font_sub_index=0,
            spacing=22,
            layout="left-icon",
            block_offset_y=20
        )
    else:
        print(f"Missing source file: {ui_main_zh}")

    ui_main_en = os.path.join(v365_dir, "主UI_v3.6.5 en.png")
    if os.path.exists(ui_main_en):
        generate_promo(
            bg_path=bg_path,
            icon_path=icon_path,
            ui_path=ui_main_en,
            title_text="Main View",
            subtitle_text="Your primary interface to access and manage everything quickly",
            output_path=os.path.join(v365_out_dir, "Bookmark-Backup-EN.png"),
            font_title_path="/System/Library/Fonts/HelveticaNeue.ttc",
            font_sub_path="/System/Library/Fonts/HelveticaNeue.ttc",
            font_title_index=1,
            font_sub_index=0,
            spacing=35,
            title_offset_y=8,
            layout="left-icon",
            block_offset_y=20
        )
    else:
        print(f"Missing source file: {ui_main_en}")

    # ---------------- 2. Settings (Left-Icon Layout) ----------------
    ui_settings_zh = os.path.join(v365_dir, "设置与初始化_v3.6.5 zh.png")
    if os.path.exists(ui_settings_zh):
        generate_promo(
            bg_path=bg_path,
            icon_path=icon_path,
            ui_path=ui_settings_zh,
            title_text="偏好设置",
            subtitle_text="灵活配置多种备份策略，提供安全可靠的恢复机制。",
            output_path=os.path.join(v365_out_dir, "Bookmark-Backup-Settings-ZH.png"),
            font_title_path="/System/Library/Fonts/Hiragino Sans GB.ttc",
            font_sub_path="/System/Library/Fonts/Hiragino Sans GB.ttc",
            font_title_index=2,
            font_sub_index=0,
            spacing=22,
            layout="left-icon",
            block_offset_y=20
        )
    else:
        print(f"Missing source file: {ui_settings_zh}")

    ui_settings_en = os.path.join(v365_dir, "设置与初始化_v3.6.5 en.png")
    if os.path.exists(ui_settings_en):
        generate_promo(
            bg_path=bg_path,
            icon_path=icon_path,
            ui_path=ui_settings_en,
            title_text="Preferences",
            subtitle_text="Configure flexible backup strategies and secure data recovery mechanisms",
            output_path=os.path.join(v365_out_dir, "Bookmark-Backup-Settings-EN.png"),
            font_title_path="/System/Library/Fonts/HelveticaNeue.ttc",
            font_sub_path="/System/Library/Fonts/HelveticaNeue.ttc",
            font_title_index=1,
            font_sub_index=0,
            spacing=35,
            title_offset_y=8,
            layout="left-icon",
            block_offset_y=20
        )
    else:
        print(f"Missing source file: {ui_settings_en}")

    # ---------------- 3. Current Changes (Left-Icon Layout) ----------------
    ui_changes_zh = os.path.join(v365_dir, "当前变化_v3.6.5 zh.png")
    if os.path.exists(ui_changes_zh):
        generate_promo(
            bg_path=bg_path,
            icon_path=icon_path,
            ui_path=ui_changes_zh,
            title_text="当前变化",
            subtitle_text="清晰对比书签的增删移改，所有变化一目了然。",
            output_path=os.path.join(v365_out_dir, "Bookmark-Backup-Changes-ZH.png"),
            font_title_path="/System/Library/Fonts/Hiragino Sans GB.ttc",
            font_sub_path="/System/Library/Fonts/Hiragino Sans GB.ttc",
            font_title_index=2,
            font_sub_index=0,
            spacing=22,
            layout="left-icon",
            block_offset_y=20
        )
    else:
        print(f"Missing source file: {ui_changes_zh}")

    ui_changes_en = os.path.join(v365_dir, "当前变化_v3.6.5 en.png")
    if os.path.exists(ui_changes_en):
        generate_promo(
            bg_path=bg_path,
            icon_path=icon_path,
            ui_path=ui_changes_en,
            title_text="Current Changes",
            subtitle_text="Clearly compare bookmark additions, deletions, moves, and modifications at a glance",
            output_path=os.path.join(v365_out_dir, "Bookmark-Backup-Changes-EN.png"),
            font_title_path="/System/Library/Fonts/HelveticaNeue.ttc",
            font_sub_path="/System/Library/Fonts/HelveticaNeue.ttc",
            font_title_index=1,
            font_sub_index=0,
            spacing=35,
            title_offset_y=8,
            layout="left-icon",
            block_offset_y=20
        )
    else:
        print(f"Missing source file: {ui_changes_en}")
