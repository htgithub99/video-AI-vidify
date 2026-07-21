import sys
import json
import os
import base64
import subprocess
import traceback

def main():
    try:
        if len(sys.argv) < 2:
            raise Exception("Missing config JSON file path")
        
        config_path = sys.argv[1]
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
            
        tempDir = config.get("tempDir")
        ffmpegCmd = config.get("ffmpegCmd", "ffmpeg")
        width = config.get("width", 1280)
        height = config.get("height", 720)
        fps = config.get("fps", 30)
        bitrate = config.get("bitrate", "2500k")
        finalOutputPath = config.get("finalOutputPath")
        finalOutputUrl = config.get("finalOutputUrl")
        scenes = config.get("scenes", [])
        
        if not os.path.exists(tempDir):
            os.makedirs(tempDir, exist_ok=True)
            
        videoParts = []
        
        # Xoá phần header nếu base64 có chứa data header
        def clean_base64(b64_str):
            if b64_str and "base64," in b64_str:
                return b64_str.split("base64,")[1]
            return b64_str

        for i, scene in enumerate(scenes):
            idx = str(i).zfill(3)
            imgPath = os.path.join(tempDir, f"img_{idx}.jpg")
            audioPath = os.path.join(tempDir, f"audio_{idx}.mp3")
            outPath = os.path.join(tempDir, f"part_{idx}.mp4")
            
            img_b64 = scene.get("imageBase64")
            audio_b64 = scene.get("audioBase64")
            duration = scene.get("duration", 5)
            
            if img_b64:
                img_data = clean_base64(img_b64)
                with open(imgPath, "wb") as f:
                    f.write(base64.b64decode(img_data))
            else:
                subprocess.run([ffmpegCmd, "-f", "lavfi", "-i", f"color=c=black:s={width}x{height}", "-frames:v", "1", imgPath], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                
            hasAudio = False
            if audio_b64:
                audio_data = clean_base64(audio_b64)
                with open(audioPath, "wb") as f:
                    f.write(base64.b64decode(audio_data))
                hasAudio = True
                
            vf_scale = f"scale={width}:{height}:force_original_aspect_ratio=decrease,pad={width}:{height}:(ow-iw)/2:(oh-ih)/2"
            
            cmd = [ffmpegCmd, "-y", "-loop", "1", "-i", imgPath]
            
            if hasAudio:
                cmd.extend(["-i", audioPath])
            else:
                cmd.extend(["-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo"])
                
            cmd.extend([
                "-c:v", "libx264", "-b:v", bitrate,
                "-c:a", "aac", "-b:a", "128k",
                "-r", str(fps),
                "-vf", vf_scale,
                "-t", str(duration),
                "-pix_fmt", "yuv420p",
                "-shortest", outPath
            ])
            
            subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            videoParts.append(f"file 'part_{idx}.mp4'")
            
        listPath = os.path.join(tempDir, "list.txt")
        with open(listPath, "w", encoding='utf-8') as f:
            f.write("\n".join(videoParts))
            
        assetsDir = os.path.dirname(finalOutputPath)
        if not os.path.exists(assetsDir):
            os.makedirs(assetsDir, exist_ok=True)
            
        concatCmd = [ffmpegCmd, "-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", finalOutputPath]
        subprocess.run(concatCmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        print(json.dumps({"success": True, "url": finalOutputUrl}))
        
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e), "traceback": traceback.format_exc()}))
        sys.exit(1)

if __name__ == "__main__":
    main()
