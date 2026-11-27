# Born-as hand pipeline (born4 / born4b, 16 videos)

Backup of the scripts and data used to build the 8 long videos and 8 Shorts by hand in the cloud workspace (27/11). The app's HyperFrames screen uses the same kit (`tools/born-as-kit`); these files are only needed to rebuild these 16 videos by hand.

- `build_plan.py <video>`: beats_<video>.py + bgs/new_ann.json + library catalogs -> voice/<video>/plan.json
- `make_short.py <video> <cut> <bust>`: Short plan and job folder (BORN_VERT=1)
- `new_bg.py`: bgs/new_spec.json -> bgs/new_ann.json (hand-annotated backgrounds)
- `run/longs.sh`, `run/shorts3.sh`: rebuild and check all videos; `run/sheets.sh` + `run/tile.py`: contact sheets; `run/fix.py`: the 27/11 library background fixes
- `voice/<video>/*.json`: plans, timings and word times (voice wav files are in the job folders)
- Paths inside the scripts point to the cloud workspace (/home/claude/four, /home/claude/kitv2); change ROOT/KIT to run them elsewhere.
- Images (assets, backgrounds) are not here: the job folders in tools/born-as-jobs hold the rendered copies, and the library holds the shared ones.
