import sys
import json
import os
import base64
import subprocess
import traceback
from PIL import Image

def write_ken_burns_frames_to_pipe(image_path, width, height, duration, fps, style_index, proc):
    try:
        img = Image.open(image_path)
    except Exception as e:
        img = Image.new('RGB', (width, height), color='black')
        
    img = img.convert('RGB')
    w_orig, h_orig = img.size
    
    scale_factor = max(width / w_orig, height / h_orig)
    w_new = float(w_orig * scale_factor)
    h_new = float(h_orig * scale_factor)
    
    img_resized = img.resize((int(w_new), int(h_new)), Image.Resampling.LANCZOS)
    total_frames = int(duration * fps)
    style = style_index % 8
    
    try:
        for j in range(total_frames):
            t = j / max(total_frames - 1, 1)
            t_smooth = t * t * (3.0 - 2.0 * t)
            
            if style == 0:
                z = 1.0 + 0.12 * t_smooth
                w_crop = width / z
                h_crop = height / z
                x0 = (w_new - w_crop) / 2.0
                y0 = (h_new - h_crop) / 2.0
            elif style == 1:
                z = 1.12 - 0.12 * t_smooth
                w_crop = width / z
                h_crop = height / z
                x0 = (w_new - w_crop) / 2.0
                y0 = (h_new - h_crop) / 2.0
            elif style == 2:
                z = 1.10
                w_crop = width / z
                h_crop = height / z
                y0 = (h_new - h_crop) / 2.0
                x_max = w_new - w_crop
                x0 = x_max * t_smooth
            elif style == 3:
                z = 1.10
                w_crop = width / z
                h_crop = height / z
                y0 = (h_new - h_crop) / 2.0
                x_max = w_new - w_crop
                x0 = x_max * (1.0 - t_smooth)
            elif style == 4:
                z = 1.10
                w_crop = width / z
                h_crop = height / z
                x0 = (w_new - w_crop) / 2.0
                y_max = h_new - h_crop
                y0 = y_max * (1.0 - t_smooth)
            elif style == 5:
                z = 1.10
                w_crop = width / z
                h_crop = height / z
                x0 = (w_new - w_crop) / 2.0
                y_max = h_new - h_crop
                y0 = y_max * t_smooth
            elif style == 6:
                z = 1.12
                w_crop = width / z
                h_crop = height / z
                x_max = w_new - w_crop
                y_max = h_new - h_crop
                x0 = x_max * t_smooth
                y0 = y_max * t_smooth
            else:
                z = 1.15 - 0.08 * t_smooth
                w_crop = width / z
                h_crop = height / z
                x_max = w_new - w_crop
                y_max = h_new - h_crop
                x0 = x_max * (0.8 - 0.6 * t_smooth)
                y0 = y_max * (0.2 + 0.6 * t_smooth)
                
            x0 = max(0.0, min(x0, w_new - w_crop))
            y0 = max(0.0, min(y0, h_new - h_crop))
            x1 = x0 + w_crop
            y1 = y0 + h_crop
            
            final_frame = img_resized.transform(
                (width, height),
                Image.Transform.EXTENT,
                (x0, y0, x1, y1),
                resample=Image.Resampling.BICUBIC
            )
            
            proc.stdin.write(final_frame.tobytes())
    except BrokenPipeError:
        pass

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
                subprocess.run([ffmpegCmd, "-y", "-f", "lavfi", "-i", f"color=c=black:s={width}x{height}", "-frames:v", "1", imgPath], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                
            hasAudio = False
            if audio_b64:
                audio_data = clean_base64(audio_b64)
                with open(audioPath, "wb") as f:
                    f.write(base64.b64decode(audio_data))
                hasAudio = True
                
            cmd = [
                ffmpegCmd, "-y",
                "-f", "rawvideo",
                "-pix_fmt", "rgb24",
                "-s", f"{width}x{height}",
                "-r", str(fps),
                "-i", "-"
            ]
            
            fade_dur = min(0.2, duration / 4.0)
            if hasAudio:
                cmd.extend(["-i", audioPath])
                af_effect = f"afade=t=in:st=0:d={fade_dur},afade=t=out:st={max(0, duration-fade_dur)}:d={fade_dur}"
            else:
                cmd.extend(["-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo"])
                af_effect = f"afade=t=in:st=0:d={fade_dur},afade=t=out:st={max(0, duration-fade_dur)}:d={fade_dur}"
                
            trans_mode = i % 4
            if trans_mode == 0:
                vf_effect = f"fade=t=in:st=0:d={fade_dur}:color=black,fade=t=out:st={max(0, duration-fade_dur)}:d={fade_dur}:color=black"
            elif trans_mode == 1:
                vf_effect = f"fade=t=in:st=0:d={fade_dur}:color=white,fade=t=out:st={max(0, duration-fade_dur)}:d={fade_dur}:color=white"
            elif trans_mode == 2:
                vf_effect = f"fade=t=in:st=0:d={fade_dur},fade=t=out:st={max(0, duration-fade_dur)}:d={fade_dur}"
            else:
                vf_effect = f"fade=t=in:st=0:d=0.08"
            
            cmd.extend([
                "-map", "0:v:0",
                "-map", "1:a:0",
                "-c:v", "libx264", "-b:v", bitrate,
                "-pix_fmt", "yuv420p",
                "-c:a", "aac", "-b:a", "128k",
                "-vf", vf_effect,
                "-af", af_effect,
                "-t", str(duration),
                "-shortest", outPath
            ])
            
            proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            
            write_ken_burns_frames_to_pipe(imgPath, width, height, duration, fps, i, proc)
            
            proc.stdin.close()
            proc.wait()
            
            if proc.returncode != 0:
                raise Exception(f"FFmpeg part generation failed with code {proc.returncode}")
                
            videoParts.append(f"file 'part_{idx}.mp4'")
            
            try:
                os.remove(imgPath)
            except:
                pass
            if hasAudio:
                try:
                    os.remove(audioPath)
                except:
                    pass
            
        listPath = os.path.join(tempDir, "list.txt")
        with open(listPath, "w", encoding='utf-8') as f:
            f.write("\n".join(videoParts))
            
        assetsDir = os.path.dirname(finalOutputPath)
        if not os.path.exists(assetsDir):
            os.makedirs(assetsDir, exist_ok=True)
            
        tempFinalPath = os.path.join(tempDir, "temp_final.mp4")
        concatCmd = [ffmpegCmd, "-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", tempFinalPath]
        subprocess.run(concatCmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        globalAudioPath = config.get("globalAudioPath")
        if globalAudioPath and os.path.exists(globalAudioPath):
            mergeAudioCmd = [
                ffmpegCmd, "-y", "-i", tempFinalPath, "-i", globalAudioPath,
                "-map", "0:v:0", "-map", "1:a:0",
                "-c:v", "copy", "-c:a", "aac", "-shortest", finalOutputPath
            ]
            subprocess.run(mergeAudioCmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        else:
            if os.path.exists(finalOutputPath):
                os.remove(finalOutputPath)
            os.rename(tempFinalPath, finalOutputPath)
        
        print(json.dumps({"success": True, "url": finalOutputUrl}))
        
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e), "traceback": traceback.format_exc()}))
        sys.exit(1)

if __name__ == "__main__":
    main()
