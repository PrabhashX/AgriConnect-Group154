"""Package the linked Android resources with 4-byte ZIP entry alignment."""
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_STORED
import struct
import sys

build = Path(sys.argv[1])
files = [(p, p.relative_to(build / 'linked').as_posix()) for p in sorted((build / 'linked').rglob('*')) if p.is_file()]
files.append((build / 'classes.dex', 'classes.dex'))
with ZipFile(build / 'aligned.apk', 'w', compression=ZIP_STORED) as archive:
    for source, name in files:
        info = ZipInfo(name, date_time=(2026, 10, 8, 0, 0, 0))
        info.compress_type = ZIP_STORED
        offset = archive.fp.tell() + 30 + len(name.encode('utf-8'))
        pad = (-offset) % 4
        if pad:
            info.extra = struct.pack('<HH', 0xFFFF, pad) + bytes(pad)
        archive.writestr(info, source.read_bytes())
with ZipFile(build / 'aligned.apk') as archive:
    assert archive.testzip() is None
    assert {'AndroidManifest.xml', 'resources.arsc', 'classes.dex', 'assets/index.html'} <= set(archive.namelist())
print('Android archive packaged and validated.')
