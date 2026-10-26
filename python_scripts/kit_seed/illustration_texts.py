class IllustrationText:
    VERSION = 1
    ROOT = "scratch/illustration-library-20261024"
    LIBRARY = "storage/output/motion-video/kit-library"
    TYPES = ("style_pack", "character_kit", "prop", "set", "set_base", "set_piece")
    CHIBI_HEAD = 0.42
    CHIBI_HEAD_WIDTH = 1.06
    SPRITE_HEIGHT = 0.84
    SPRITE_HEAD_CENTER = -0.57
    SPRITE_BODY_HEIGHT = 0.395
    SPRITE_BODY_WIDTH = 0.29
    LEG_TOP = 310
    LEG_HEIGHT = 250
    SHIRT_OLD = "L{0} 400 L{1} 400"
    SHIRT_NEW = "L{0} 330 L{1} 330"
    SHIRT_PATH_OLD = r"L\s*([\d.]+)\s+400\s+L\s*([\d.]+)\s+400"
    SHIRT_PATH_NEW = r"L\1 330 L\2 330"
    SPRITE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">%s</svg>'
    HEAD_GROUP = '<g transform="translate(%s %s) scale(%s)">%s</g>'
    SEED = "seed"
    STATUS = "normalized_pending_visual_review"
    HISTORICAL = "historical_not_selected"
    CHIBI = "chibi_folk"
    LAYER_DIR = "layers"
    LAYER_PREFIX = "layer-"
    REPORT = "manifest.json"
    STAGED = "staged"
    BEFORE = "before"
    CONFLICT = "Library changed since staging: "
    TOTAL = "Processed library records"
    SVG_TAG = r"<[A-Za-z][^>]*>"
    SVG_ATTRIBUTE = r"([A-Za-z_:][\w:.-]*)\s*=\s*([\"'])(.*?)\2"
    GALLERY = "index.html"
    BOARDS = "boards"
    REVIEW = "render-review.json"
    COMPARISON = "comparison-review.json"
    GALLERY_TITLE = "Kho minh họa: tài nguyên cũ và ảnh trước–sau"
    GALLERY_NOTE = "Ảnh dựng thành công không đồng nghĩa đã duyệt nội dung. Xem cả vị trí người, đồ vật và mặt đỡ. Nhân vật đứng/ngồi/nằm trên nền trống dùng để kiểm tỷ lệ."
    GALLERY_HEAD = '<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>%s</title><style>body{margin:24px;background:#161a22;color:#eee;font:16px system-ui}img{width:100%%;height:auto}section{max-width:1600px;margin:24px auto}a{color:#accdff}details{margin:20px 0}summary{cursor:pointer}</style><h1>%s</h1><p>%s</p>'
    GALLERY_SECTION = '<section><h2>%s</h2><a href="boards/%s"><img loading="lazy" src="boards/%s" alt="%s"></a></section>'
    GALLERY_ROW = '<li>%s · %s · %s</li>'
    BEFORE_LABEL = "TRƯỚC"
    AFTER_LABEL = "SAU"
    FONT = "C:/Windows/Fonts/arial.ttf"
