import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

def process_bus_image(
    input_path,
    output_png_path,
    text_bbox=None,
    brand_text="HÀNH TRÌNH",
    brand_sub="PREMIUM COACH",
    brand_pos=None
):
    print(f"Processing {input_path} -> {output_png_path}...")
    # Load image
    bgr = cv2.imread(input_path)
    if bgr is None:
        raise ValueError(f"Could not read {input_path}")
    h, w = bgr.shape[:2]

    # Step 1: Inpaint foreign text if specified
    if text_bbox:
        x1, y1, x2, y2 = text_bbox
        mask = np.zeros((h, w), dtype=np.uint8)
        mask[y1:y2, x1:x2] = 255
        # Inpaint with Navier-Stokes
        bgr = cv2.inpaint(bgr, mask, 7, cv2.INPAINT_TELEA)

    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB).astype(np.float32)

    # Step 2: Floodfill from corners to find outside background
    # Luminance
    gray = 0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]
    
    # White background threshold: pixels >= 238
    is_white = (gray >= 238)
    
    # Binary image where 255 is candidate background, 0 is bus/shadow
    bin_map = np.where(is_white, 255, 0).astype(np.uint8)
    
    # Floodfill from multiple border points to guarantee covering all external background
    ff_mask = np.zeros((h + 2, w + 2), dtype=np.uint8)
    seeds = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (0, h // 4), (w - 1, h // 4)]
    
    flood_img = bin_map.copy()
    for sx, sy in seeds:
        if flood_img[sy, sx] == 255:
            cv2.floodFill(flood_img, ff_mask, (sx, sy), 128)
            
    is_external_bg = (flood_img == 128)

    # Now calculate alpha:
    # 0 for external background
    # 255 for the solid bus
    # Smooth gradient at boundary
    alpha = np.ones((h, w), dtype=np.float32) * 255.0
    alpha[is_external_bg] = 0.0

    # Also check floor area (bottom 20%): soft contact shadow
    # For pixels near the floor that are light grey (gray > 180 and gray < 248):
    # calculate alpha = 255 * (1.0 - (gray - 120) / (250 - 120))
    floor_y = int(h * 0.75)
    floor_zone = np.zeros((h, w), dtype=bool)
    floor_zone[floor_y:, :] = True
    
    # Floor shadow: in the bottom area, where gray is between 130 and 248 and connected to background
    shadow_pixels = floor_zone & (gray >= 130) & (gray < 248) & (~is_external_bg)
    # Give soft shadow transparency
    shadow_alpha = (248.0 - gray) / (248.0 - 130.0) * 160.0
    shadow_alpha = np.clip(shadow_alpha, 0.0, 255.0)
    
    # Apply shadow alpha only to the subtle floor area below wheels
    # (Wheels themselves have gray < 100 so they stay 255 solid!)
    alpha[shadow_pixels] = shadow_alpha[shadow_pixels]

    # Anti-alias the outer boundary of the bus with a 3x3 guided filter / gaussian
    # Find boundary pixels
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    dilated_bg = cv2.dilate(is_external_bg.astype(np.uint8), kernel)
    boundary = (dilated_bg > 0) & (~is_external_bg)
    
    # Smooth boundary alpha based on distance from white (250)
    for y, x in np.argwhere(boundary):
        lum = gray[y, x]
        if lum > 210:
            alpha[y, x] = max(0.0, min(255.0, (250.0 - lum) / 40.0 * 255.0))

    # Assemble RGBA
    alpha = np.clip(alpha, 0.0, 255.0).astype(np.uint8)
    rgba = np.dstack((rgb.astype(np.uint8), alpha))
    pil_img = Image.fromarray(rgba, 'RGBA')

    # Step 3: Draw crisp "HÀNH TRÌNH" brand logo on bus side if brand_pos given
    if brand_pos:
        bx, by = brand_pos
        draw = ImageDraw.Draw(pil_img)
        try:
            font_main = ImageFont.truetype("arialbd.ttf", 32)
            font_sub = ImageFont.truetype("arial.ttf", 13)
        except:
            font_main = ImageFont.load_default()
            font_sub = ImageFont.load_default()
            
        # Draw teal accent wave
        draw.line([(bx - 20, by + 18), (bx - 6, by + 14), (bx + 8, by + 22), (bx + 24, by + 18)], fill=(0, 151, 167, 255), width=4)
        # Brand text
        draw.text((bx + 32, by), brand_text, fill=(255, 255, 255, 245), font=font_main)
        if brand_sub:
            draw.text((bx + 34, by + 34), brand_sub, fill=(224, 247, 250, 210), font=font_sub)

    # Save PNG
    pil_img.save(output_png_path, 'PNG')
    print(f"Successfully generated {output_png_path} ({pil_img.size})")

    # Generate test image on navy background to verify
    navy_bg = Image.new('RGBA', pil_img.size, (16, 39, 68, 255))
    navy_comp = Image.alpha_composite(navy_bg, pil_img)
    test_navy_path = output_png_path.replace('.png', '_on_navy.jpg')
    navy_comp.convert('RGB').save(test_navy_path, 'JPEG', quality=95)
    print(f"Generated test on navy: {test_navy_path}")

    # Generate test image on cream background to verify
    cream_bg = Image.new('RGBA', pil_img.size, (247, 244, 236, 255))
    cream_comp = Image.alpha_composite(cream_bg, pil_img)
    test_cream_path = output_png_path.replace('.png', '_on_cream.jpg')
    cream_comp.convert('RGB').save(test_cream_path, 'JPEG', quality=95)
    print(f"Generated test on cream: {test_cream_path}")

if __name__ == '__main__':
    # 1. Coach Sleeper
    process_bus_image(
        'public/assets/images/bus_coach_sleeper.jpg',
        'public/assets/images/bus_coach_sleeper.png',
        text_bbox=(660, 430, 965, 520), # inpaint "EXECUTIVE TOURS"
        brand_pos=(700, 440)
    )

    # 2. Limousine VIP
    process_bus_image(
        'public/assets/images/bus_limousine_vip.jpg',
        'public/assets/images/bus_limousine_vip.png',
        text_bbox=(610, 490, 810, 545), # inpaint "EXECUTRAVEL"
        brand_pos=(630, 500)
    )

    # 3. Cabin Royal
    process_bus_image(
        'public/assets/images/bus_cabin_royal.jpg',
        'public/assets/images/bus_cabin_royal.png',
        text_bbox=(1100, 540, 1260, 600), # inpaint "AURORA"
        brand_pos=(1100, 545)
    )
