from PIL import Image
import os

def create_animation():
    frame_files = [
        ('docs/screenshots/motion_demo/01_sleeper_idle.png', 1400),
        ('docs/screenshots/motion_demo/02_sleeper_exiting_right.png', 400),
        ('docs/screenshots/motion_demo/03_limousine_entering_left.png', 400),
        ('docs/screenshots/motion_demo/04_limousine_settled.png', 1400),
        ('docs/screenshots/motion_demo/05_limousine_exiting_right.png', 400),
        ('docs/screenshots/motion_demo/06_cabin_entering_left.png', 400),
        ('docs/screenshots/motion_demo/07_cabin_settled.png', 1600),
    ]

    images = []
    durations = []

    for path, dur in frame_files:
        if os.path.exists(path):
            img = Image.open(path).convert('RGB')
            # Resize slightly to 960x600 for lightweight embedding
            img_resized = img.resize((960, 600), Image.Resampling.LANCZOS)
            images.append(img_resized)
            durations.append(dur)
        else:
            print(f"Warning: {path} not found")

    if images:
        out_webp = 'docs/screenshots/vehicle_transition_demo.webp'
        images[0].save(
            out_webp,
            save_all=True,
            append_images=images[1:],
            duration=durations,
            loop=0,
            quality=88
        )
        print(f"Successfully generated animated WebP: {out_webp} ({os.path.getsize(out_webp)} bytes)")

        out_gif = 'docs/screenshots/vehicle_transition_demo.gif'
        images[0].save(
            out_gif,
            save_all=True,
            append_images=images[1:],
            duration=durations,
            loop=0,
            optimize=True
        )
        print(f"Successfully generated animated GIF: {out_gif} ({os.path.getsize(out_gif)} bytes)")

if __name__ == '__main__':
    create_animation()
