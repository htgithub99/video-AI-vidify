if __package__:
    from .runtime_text import RuntimeText as _CODE_TEXT
else:
    from runtime_text import RuntimeText as _CODE_TEXT
from pathlib import Path
POINTER = _CODE_TEXT.ACTIVE_RELEASE_JSON
MESSAGE = _CODE_TEXT.KHO_M_UN_ANG_HO_T_NG_C_NG_C_SEED_MIGRATION_KI_U_C_CH_C_GHI_V
def assert_legacy_library_target(directory):
    target = Path(directory).absolute()
    for candidate in (target, target.resolve()):
        if any((folder / POINTER).is_file() for folder in (candidate, *candidate.parents)):
            raise ValueError(MESSAGE)
