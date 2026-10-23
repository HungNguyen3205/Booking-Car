import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

def extract_vehicle(input_path, output_path, crop_box=None, brand_text="HÀNH TRÌNH", text_pos=None):
    # Load image
    bgr = cv2.imread(input_path)
    if bgr is None:
        raise ValueError(f"Could not load {input_path}")
    h, w = bgr.shape[:2]

    # Convert to RGB
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)

    # Detect white/near-white background
    # Note: background is light white/gray (values > 230).
    # We do a floodfill from the borders to only mark external background
    mask = np.zeros((h + 2, w + 2), np.uint8)
    
    # Create grayscale for thresholding
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    
    # External floodfill from all 4 corners
    # Tolerance: pixels within 25 of pure white/gray
    flood_val = 255
    bg_mask = np.zeros((h, w), dtype=np.uint8)
    
    # We can use grabcut with an initial bounding box around the vehicle
    # The vehicle is roughly inside [x: 50..w-50, y: 50..h-40]
    rect = (40, 40, w - 80, h - 70)
    
    bgd_model = np.zeros((1, 65), np.float64)
    fgd_model = np.zeros((1, 65), np.float64)
    
    gc_mask = np.zeros((h, w), np.uint8)
    # Fill border as definite background
    gc_mask[:30, :] = cv2.GC_BGD
    gc_mask[-30:, :] = cv2.GC_BGD
    gc_mask[:, :30] = cv2.GC_BGD
    gc_mask[:, -30:] = cv2.GC_BGD
    
    # White pixels near borders are definitely background
    is_white = (rgb[:, :, 0] > 235) & (rgb[:, :, 1] > 235) & (rgb[:, :, 2] > 235)
    # Any white pixel within 100px from top or sides is definite background
    gc_mask[is_white & (np.arange(h)[:, None] < 120)] = cv2.GC_BGD
    gc_mask[is_white & (np.arange(h)[:, None] > h - 40)] = cv2.GC_BGD
    gc_mask[is_white & (np.arange(w)[None, :] < 80)] = cv2.GC_BGD
    gc_mask[is_white & (np.arange(w)[None, :] > w - 80)] = cv2.GC_BGD
    
    # Inside the rect, probable foreground
    inside_rect = np.zeros((h, w), dtype=bool)
    inside_rect[rect[1]:rect[1]+rect[3], rect[0]:rect[0]+rect[2]] = True
    gc_mask[inside_rect & (gc_mask != cv2.GC_BGD)] = cv2.GC_PR_FGD
    
    # Center of vehicle is definitely foreground (dark pixels)
    is_dark = (rgb[:, :, 0] < 80) & (rgb[:, :, 1] < 100) & (rgb[:, :, 2] < 120)
    gc_mask[is_dark & inside_rect] = cv2.GC_FGD

    # Run GrabCut
    cv2.grabCut(rgb, gc_mask, rect, bgd_model, fgd_model, 5, cv2.GC_INIT_WITH_MASK)
    
    # Extract foreground mask
    final_mask = np.where((gc_mask == cv2.GC_FGD) | (gc_mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)

    # Refine mask: smooth edges slightly with gaussian blur to avoid jaggies
    # Find largest connected component (the vehicle)
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(final_mask)
    if num_labels > 1:
        # label 0 is background
        largest_label = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
        final_mask = np.where(labels == largest_label, 255, 0).astype(np.uint8)
        
    # Fill small holes inside the vehicle (e.g. if any white reflection was marked bg)
    contours, _ = cv2.findContours(final_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours:
        c = max(contours, key=cv2.contourArea)
        cv2.drawContours(final_mask, [c], -1, 255, thickness=cv2.FILLED)
        
    # Soft alpha feathering around the boundary (1.5px)
    alpha = cv2.GaussianBlur(final_mask, (5, 5), 1.2)
    
    # Combine RGB + Alpha
    rgba = np.dstack((rgb, alpha))
    
    # Convert to PIL
    pil_img = Image.fromarray(rgba, 'RGBA')
    
    # If brand text and text position given, let's paint HÀNH TRÌNH on the bus side
    if brand_text and text_pos:
        draw = ImageDraw.Draw(pil_img)
        # Cover old text with body color
        bx, by, bw, bh = text_pos
        # Sample body color near the position
        body_color = tuple(rgb[by + bh // 2, bx - 10]) + (255,)
        draw.rectangle([bx, by, bx + bw, by + bh], fill=body_color)
        
        # Draw teal wave accent and "HÀNH TRÌNH" text
        # Simple stylish representation:
        try:
            font = ImageFont.truetype("arial.ttf", 26)
        except:
            font = ImageFont.load_default()
            
        draw.text((bx + 10, by + 4), brand_text, fill=(255, 255, 255, 255), font=font)
        # Teal highlight wave
        draw.line([(bx + 10, by + bh - 2), (bx + bw - 10, by + bh - 2)], fill=(0, 151, 167, 255), width=3)

    # Save as PNG
    pil_img.save(output_path, 'PNG')
    print(f"Saved transparent PNG: {output_path} (size: {pil_img.size})")

if __name__ == '__main__':
    extract_vehicle(
        'public/assets/images/bus_coach_sleeper.jpg',
        'public/assets/images/bus_coach_sleeper.png',
        text_pos=(660, 320, 290, 60) # position of "EXECUTIVE TOURS" text
    )
    extract_vehicle(
        'public/assets/images/bus_limousine_vip.jpg',
        'public/assets/images/bus_limousine_vip.png',
        text_pos=(610, 375, 170, 35) # position of "EXECUTRAVEL"
    )
    extract_vehicle(
        'public/assets/images/bus_cabin_royal.jpg',
        'public/assets/images/bus_cabin_royal.png',
        text_pos=(1100, 420, 150, 40) # position of "AURORA"
    )
