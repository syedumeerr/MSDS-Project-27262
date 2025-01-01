"""Discover Lion Box."""
from . import MDNSDiscoverable


class Discoverable(MDNSDiscoverable):
    """Add support for discovering Lion Box."""

    def __init__(self, nd):
        super(Discoverable, self).__init__(nd, '_lion._tcp.local.')
