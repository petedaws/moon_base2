"""Render animated GLB characters to sprite frames with headless Blender (bpy).

Usage:
  python3 tools/render_sprites.py --out DIR --walk walk.glb --idle idle.glb --talk talk.glb

For each animation, renders N evenly spaced frames from 4 facing directions
(orthographic camera, transparent background) at 256px tall; the TS pipeline
downscales and quantizes afterwards.

Requires: pip install -r tools/requirements.txt  (bpy wheel, Python-version-locked)
Renderer: Workbench (no GPU needed headless).
"""

import argparse
import math
import sys

try:
    import bpy
except ImportError:
    sys.exit("bpy not installed. Run: pip install -r tools/requirements.txt")

FRAME_COUNTS = {"walk": 6, "idle": 1, "talk": 2}
DIRECTIONS = {"down": 0, "left": 90, "right": 270, "up": 180}  # model yaw degrees
RES = 256


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.render.film_transparent = True
    scene.render.resolution_x = RES // 2
    scene.render.resolution_y = RES
    scene.display.shading.light = "FLAT"
    scene.display.shading.color_type = "TEXTURE"
    return scene


def setup_camera(scene, target_height):
    cam_data = bpy.data.cameras.new("cam")
    cam_data.type = "ORTHO"
    cam_data.ortho_scale = target_height * 1.15
    cam = bpy.data.objects.new("cam", cam_data)
    scene.collection.objects.link(cam)
    cam.location = (0, -10, target_height * 0.5)
    cam.rotation_euler = (math.radians(90), 0, 0)
    scene.camera = cam


def model_root_and_height():
    roots = [o for o in bpy.context.scene.objects if o.parent is None and o.type != "CAMERA"]
    height = max(
        (o.dimensions.z for o in bpy.context.scene.objects if o.type in ("MESH", "ARMATURE")),
        default=1.8,
    )
    return roots, height


def render_anim(glb_path, anim_name, out_dir):
    scene = reset_scene()
    bpy.ops.import_scene.gltf(filepath=glb_path)
    roots, height = model_root_and_height()
    setup_camera(scene, height)

    frame_count = FRAME_COUNTS[anim_name]
    anim_end = scene.frame_end if scene.frame_end > 1 else 1

    for dir_name, yaw in DIRECTIONS.items():
        for root in roots:
            root.rotation_euler = (root.rotation_euler[0], root.rotation_euler[1], math.radians(yaw))
        for i in range(frame_count):
            frame = 1 + int((anim_end - 1) * (i / max(1, frame_count)))
            scene.frame_set(frame)
            scene.render.filepath = f"{out_dir}/{anim_name}-{dir_name}-{i}.png"
            bpy.ops.render.render(write_still=True)
            print(f"rendered {anim_name}-{dir_name}-{i}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--walk", required=True)
    ap.add_argument("--idle", required=True)
    ap.add_argument("--talk", required=True)
    args = ap.parse_args()

    import os

    os.makedirs(args.out, exist_ok=True)
    for name in ("walk", "idle", "talk"):
        render_anim(getattr(args, name), name, args.out)


if __name__ == "__main__":
    main()
