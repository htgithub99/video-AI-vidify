from pathlib import Path

POINTER = "active-release.json"
MESSAGE = "Kho mô-đun đang hoạt động. Công cụ seed/migration kiểu cũ chỉ được ghi vào thư mục thử riêng."


def assert_legacy_library_target(directory):
    target = Path(directory).absolute()
    for candidate in (target, target.resolve()):
        if any((folder / POINTER).is_file() for folder in (candidate, *candidate.parents)):
            raise ValueError(MESSAGE)
